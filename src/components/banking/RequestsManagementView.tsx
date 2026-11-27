"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import {
  useGetRequestsQuery,
  useProcessRequestMutation,
  DepositWithdrawRequestDTO,
} from "@/store/api/bankingApi";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export function RequestsManagementView() {
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const { data, isLoading } = useGetRequestsQuery(
    statusFilter ? { status: statusFilter } : undefined
  );
  const [processRequest, { isLoading: processing }] = useProcessRequestMutation();

  const [selected, setSelected] = useState<{
    req: DepositWithdrawRequestDTO;
    decision: "APPROVED" | "REJECTED";
  } | null>(null);

  const requests = data?.requests ?? [];

  const handleConfirm = async () => {
    if (!selected) return;
    try {
      await processRequest({
        id: selected.req.id,
        decision: selected.decision,
        reviewNote:
          selected.decision === "APPROVED"
            ? "Verified and settled by bank operations"
            : "Declined by bank operations",
      }).unwrap();
      toast.success(`Request ${selected.decision.toLowerCase()} successfully`);
      setSelected(null);
    } catch (err: unknown) {
      toast.error(
        (err as { data?: { error?: string } })?.data?.error || "Operation failed"
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {["PENDING", "APPROVED", "REJECTED", ""].map((st) => (
          <button
            key={st || "ALL"}
            onClick={() => setStatusFilter(st)}
            className={`rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition ${
              statusFilter === st
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "bg-card hover:bg-muted"
            }`}
          >
            {st || "All Requests"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <SkeletonCard lines={4} />
      ) : requests.length === 0 ? (
        <EmptyState
          title="No requests in this queue"
          description="Customer deposit and withdrawal requests will appear here."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.user?.name}</p>
                      <p className="text-xs text-muted-foreground">{r.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {r.account.accountNumber} ({r.account.accountType})
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold">{r.type}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(r.amount)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDateTime(r.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === "PENDING" ? (
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => setSelected({ req: r, decision: "APPROVED" })}
                            className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Approve
                          </button>
                          <button
                            onClick={() => setSelected({ req: r, decision: "REJECTED" })}
                            className="inline-flex items-center gap-1 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                          >
                            <X className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!selected}
        title={`${selected?.decision === "APPROVED" ? "Approve" : "Reject"} ${
          selected?.req.type
        } Request?`}
        description={`Confirm ${selected?.decision.toLowerCase()} for ${formatCurrency(
          selected?.req.amount
        )} on account ${selected?.req.account.accountNumber}.`}
        variant={selected?.decision === "REJECTED" ? "danger" : "primary"}
        loading={processing}
        onConfirm={handleConfirm}
        onCancel={() => setSelected(null)}
      />
    </div>
  );
}
