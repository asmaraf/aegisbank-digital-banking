"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  Download,
  Flag,
  RotateCcw,
  CheckCircle2,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import {
  useGetTransactionsQuery,
  useFlagTransactionMutation,
  TransactionDTO,
} from "@/store/api/bankingApi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setTransactionFilters,
  resetTransactionFilters,
} from "@/store/slices/transactionSlice";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { downloadTransactionReceiptPDF } from "@/lib/export";

export function TransactionsView({
  role,
  accountId,
}: {
  role: "ADMIN" | "STAFF" | "CUSTOMER";
  accountId?: string;
}) {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.transaction);

  const { data, isLoading } = useGetTransactionsQuery({
    page: filters.page,
    limit: 10,
    search: filters.search,
    type: filters.typeFilter,
    status: filters.statusFilter,
    startDate: filters.startDate,
    endDate: filters.endDate,
    flaggedOnly: filters.flaggedOnly,
    accountId,
  });

  const [flagTx, { isLoading: mutating }] = useFlagTransactionMutation();
  const [confirmState, setConfirmState] = useState<{
    tx: TransactionDTO;
    action: "FLAG" | "CLEAR" | "REVERSE";
  } | null>(null);

  const transactions = data?.transactions ?? [];
  const pagination = data?.pagination ?? { total: 0, page: 1, totalPages: 1 };

  const handleAction = async () => {
    if (!confirmState) return;
    try {
      await flagTx({
        id: confirmState.tx.id,
        action: confirmState.action,
        flagReason:
          confirmState.action === "FLAG"
            ? "Flagged for suspicious pattern review"
            : undefined,
      }).unwrap();
      toast.success(`Transaction ${confirmState.action.toLowerCase()}ed successfully`);
      setConfirmState(null);
    } catch (err: unknown) {
      const msg =
        (err as { data?: { error?: string } })?.data?.error || "Action failed";
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="grid gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => dispatch(setTransactionFilters({ search: e.target.value }))}
            placeholder="Search TXN ID or description..."
            className="w-full rounded-xl border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={filters.typeFilter}
          onChange={(e) => dispatch(setTransactionFilters({ typeFilter: e.target.value }))}
          className="rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-500"
        >
          <option value="">All Types</option>
          <option value="DEPOSIT">Deposit</option>
          <option value="WITHDRAWAL">Withdrawal</option>
          <option value="TRANSFER">Transfer</option>
          <option value="LOAN_DISBURSEMENT">Loan Disbursement</option>
          <option value="LOAN_REPAYMENT">Loan Repayment</option>
        </select>

        <select
          value={filters.statusFilter}
          onChange={(e) => dispatch(setTransactionFilters({ statusFilter: e.target.value }))}
          className="rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
          <option value="REVERSED">Reversed</option>
        </select>

        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => dispatch(setTransactionFilters({ startDate: e.target.value }))}
          className="rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />

        <div className="flex items-center gap-2">
          {role !== "CUSTOMER" && (
            <button
              type="button"
              onClick={() =>
                dispatch(setTransactionFilters({ flaggedOnly: !filters.flaggedOnly }))
              }
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                filters.flaggedOnly
                  ? "border-amber-500 bg-amber-500/10 text-amber-600"
                  : "hover:bg-muted"
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Flagged
            </button>
          )}
          <button
            type="button"
            onClick={() => dispatch(resetTransactionFilters())}
            className="rounded-xl border px-3 py-2 text-xs font-medium hover:bg-muted"
          >
            Reset
          </button>
        </div>
      </div>

      {isLoading ? (
        <SkeletonCard lines={5} />
      ) : transactions.length === 0 ? (
        <EmptyState
          title="No transactions found"
          description="Try adjusting your search query or date filters."
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-hidden rounded-2xl border bg-card shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Transaction ID</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Accounts</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs font-semibold">
                          {tx.transactionId}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {tx.description}
                        </div>
                        {tx.isFlagged && (
                          <span className="mt-1 inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
                            <AlertTriangle className="h-3 w-3" />
                            Flagged
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium">
                        {tx.type.replace("_", " ")}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <div>From: {tx.senderAccountNumber || "Bank / System"}</div>
                        <div>To: {tx.receiverAccountNumber || "External / Loan"}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={tx.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDateTime(tx.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => downloadTransactionReceiptPDF(tx)}
                            className="rounded-lg border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            title="Download PDF Receipt"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          {role !== "CUSTOMER" && !tx.isFlagged && (
                            <button
                              onClick={() => setConfirmState({ tx, action: "FLAG" })}
                              className="rounded-lg border p-1.5 text-amber-600 hover:bg-amber-500/10"
                              title="Flag Suspicious"
                            >
                              <Flag className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {role === "ADMIN" && tx.isFlagged && (
                            <button
                              onClick={() => setConfirmState({ tx, action: "CLEAR" })}
                              className="rounded-lg border p-1.5 text-emerald-600 hover:bg-emerald-500/10"
                              title="Clear Flag"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {role === "ADMIN" &&
                            tx.type === "TRANSFER" &&
                            tx.status === "COMPLETED" && (
                              <button
                                onClick={() => setConfirmState({ tx, action: "REVERSE" })}
                                className="rounded-lg border p-1.5 text-red-600 hover:bg-red-500/10"
                                title="Reverse Transfer"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List */}
          <div className="space-y-3 md:hidden">
            {transactions.map((tx) => (
              <div key={tx.id} className="rounded-2xl border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-xs font-semibold">{tx.transactionId}</p>
                    <p className="text-xs text-muted-foreground">
                      {tx.type.replace("_", " ")}
                    </p>
                  </div>
                  <StatusBadge status={tx.status} />
                </div>
                <p className="mt-2 text-sm text-foreground">{tx.description}</p>
                <div className="mt-3 flex items-center justify-between border-t pt-3">
                  <span className="text-base font-bold">{formatCurrency(tx.amount)}</span>
                  <button
                    onClick={() => downloadTransactionReceiptPDF(tx)}
                    className="inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-medium"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Receipt
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between rounded-2xl border bg-card px-4 py-3 text-xs">
            <span className="text-muted-foreground">
              Page {pagination.page} of {Math.max(1, pagination.totalPages)} (
              {pagination.total} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() =>
                  dispatch(setTransactionFilters({ page: pagination.page - 1 }))
                }
                className="rounded-lg border p-1.5 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() =>
                  dispatch(setTransactionFilters({ page: pagination.page + 1 }))
                }
                className="rounded-lg border p-1.5 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!confirmState}
        title={
          confirmState?.action === "REVERSE"
            ? "Reverse Completed Transfer?"
            : confirmState?.action === "FLAG"
              ? "Flag Suspicious Transaction?"
              : "Clear Suspicious Flag?"
        }
        description={
          confirmState?.action === "REVERSE"
            ? `This will refund ${formatCurrency(
                confirmState.tx.amount
              )} back to the sender account and deduct it from the receiver.`
            : `Confirm updating flag status for ${confirmState?.tx.transactionId}.`
        }
        variant={confirmState?.action === "REVERSE" ? "danger" : "primary"}
        loading={mutating}
        onConfirm={handleAction}
        onCancel={() => setConfirmState(null)}
      />
    </div>
  );
}
