"use client";

import Link from "next/link";
import {
  ArrowRight,
  Clock,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useGetAnalyticsQuery, useGetRequestsQuery } from "@/store/api/bankingApi";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function StaffDashboardPage() {
  const { data, isLoading } = useGetAnalyticsQuery();
  const { data: reqData } = useGetRequestsQuery({ status: "PENDING" });

  const kpis = (data?.kpis as Record<string, number>) ?? {};
  const pendingRequests = reqData?.requests ?? [];

  const cards = [
    {
      label: "Registered Customers",
      value: kpis.totalCustomers ?? 0,
      href: "/staff/customers",
    },
    {
      label: "Pending Requests",
      value: kpis.pendingRequestsCount ?? 0,
      href: "/staff/requests",
    },
    {
      label: "Pending Loan Reviews",
      value: kpis.pendingLoans ?? 0,
      href: "/staff/loans",
    },
    {
      label: "Flagged Transactions",
      value: kpis.flaggedTransactionsCount ?? 0,
      href: "/staff/transactions",
    },
  ];

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Staff Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Customer onboarding, KYC checks, pending requests, and loan reviews
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((c) => (
              <Link
                key={c.label}
                href={c.href}
                className="group rounded-2xl border bg-card p-5 shadow-sm transition hover:border-indigo-500/40"
              >
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  {c.label}
                </span>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-2xl font-bold">{c.value}</p>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Live Pending Requests Queue Preview */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <h3 className="text-base font-semibold">Pending Deposit & Withdrawal Queue</h3>
            </div>
            <Link
              href="/staff/requests"
              className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Process queue
            </Link>
          </div>

          <div className="mt-4 divide-y">
            {pendingRequests.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                All customer requests are currently processed.
              </p>
            ) : (
              pendingRequests.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {r.user?.name} — {r.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Account {r.account.accountNumber} • {formatDateTime(r.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">{formatCurrency(r.amount)}</span>
                    <StatusBadge status={r.status} />
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
