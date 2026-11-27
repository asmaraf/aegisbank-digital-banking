"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { SecuritySettingsView } from "@/components/banking/SecuritySettingsView";

export default function AdminSettingsPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Risk & Bank Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure bank-wide transaction limits, suspicious thresholds, and security
          </p>
        </div>
        <SecuritySettingsView isAdmin={true} />
      </div>
    </DashboardShell>
  );
}
