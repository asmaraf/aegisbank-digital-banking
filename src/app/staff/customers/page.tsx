"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { CustomersManagementView } from "@/components/banking/CustomersManagementView";

export default function StaffCustomersPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Customer Onboarding & KYC
          </h1>
          <p className="text-sm text-muted-foreground">
            Register new customers, verify KYC details, and inspect customer accounts
          </p>
        </div>
        <CustomersManagementView role="STAFF" />
      </div>
    </DashboardShell>
  );
}
