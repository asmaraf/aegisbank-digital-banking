"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
  useGetAccountsQuery,
  useGetRequestsQuery,
  useCreateRequestMutation,
} from "@/store/api/bankingApi";
import { depositWithdrawSchema } from "@/lib/validations";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDateTime } from "@/lib/utils";

type RequestForm = z.infer<typeof depositWithdrawSchema>;

export default function CustomerRequestsPage() {
  const { data: accountsData } = useGetAccountsQuery();
  const { data: reqData } = useGetRequestsQuery();
  const [createRequest, { isLoading: submitting }] = useCreateRequestMutation();

  const accounts = accountsData?.accounts ?? [];
  const requests = reqData?.requests ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RequestForm>({
    resolver: zodResolver(depositWithdrawSchema),
    defaultValues: { type: "DEPOSIT" },
  });

  const onSubmit = async (values: RequestForm) => {
    try {
      await createRequest(values).unwrap();
      toast.success("Request submitted", {
        description: `${values.type} request queued for staff review.`,
      });
      reset();
    } catch (err: unknown) {
      toast.error("Request failed", {
        description:
          (err as { data?: { error?: string } })?.data?.error || "Review amount and retry.",
      });
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deposit & Withdrawal</h1>
          <p className="text-sm text-muted-foreground">
            Submit deposit or withdrawal requests for bank staff verification
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h3 className="text-base font-semibold">New Request</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Request Type
                </label>
                <select
                  {...register("type")}
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                >
                  <option value="DEPOSIT">Deposit Funds</option>
                  <option value="WITHDRAWAL">Withdraw Funds</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Bank Account
                </label>
                <select
                  {...register("accountId")}
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select account...</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.accountType} ({a.accountNumber}) — {formatCurrency(a.balance)}
                    </option>
                  ))}
                </select>
                {errors.accountId && (
                  <p className="mt-1 text-xs text-red-500">{errors.accountId.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Amount (BDT / ৳)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register("amount")}
                  placeholder="500.00"
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                />
                {errors.amount && (
                  <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Description
                </label>
                <input
                  {...register("description")}
                  placeholder="e.g. Check deposit or branch cash withdrawal"
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </form>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm lg:col-span-2">
            <h3 className="text-base font-semibold">Request History</h3>
            <div className="mt-4 space-y-3">
              {requests.length === 0 ? (
                <EmptyState
                  title="No requests yet"
                  description="Submitted deposit and withdrawal requests will appear here."
                />
              ) : (
                requests.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                          r.type === "DEPOSIT"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {r.type === "DEPOSIT" ? (
                          <ArrowDownLeft className="h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          {r.type} — {formatCurrency(r.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {r.account.accountNumber} • {r.description} •{" "}
                          {formatDateTime(r.createdAt)}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
