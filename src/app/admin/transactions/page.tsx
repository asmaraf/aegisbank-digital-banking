"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { TransactionsView } from "@/components/banking/TransactionsView";

export default function AdminTransactionsPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transaction Ledger</h1>
          <p className="text-sm text-muted-foreground">
            Audit all bank transactions, review flagged alerts, and reverse transfers
          </p>
        </div>
        <TransactionsView role="ADMIN" />
      </div>
    </DashboardShell>
  );
}
