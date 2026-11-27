"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ShieldCheck, KeyRound, Sliders } from "lucide-react";
import {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
} from "@/store/api/bankingApi";
import { bankSettingsSchema, updatePinSchema } from "@/lib/validations";
import { SkeletonCard } from "@/components/ui/SkeletonCard";

type PinForm = z.infer<typeof updatePinSchema>;
type BankSettingsForm = z.infer<typeof bankSettingsSchema>;

export function SecuritySettingsView({ isAdmin = false }: { isAdmin?: boolean }) {
  const { data, isLoading } = useGetSettingsQuery();
  const [updateSettings, { isLoading: saving }] = useUpdateSettingsMutation();

  const pinForm = useForm<PinForm>({
    resolver: zodResolver(updatePinSchema),
  });

  const bankForm = useForm<BankSettingsForm>({
    resolver: zodResolver(bankSettingsSchema),
  });

  useEffect(() => {
    if (data?.bankSettings) {
      bankForm.reset(data.bankSettings);
    }
  }, [data?.bankSettings, bankForm]);

  const handlePinSubmit = async (values: PinForm) => {
    try {
      await updateSettings({ scope: "pin", ...values }).unwrap();
      toast.success("PIN updated", {
        description: "Use new transaction PIN for fund transfers.",
      });
      pinForm.reset();
    } catch (err: unknown) {
      toast.error("Update failed", {
        description:
          (err as { data?: { error?: string } })?.data?.error || "Enter 4 to 6 numeric digits.",
      });
    }
  };

  const handleToggle2FA = async () => {
    if (!data?.profile) return;
    try {
      const next = !data.profile.twoFactorEnabled;
      await updateSettings({
        scope: "twoFactor",
        enabled: next,
      }).unwrap();
      toast.success("2FA updated", {
        description: `Two-factor authentication ${next ? "enabled" : "disabled"}.`,
      });
    } catch {
      toast.error("Update failed", {
        description: "Retry toggling two-factor authentication.",
      });
    }
  };

  const handleBankSettingsSubmit = async (values: BankSettingsForm) => {
    try {
      await updateSettings({ scope: "bank", settings: values }).unwrap();
      toast.success("Settings saved", {
        description: "Bank-wide financial parameters updated.",
      });
    } catch (err: unknown) {
      toast.error("Update failed", {
        description:
          (err as { data?: { error?: string } })?.data?.error || "Check parameter values.",
      });
    }
  };

  if (isLoading) return <SkeletonCard lines={4} />;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Transaction PIN */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Transaction PIN</h3>
            <p className="text-xs text-muted-foreground">
              Required to authorize fund transfers (Demo PIN: 1234)
            </p>
          </div>
        </div>

        <form onSubmit={pinForm.handleSubmit(handlePinSubmit)} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Current Account Password
            </label>
            <input
              type="password"
              {...pinForm.register("currentPassword")}
              className="w-full rounded-xl border bg-background px-3.5 py-2 text-sm outline-none focus:border-indigo-500"
            />
            {pinForm.formState.errors.currentPassword && (
              <p className="mt-1 text-xs text-red-500">
                {pinForm.formState.errors.currentPassword.message}
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              New 4-6 Digit PIN
            </label>
            <input
              type="password"
              maxLength={6}
              {...pinForm.register("newPin")}
              className="w-full rounded-xl border bg-background px-3.5 py-2 text-sm outline-none focus:border-indigo-500"
            />
            {pinForm.formState.errors.newPin && (
              <p className="mt-1 text-xs text-red-500">
                {pinForm.formState.errors.newPin.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Update Transaction PIN
          </button>
        </form>
      </div>

      {/* 2FA Security */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Two-Factor Authentication (2FA)</h3>
            <p className="text-xs text-muted-foreground">
              Add an extra 6-digit verification step for sensitive transfers
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-xl border bg-background p-4">
          <div>
            <p className="text-sm font-semibold">
              Status: {data?.profile?.twoFactorEnabled ? "Enabled" : "Disabled"}
            </p>
            <p className="text-xs text-muted-foreground">
              When enabled, enter any 6-digit authenticator code (e.g. 123456) on transfer.
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggle2FA}
            disabled={saving}
            className={`rounded-xl px-4 py-2 text-xs font-semibold text-white ${
              data?.profile?.twoFactorEnabled
                ? "bg-red-600 hover:bg-red-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {data?.profile?.twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
          </button>
        </div>
      </div>

      {/* Admin Bank-Wide Financial Settings */}
      {isAdmin && data?.bankSettings && (
        <div className="rounded-2xl border bg-card p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold">
                Bank-Wide Risk & Transaction Limits
              </h3>
              <p className="text-xs text-muted-foreground">
                Default thresholds for new accounts and automated suspicious activity alerts
              </p>
            </div>
          </div>

          <form
            onSubmit={bankForm.handleSubmit(handleBankSettingsSubmit)}
            className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Default Daily Transfer Limit ($)
              </label>
              <input
                type="number"
                step="0.01"
                {...bankForm.register("defaultDailyTransferLimit")}
                className="w-full rounded-xl border bg-background px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Max Single Transaction ($)
              </label>
              <input
                type="number"
                step="0.01"
                {...bankForm.register("defaultMaxSingleTx")}
                className="w-full rounded-xl border bg-background px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Default Min Balance ($)
              </label>
              <input
                type="number"
                step="0.01"
                {...bankForm.register("defaultMinBalance")}
                className="w-full rounded-xl border bg-background px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Suspicious Alert Threshold ($)
              </label>
              <input
                type="number"
                step="0.01"
                {...bankForm.register("suspiciousAmountThreshold")}
                className="w-full rounded-xl border bg-background px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Transfer Fee (%)
              </label>
              <input
                type="number"
                step="0.1"
                {...bankForm.register("transferFeePercent")}
                className="w-full rounded-xl border bg-background px-3.5 py-2 text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Save Bank Settings
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
