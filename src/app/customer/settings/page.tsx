"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { SecuritySettingsView } from "@/components/banking/SecuritySettingsView";

export default function CustomerSettingsPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Security & PIN</h1>
          <p className="text-sm text-muted-foreground">
            Manage your Transaction PIN and Two-Factor Authentication
          </p>
        </div>
        <SecuritySettingsView isAdmin={false} />
      </div>
    </DashboardShell>
  );
}
