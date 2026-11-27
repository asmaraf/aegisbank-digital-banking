import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getMonthLabel(date: Date): string {
  return date.toLocaleString("en-US", { month: "short", year: "2-digit" });
}

export async function GET() {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const { role, id: userId } = session.user;

  try {
    if (role === "ADMIN" || role === "STAFF") {
      const [
        totalCustomers,
        accounts,
        transactions,
        loans,
        pendingRequestsCount,
        flaggedTransactionsCount,
      ] = await Promise.all([
        prisma.user.count({ where: { role: "CUSTOMER" } }),
        prisma.bankAccount.findMany({
          select: { balance: true, accountType: true, status: true },
        }),
        prisma.transaction.findMany({
          where: { status: "COMPLETED" },
          orderBy: { createdAt: "asc" },
          select: { type: true, amount: true, createdAt: true },
        }),
        prisma.loanApplication.findMany({
          select: { status: true, requestedAmount: true },
        }),
        prisma.depositWithdrawRequest.count({ where: { status: "PENDING" } }),
        prisma.transaction.count({ where: { isFlagged: true } }),
      ]);

      const totalBalance = accounts.reduce((acc, a) => acc + Number(a.balance), 0);
      const totalDeposits = transactions
        .filter((t) => t.type === "DEPOSIT")
        .reduce((acc, t) => acc + Number(t.amount), 0);
      const totalWithdrawals = transactions
        .filter((t) => t.type === "WITHDRAWAL")
        .reduce((acc, t) => acc + Number(t.amount), 0);
      const pendingLoans = loans.filter(
        (l) => l.status === "PENDING" || l.status === "UNDER_REVIEW"
      ).length;

      // Monthly volume & deposit vs withdrawal
      const monthlyMap = new Map<
        string,
        { month: string; deposits: number; withdrawals: number; transfers: number; volume: number }
      >();

      for (const tx of transactions) {
        const label = getMonthLabel(tx.createdAt);
        const current = monthlyMap.get(label) || {
          month: label,
          deposits: 0,
          withdrawals: 0,
          transfers: 0,
          volume: 0,
        };
        const amt = Number(tx.amount);
        current.volume += amt;
        if (tx.type === "DEPOSIT") current.deposits += amt;
        else if (tx.type === "WITHDRAWAL") current.withdrawals += amt;
        else if (tx.type === "TRANSFER") current.transfers += amt;
        monthlyMap.set(label, current);
      }

      // Account Distribution
      const accountDistMap = new Map<string, number>();
      for (const acc of accounts) {
        accountDistMap.set(acc.accountType, (accountDistMap.get(acc.accountType) || 0) + 1);
      }
      const accountDistribution = Array.from(accountDistMap.entries()).map(([name, value]) => ({
        name,
        value,
      }));

      // Loan Approval Statistics
      const loanStatMap = new Map<string, number>();
      for (const l of loans) {
        loanStatMap.set(l.status, (loanStatMap.get(l.status) || 0) + 1);
      }
      const loanStatistics = Array.from(loanStatMap.entries()).map(([name, value]) => ({
        name: name.replace("_", " "),
        value,
      }));

      return NextResponse.json({
        kpis: {
          totalCustomers,
          totalAccounts: accounts.length,
          totalBalance,
          totalDeposits,
          totalWithdrawals,
          totalTransactions: transactions.length,
          pendingLoans,
          pendingRequestsCount,
          flaggedTransactionsCount,
        },
        monthlyActivity: Array.from(monthlyMap.values()),
        accountDistribution,
        loanStatistics,
      });
    }

    // CUSTOMER analytics
    const customerAccounts = await prisma.bankAccount.findMany({
      where: { userId },
      select: { id: true, balance: true, accountNumber: true, accountType: true, status: true },
    });
    const accountIds = customerAccounts.map((a) => a.id);

    const [transactions, activeLoans] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          status: "COMPLETED",
          OR: [
            { senderAccountId: { in: accountIds } },
            { receiverAccountId: { in: accountIds } },
          ],
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.loanApplication.findMany({
        where: { userId, status: { in: ["ACTIVE", "APPROVED"] } },
        select: { id: true, loanType: true, remainingBalance: true, approvedAmount: true, status: true },
      }),
    ]);

    const totalBalance = customerAccounts.reduce((sum, a) => sum + Number(a.balance), 0);

    let totalDeposits = 0;
    let totalWithdrawals = 0;
    const monthlyMap = new Map<
      string,
      { month: string; deposits: number; spending: number }
    >();
    const typeDistMap = new Map<string, number>();

    for (const tx of transactions) {
      const amt = Number(tx.amount);
      const isIncoming = tx.receiverAccountId && accountIds.includes(tx.receiverAccountId);
      const isOutgoing = tx.senderAccountId && accountIds.includes(tx.senderAccountId);

      if (tx.type === "DEPOSIT" || (tx.type === "TRANSFER" && isIncoming && !isOutgoing)) {
        totalDeposits += amt;
      }
      if (tx.type === "WITHDRAWAL" || (tx.type === "TRANSFER" && isOutgoing && !isIncoming) || tx.type === "LOAN_REPAYMENT") {
        totalWithdrawals += amt;
      }

      const label = getMonthLabel(tx.createdAt);
      const entry = monthlyMap.get(label) || { month: label, deposits: 0, spending: 0 };
      if (tx.type === "DEPOSIT" || tx.type === "LOAN_DISBURSEMENT") {
        entry.deposits += amt;
      } else if (isOutgoing) {
        entry.spending += amt;
      }
      monthlyMap.set(label, entry);

      typeDistMap.set(tx.type.replace("_", " "), (typeDistMap.get(tx.type.replace("_", " ")) || 0) + amt);
    }

    return NextResponse.json({
      kpis: {
        totalBalance,
        totalDeposits,
        totalWithdrawals,
        activeLoansCount: activeLoans.length,
        totalLoanRemaining: activeLoans.reduce((s, l) => s + Number(l.remainingBalance), 0),
        accountsCount: customerAccounts.length,
      },
      monthlyHistory: Array.from(monthlyMap.values()),
      transactionDistribution: Array.from(typeDistMap.entries()).map(([name, value]) => ({
        name,
        value,
      })),
    });
  } catch (err) {
    console.error("Analytics error:", err);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
