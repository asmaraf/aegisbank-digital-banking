"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ArrowUpRight,
  CreditCard,
  Send,
  Eye,
  EyeOff,
  TrendingUp,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
  useGetAnalyticsQuery,
  useGetAccountsQuery,
  useGetTransactionsQuery,
  useGetLoansQuery,
} from "@/store/api/bankingApi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setActiveAccountId } from "@/store/slices/accountSlice";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { formatCurrency, formatDateTime } from "@/lib/utils";

const PIE_COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function CustomerDashboardPage() {
  const dispatch = useAppDispatch();
  const activeAccountId = useAppSelector((s) => s.account.activeAccountId);
  const [hideNumber, setHideNumber] = useState(true);
  const [chartTab, setChartTab] = useState<"cashflow" | "distribution">("cashflow");

  const { data: analytics, isLoading: loadingAnalytics } = useGetAnalyticsQuery();
  const { data: accountsData, isLoading: loadingAccounts } = useGetAccountsQuery();
  const { data: txData } = useGetTransactionsQuery({
    limit: 6,
    accountId: activeAccountId || undefined,
  });
  const { data: loansData } = useGetLoansQuery();

  const accounts = accountsData?.accounts ?? [];
  const selectedAccount =
    accounts.find((a) => a.id === activeAccountId) ?? accounts[0] ?? null;

  useEffect(() => {
    if (!activeAccountId && accounts.length > 0) {
      dispatch(setActiveAccountId(accounts[0].id));
    }
  }, [activeAccountId, accounts, dispatch]);

  const kpis = (analytics?.kpis as Record<string, number>) ?? {};
  const monthlyHistory =
    (analytics?.monthlyHistory as { month: string; deposits: number; spending: number }[]) ??
    [];
  const txDist =
    (analytics?.transactionDistribution as { name: string; value: number }[]) ?? [];
  const activeLoans = (loansData?.loans ?? []).filter((l) => l.status === "ACTIVE");

  const totalFlow = Math.max(1, (kpis.totalDeposits ?? 0) + (kpis.totalWithdrawals ?? 0));
  const depositRatio = Math.round(((kpis.totalDeposits ?? 0) / totalFlow) * 100);

  const maskedAccountNum = selectedAccount?.accountNumber
    ? hideNumber
      ? `•••• •••• ${selectedAccount.accountNumber.slice(-4)}`
      : selectedAccount.accountNumber
    : "No account";

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Top Header + Account Switcher Pills */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Balances, transfers, and account activity
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {accounts.map((acc) => {
              const active = acc.id === selectedAccount?.id;
              return (
                <button
                  key={acc.id}
                  onClick={() => dispatch(setActiveAccountId(acc.id))}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                      : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {acc.accountType} • {acc.accountNumber.slice(-4)}
                </button>
              );
            })}
            <Link
              href="/customer/transfer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              <Send className="h-3.5 w-3.5" />
              Send Money
            </Link>
          </div>
        </div>

        {/* Bento Hero Row: Virtual Banking Card + Liquidity Health */}
        {loadingAnalytics || loadingAccounts ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Bespoke Virtual Treasury Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-950 p-6 text-white shadow-xl lg:col-span-2">
              <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider">
                    <CreditCard className="h-3 w-3" />
                    {selectedAccount?.accountType || "PRIMARY"} ACCOUNT
                  </span>
                  <p className="mt-4 text-xs text-indigo-100">Available Balance</p>
                  <p className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                    {formatCurrency(selectedAccount?.balance ?? kpis.totalBalance ?? 0)}
                  </p>
                </div>

                <div className="text-right">
                  <span className="rounded-full bg-emerald-400/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
                    {selectedAccount?.status || "ACTIVE"}
                  </span>
                  <p className="mt-3 text-[11px] text-indigo-200">
                    Total Portfolio: {formatCurrency(kpis.totalBalance ?? 0)}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm tracking-widest">
                    {maskedAccountNum}
                  </span>
                  <button
                    onClick={() => setHideNumber(!hideNumber)}
                    className="rounded-lg bg-white/10 p-1 hover:bg-white/20"
                    title={hideNumber ? "Show account number" : "Mask account number"}
                  >
                    {hideNumber ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/customer/transfer"
                    className="rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                  >
                    Transfer
                  </Link>
                  <Link
                    href="/customer/requests"
                    className="rounded-xl bg-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/25"
                  >
                    Deposit / Withdraw
                  </Link>
                  <Link
                    href="/customer/accounts"
                    className="rounded-xl bg-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/25"
                  >
                    Statements
                  </Link>
                </div>
              </div>
            </div>

            {/* Cashflow & Credit Health Card */}
            <div className="flex flex-col justify-between rounded-2xl border bg-card p-6 shadow-sm">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">
                    Cashflow Ratio
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="h-3 w-3" />
                    {depositRatio}% Inflow
                  </span>
                </div>

                <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-red-500/20">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${depositRatio}%` }}
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-muted-foreground">Total Deposits</p>
                    <p className="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(kpis.totalDeposits ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-muted-foreground">Total Outflows</p>
                    <p className="mt-1 text-sm font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(kpis.totalWithdrawals ?? 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t pt-4 text-xs">
                <div>
                  <p className="text-muted-foreground">Active Loan Balance</p>
                  <p className="text-base font-bold">
                    {formatCurrency(kpis.totalLoanRemaining ?? 0)}
                  </p>
                </div>
                <Link
                  href="/customer/loans"
                  className="rounded-xl border px-3 py-1.5 font-semibold hover:bg-muted"
                >
                  {activeLoans.length} Loan(s)
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Tabbed Analytics + Recent Ledger Bento */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border bg-card p-6 shadow-sm lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">Financial Analytics</h3>
                <p className="text-xs text-muted-foreground">
                  Live ledger metrics across your {accounts.length} account(s)
                </p>
              </div>
              <div className="inline-flex rounded-xl border bg-muted/40 p-1">
                <button
                  onClick={() => setChartTab("cashflow")}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    chartTab === "cashflow"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  Monthly Cashflow
                </button>
                <button
                  onClick={() => setChartTab("distribution")}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    chartTab === "distribution"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  Category Mix
                </button>
              </div>
            </div>

            <div className="mt-5 h-72">
              {chartTab === "cashflow" ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyHistory}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar
                      dataKey="deposits"
                      name="Deposits"
                      fill="#10B981"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="spending"
                      name="Spending"
                      fill="#4F46E5"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={txDist}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={4}
                    >
                      {txDist.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Quick Banking Shortcuts */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h3 className="text-base font-semibold">Quick Actions</h3>
            <p className="text-xs text-muted-foreground">
              Common tasks for your accounts
            </p>
            <div className="mt-4 space-y-2.5">
              <Link
                href="/customer/transfer"
                className="flex items-center justify-between rounded-xl border p-3.5 text-sm font-medium transition hover:border-indigo-500/40 hover:bg-muted/50"
              >
                <span>Transfer Funds</span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Link
                href="/customer/requests"
                className="flex items-center justify-between rounded-xl border p-3.5 text-sm font-medium transition hover:border-emerald-500/40 hover:bg-muted/50"
              >
                <span>Deposit / Withdrawal</span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Link
                href="/customer/loans"
                className="flex items-center justify-between rounded-xl border p-3.5 text-sm font-medium transition hover:border-amber-500/40 hover:bg-muted/50"
              >
                <span>Loans & Repayments</span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Link
                href="/customer/transactions"
                className="flex items-center justify-between rounded-xl border p-3.5 text-sm font-medium transition hover:border-indigo-500/40 hover:bg-muted/50"
              >
                <span>Receipts & Statements</span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Ledger Table */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Recent Ledger Activity</h3>
            <Link
              href="/customer/transactions"
              className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              View full ledger
            </Link>
          </div>
          <div className="mt-4 divide-y">
            {(txData?.transactions ?? []).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No recent transactions for this account
              </p>
            ) : (
              (txData?.transactions ?? []).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {tx.transactionId} • {tx.type.replace("_", " ")} •{" "}
                      {formatDateTime(tx.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(tx.amount)}</p>
                    <StatusBadge status={tx.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
