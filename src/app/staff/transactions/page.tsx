"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { TransactionsView } from "@/components/banking/TransactionsView";

export default function StaffTransactionsPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Transaction Monitoring
          </h1>
          <p className="text-sm text-muted-foreground">
            Search transactions by ID, filter by date or type, and flag suspicious activity
          </p>
        </div>
        <TransactionsView role="STAFF" />
      </div>
    </DashboardShell>
  );
}
