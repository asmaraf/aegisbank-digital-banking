"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  ArrowRight,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useGetAnalyticsQuery } from "@/store/api/bankingApi";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { formatCurrency } from "@/lib/utils";

const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function AdminDashboardPage() {
  const { data, isLoading } = useGetAnalyticsQuery();
  const [chartTab, setChartTab] = useState<"volume" | "flows" | "portfolio">("volume");

  const kpis = (data?.kpis as Record<string, number>) ?? {};
  const monthlyActivity =
    (data?.monthlyActivity as {
      month: string;
      deposits: number;
      withdrawals: number;
      transfers: number;
      volume: number;
    }[]) ?? [];
  const accountDistribution =
    (data?.accountDistribution as { name: string; value: number }[]) ?? [];
  const loanStatistics =
    (data?.loanStatistics as { name: string; value: number }[]) ?? [];

  const primaryCards = [
    {
      label: "Total Bank Balance",
      value: formatCurrency(kpis.totalBalance ?? 0),
      sub: `${kpis.totalAccounts ?? 0} active accounts`,
    },
    {
      label: "Total Deposits",
      value: formatCurrency(kpis.totalDeposits ?? 0),
      sub: "Settled inflows",
    },
    {
      label: "Total Withdrawals",
      value: formatCurrency(kpis.totalWithdrawals ?? 0),
      sub: "Settled outflows",
    },
    {
      label: "Registered Customers",
      value: String(kpis.totalCustomers ?? 0),
      sub: `${kpis.totalTransactions ?? 0} total txns`,
    },
  ];

  const queueCards = [
    {
      label: "Pending Loans",
      value: kpis.pendingLoans ?? 0,
      href: "/admin/loans",
    },
    {
      label: "Pending Requests",
      value: kpis.pendingRequestsCount ?? 0,
      href: "/admin/requests",
    },
    {
      label: "Flagged Transactions",
      value: kpis.flaggedTransactionsCount ?? 0,
      href: "/admin/transactions",
    },
    {
      label: "Bank Accounts",
      value: kpis.totalAccounts ?? 0,
      href: "/admin/accounts",
    },
  ];

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
            <p className="text-sm text-muted-foreground">
              Balances, transaction volume, and pending reviews
            </p>
          </div>
          <Link
            href="/admin/settings"
            className="rounded-xl border bg-card px-4 py-2 text-xs font-semibold hover:bg-muted"
          >
            Risk & Limit Settings
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <>
            {/* Primary KPI Strip */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {primaryCards.map((c) => (
                <div
                  key={c.label}
                  className="rounded-2xl border bg-card p-5 shadow-sm"
                >
                  <span className="text-xs font-semibold uppercase text-muted-foreground">
                    {c.label}
                  </span>
                  <p className="mt-3 text-2xl font-bold tracking-tight">{c.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{c.sub}</p>
                </div>
              ))}
            </div>

            {/* Actionable Operations Queues */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {queueCards.map((q) => (
                <Link
                  key={q.label}
                  href={q.href}
                  className="group flex items-center justify-between rounded-2xl border bg-card p-4 shadow-sm transition hover:border-indigo-500/40"
                >
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {q.label}
                    </p>
                    <p className="mt-1 text-lg font-bold">{q.value}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Shadcnblocks-style Tabbed Analytics Workspace */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
            <div>
              <h3 className="text-base font-semibold">Bank-Wide Analytics</h3>
              <p className="text-xs text-muted-foreground">
                Switch between volume, cashflow, and account/loan distributions
              </p>
            </div>
            <div className="inline-flex rounded-xl border bg-muted/40 p-1">
              {[
                { id: "volume", label: "Transaction Volume" },
                { id: "flows", label: "Deposits vs Withdrawals" },
                { id: "portfolio", label: "Accounts & Loans" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setChartTab(t.id as typeof chartTab)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    chartTab === t.id
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            {chartTab === "volume" && (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyActivity}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="volume"
                      name="Total Volume"
                      stroke="#4F46E5"
                      fill="#4F46E5"
                      fillOpacity={0.18}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {chartTab === "flows" && (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyActivity}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="deposits"
                      name="Deposits"
                      fill="#10B981"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="withdrawals"
                      name="Withdrawals"
                      fill="#EF4444"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {chartTab === "portfolio" && (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="h-72">
                  <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                    Account Distribution
                  </p>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={accountDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                      >
                        {accountDistribution.map((_, idx) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="h-72">
                  <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                    Loan Approval Statistics
                  </p>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={loanStatistics}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} allowDecimals={false} />
                      <Tooltip />
                      <Bar
                        dataKey="value"
                        name="Applications"
                        fill="#4F46E5"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
