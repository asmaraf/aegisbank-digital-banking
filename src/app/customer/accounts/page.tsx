"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Download, FileSpreadsheet, CreditCard } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useGetAccountsQuery, BankAccountDTO } from "@/store/api/bankingApi";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { formatCurrency } from "@/lib/utils";
import {
  downloadAccountStatementCSV,
  downloadAccountStatementPDF,
} from "@/lib/export";

export default function CustomerAccountsPage() {
  const { data: session } = useSession();
  const { data, isLoading } = useGetAccountsQuery();
  const accounts = data?.accounts ?? [];

  const handleExport = async (account: BankAccountDTO, format: "PDF" | "CSV") => {
    try {
      const res = await fetch(`/api/transactions?accountId=${account.id}&limit=50`);
      const json = await res.json();
      const txs = json.transactions ?? [];
      if (format === "PDF") {
        downloadAccountStatementPDF(
          account.accountNumber,
          account.accountType,
          session?.user?.name || "Customer",
          account.balance,
          txs
        );
      } else {
        downloadAccountStatementCSV(account.accountNumber, txs);
      }
      toast.success(`Statement downloaded (${format})`);
    } catch {
      toast.error("Failed to export statement");
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Bank Accounts</h1>
          <p className="text-sm text-muted-foreground">
            View account numbers, balances, limits, and download statements
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="rounded-2xl border bg-card p-6 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold">
                        {acc.accountType} Account
                      </h3>
                      <p className="font-mono text-xs text-muted-foreground">
                        {acc.accountNumber}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={acc.status} />
                </div>

                <div className="mt-6">
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Available Balance
                  </p>
                  <p className="mt-1 text-3xl font-bold">
                    {formatCurrency(acc.balance)}
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 rounded-xl bg-muted/40 p-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Daily Limit</p>
                    <p className="font-semibold">
                      {formatCurrency(acc.dailyTransferLimit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Max Single Tx</p>
                    <p className="font-semibold">
                      {formatCurrency(acc.maxSingleTransaction)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Min Balance</p>
                    <p className="font-semibold">{formatCurrency(acc.minBalance)}</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleExport(acc, "PDF")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    <Download className="h-3.5 w-3.5" />
                    PDF Statement
                  </button>
                  <button
                    onClick={() => handleExport(acc, "CSV")}
                    className="inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold hover:bg-muted"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    CSV Export
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
