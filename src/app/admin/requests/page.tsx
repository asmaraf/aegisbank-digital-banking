"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { RequestsManagementView } from "@/components/banking/RequestsManagementView";

export default function AdminRequestsPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Deposit & Withdrawal Queue
          </h1>
          <p className="text-sm text-muted-foreground">
            Approve or reject customer deposit and withdrawal requests
          </p>
        </div>
        <RequestsManagementView />
      </div>
    </DashboardShell>
  );
}
