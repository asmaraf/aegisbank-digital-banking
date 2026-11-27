"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Send, CheckCircle2, Download, Shield } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
  useGetAccountsQuery,
  useGetSettingsQuery,
  useTransferFundsMutation,
  TransactionDTO,
} from "@/store/api/bankingApi";
import { transferSchema } from "@/lib/validations";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatCurrency } from "@/lib/utils";
import { downloadTransactionReceiptPDF } from "@/lib/export";

type TransferForm = z.infer<typeof transferSchema>;

export default function CustomerTransferPage() {
  const { data: accountsData } = useGetAccountsQuery();
  const { data: settingsData } = useGetSettingsQuery();
  const [transferFunds, { isLoading: transferring }] = useTransferFundsMutation();

  const [pendingValues, setPendingValues] = useState<TransferForm | null>(null);
  const [completedTx, setCompletedTx] = useState<TransactionDTO | null>(null);

  const accounts = accountsData?.accounts ?? [];
  const twoFactorEnabled = settingsData?.profile?.twoFactorEnabled ?? false;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TransferForm>({
    resolver: zodResolver(transferSchema),
  });

  const selectedSenderId = watch("senderAccountId");

  const onReview = (values: TransferForm) => {
    setPendingValues(values);
  };

  const handleConfirmTransfer = async () => {
    if (!pendingValues) return;
    try {
      const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const res = await transferFunds({
        ...pendingValues,
        idempotencyKey,
      }).unwrap();
      toast.success("Transfer completed", {
        description: "Funds transferred to recipient account.",
      });
      setCompletedTx(res.transaction);
      setPendingValues(null);
      reset();
    } catch (err: unknown) {
      toast.error("Transfer failed", {
        description:
          (err as { data?: { error?: string } })?.data?.error ||
          "Check account details and PIN.",
      });
      setPendingValues(null);
    }
  };

  return (
    <DashboardShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fund Transfer</h1>
          <p className="text-sm text-muted-foreground">
            Send money instantly between your accounts or to another AegisBank customer
          </p>
        </div>

        {completedTx && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                <div>
                  <h3 className="font-semibold text-emerald-700 dark:text-emerald-400">
                    Transfer Successful — {formatCurrency(completedTx.amount)}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Transaction ID: {completedTx.transactionId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => downloadTransactionReceiptPDF(completedTx)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                <Download className="h-3.5 w-3.5" />
                PDF Receipt
              </button>
            </div>
          </div>
        )}

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit(onReview)} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">
                1. Source Account
              </label>
              <select
                {...register("senderAccountId")}
                className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500"
              >
                <option value="">Select source account...</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountType} ({acc.accountNumber}) — Available:{" "}
                    {formatCurrency(acc.balance)}
                  </option>
                ))}
              </select>
              {errors.senderAccountId && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.senderAccountId.message}
                </p>
              )}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  2. Recipient Account Number
                </label>
                {accounts.length > 1 && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-muted-foreground">Own account:</span>
                    {accounts
                      .filter((a) => a.id !== selectedSenderId)
                      .map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() =>
                            setValue("recipientAccountNumber", a.accountNumber)
                          }
                          className="rounded-lg border px-2 py-0.5 font-mono text-[11px] hover:bg-muted"
                        >
                          {a.accountNumber}
                        </button>
                      ))}
                  </div>
                )}
              </div>
              <input
                {...register("recipientAccountNumber")}
                placeholder="e.g. 1001000003"
                className="w-full rounded-xl border bg-background px-3.5 py-2.5 font-mono text-sm outline-none focus:border-indigo-500"
              />
              {errors.recipientAccountNumber && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.recipientAccountNumber.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">
                  3. Amount (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register("amount")}
                  placeholder="0.00"
                  className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500"
                />
                {errors.amount && (
                  <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">
                  4. Transaction PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  {...register("transactionPin")}
                  placeholder="4-6 digit PIN (Demo: 1234)"
                  className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500"
                />
                {errors.transactionPin && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.transactionPin.message}
                  </p>
                )}
              </div>
            </div>

            {twoFactorEnabled && (
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3.5">
                <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <Shield className="h-3.5 w-3.5" />
                  2FA Verification Code Required
                </label>
                <input
                  type="text"
                  maxLength={6}
                  {...register("twoFactorCode")}
                  placeholder="Enter 6-digit authenticator code (e.g. 123456)"
                  className="w-full rounded-xl border bg-background px-3.5 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">
                5. Description / Reference
              </label>
              <input
                {...register("description")}
                placeholder="e.g. Invoice payment or family support"
                className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={transferring}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Review & Send Transfer
            </button>
          </form>
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingValues}
        title="Confirm Fund Transfer"
        description={`You are about to transfer ${formatCurrency(
          pendingValues?.amount
        )} to account ${pendingValues?.recipientAccountNumber}. This action is atomic and immediate.`}
        confirmLabel="Confirm Transfer"
        loading={transferring}
        onConfirm={handleConfirmTransfer}
        onCancel={() => setPendingValues(null)}
      />
    </DashboardShell>
  );
}
