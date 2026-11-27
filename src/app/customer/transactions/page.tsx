"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { TransactionsView } from "@/components/banking/TransactionsView";

export default function CustomerTransactionsPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transaction History</h1>
          <p className="text-sm text-muted-foreground">
            Search by Transaction ID, filter by date or type, and download PDF receipts
          </p>
        </div>
        <TransactionsView role="CUSTOMER" />
      </div>
    </DashboardShell>
  );
}
