import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTransactionId } from "@/lib/utils";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireAuth(["CUSTOMER"], true);
  if (error || !session) return error;

  try {
    const body = await req.json();
    const { accountId } = body as { accountId?: string };

    const loan = await prisma.loanApplication.findUnique({
      where: { id: params.id },
      include: {
        repayments: {
          where: { status: { in: ["UPCOMING", "OVERDUE"] } },
          orderBy: { installmentNumber: "asc" },
          take: 1,
        },
      },
    });

    if (!loan || loan.userId !== session.user.id) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    if (loan.status !== "ACTIVE") {
      return NextResponse.json({ error: "Loan is not active" }, { status: 400 });
    }

    const nextInstallment = loan.repayments[0];
    if (!nextInstallment) {
      return NextResponse.json({ error: "No upcoming installments left" }, { status: 400 });
    }

    const sourceAccountId = accountId || loan.accountId;

    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.bankAccount.findUnique({
        where: { id: sourceAccountId },
      });

      if (!account || account.userId !== session.user.id) {
        throw new Error("FORBIDDEN:Account not found");
      }

      if (account.status !== "ACTIVE") {
        throw new Error(`BAD_REQUEST:Account is ${account.status}`);
      }

      const payAmount = Number(nextInstallment.amount);
      const available = Number(account.balance) - Number(account.minBalance);

      if (payAmount > available) {
        throw new Error("BAD_REQUEST:Insufficient funds for loan repayment");
      }

      await tx.bankAccount.update({
        where: { id: account.id },
        data: { balance: { decrement: payAmount } },
      });

      const txnId = generateTransactionId();

      await tx.transaction.create({
        data: {
          transactionId: txnId,
          senderAccountId: account.id,
          type: "LOAN_REPAYMENT",
          amount: payAmount,
          fee: 0,
          status: "COMPLETED",
          description: `${loan.loanType} Loan Installment #${nextInstallment.installmentNumber}`,
        },
      });

      await tx.loanRepayment.update({
        where: { id: nextInstallment.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
          transactionId: txnId,
        },
      });

      const newRemaining = Math.max(0, Number(loan.remainingBalance) - payAmount);
      const isCompleted = newRemaining <= 0.01;

      const updatedLoan = await tx.loanApplication.update({
        where: { id: loan.id },
        data: {
          remainingBalance: isCompleted ? 0 : newRemaining,
          status: isCompleted ? "COMPLETED" : "ACTIVE",
        },
      });

      await tx.notification.create({
        data: {
          userId: session.user.id,
          title: isCompleted ? "Loan Fully Repaid" : "Loan Installment Paid",
          message: `Installment #${nextInstallment.installmentNumber} ($${payAmount.toFixed(
            2
          )}) paid successfully.`,
          type: "SUCCESS",
        },
      });

      return updatedLoan;
    });

    return NextResponse.json({
      message: "Installment paid successfully",
      loan: {
        ...result,
        remainingBalance: Number(result.remainingBalance),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Repayment failed";
    if (msg.startsWith("FORBIDDEN:")) {
      return NextResponse.json({ error: msg.replace("FORBIDDEN:", "") }, { status: 403 });
    }
    if (msg.startsWith("BAD_REQUEST:")) {
      return NextResponse.json({ error: msg.replace("BAD_REQUEST:", "") }, { status: 400 });
    }
    console.error("Repayment error:", err);
    return NextResponse.json({ error: "Failed to process repayment" }, { status: 500 });
  }
}
