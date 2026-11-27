"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { CustomersManagementView } from "@/components/banking/CustomersManagementView";

export default function AdminCustomersPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customer Management</h1>
          <p className="text-sm text-muted-foreground">
            Search customers, verify KYC, inspect history, or block suspicious accounts
          </p>
        </div>
        <CustomersManagementView role="ADMIN" />
      </div>
    </DashboardShell>
  );
}
