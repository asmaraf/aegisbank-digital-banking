"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { LoansManagementView } from "@/components/banking/LoansManagementView";

export default function StaffLoansPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Loan Assistance</h1>
          <p className="text-sm text-muted-foreground">
            Review loan applications, add internal notes, and forward to Admin for approval
          </p>
        </div>
        <LoansManagementView role="STAFF" />
      </div>
    </DashboardShell>
  );
}
