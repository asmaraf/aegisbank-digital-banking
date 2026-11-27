"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { LoansManagementView } from "@/components/banking/LoansManagementView";

export default function AdminLoansPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Loan Underwriting & Disbursement
          </h1>
          <p className="text-sm text-muted-foreground">
            Approve or reject loan applications, disburse funds, and review repayment schedules
          </p>
        </div>
        <LoansManagementView role="ADMIN" />
      </div>
    </DashboardShell>
  );
}
