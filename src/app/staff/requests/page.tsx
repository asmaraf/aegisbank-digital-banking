"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { RequestsManagementView } from "@/components/banking/RequestsManagementView";

export default function StaffRequestsPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Pending Deposit & Withdrawal Requests
          </h1>
          <p className="text-sm text-muted-foreground">
            Verify and process customer deposit and withdrawal requests
          </p>
        </div>
        <RequestsManagementView />
      </div>
    </DashboardShell>
  );
}
