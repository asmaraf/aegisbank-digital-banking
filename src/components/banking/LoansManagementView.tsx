"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Check, X, Forward, Calendar } from "lucide-react";
import {
  useGetLoansQuery,
  useUpdateLoanMutation,
  LoanApplicationDTO,
} from "@/store/api/bankingApi";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { formatCurrency, formatDate } from "@/lib/utils";

export function LoansManagementView({ role }: { role: "ADMIN" | "STAFF" }) {
  const { data, isLoading } = useGetLoansQuery();
  const [updateLoan, { isLoading: updating }] = useUpdateLoanMutation();

  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [scheduleLoan, setScheduleLoan] = useState<LoanApplicationDTO | null>(null);
  const [confirmState, setConfirmState] = useState<{
    loan: LoanApplicationDTO;
    action: "FORWARD" | "APPROVE" | "REJECT";
  } | null>(null);

  const loans = data?.loans ?? [];

  const handleConfirm = async () => {
    if (!confirmState) return;
    try {
      await updateLoan({
        id: confirmState.loan.id,
        action: confirmState.action,
        staffNotes: notesMap[confirmState.loan.id] || confirmState.loan.staffNotes || undefined,
      }).unwrap();
      toast.success(`Loan ${confirmState.action.toLowerCase()}d successfully`);
      setConfirmState(null);
    } catch (err: unknown) {
      toast.error(
        (err as { data?: { error?: string } })?.data?.error || "Loan action failed"
      );
    }
  };

  if (isLoading) return <SkeletonCard lines={5} />;
  if (loans.length === 0) {
    return (
      <EmptyState
        title="No loan applications"
        description="Customer loan applications will appear here for underwriting."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {loans.map((loan) => (
          <div key={loan.id} className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-semibold">
                    {loan.loanType} Loan — {formatCurrency(loan.requestedAmount)}
                  </h3>
                  <StatusBadge status={loan.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Applicant: {loan.user?.name} ({loan.user?.email}) • Account:{" "}
                  {loan.account?.accountNumber} • {loan.durationMonths} months @{" "}
                  {loan.interestRate}% APR
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Monthly Income: {formatCurrency(loan.monthlyIncome)} • Employment:{" "}
                  {loan.employmentStatus.replace("_", " ")}
                </p>
                <p className="mt-2 text-sm text-foreground">{loan.description}</p>
              </div>

              <div className="text-right text-xs">
                <p className="text-muted-foreground">Applied {formatDate(loan.createdAt)}</p>
                {loan.status === "ACTIVE" && (
                  <p className="mt-1 font-semibold text-indigo-600 dark:text-indigo-400">
                    Remaining: {formatCurrency(loan.remainingBalance)}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <div className="flex flex-1 items-center gap-2 min-w-[240px]">
                <input
                  type="text"
                  placeholder="Internal underwriting / staff notes..."
                  value={notesMap[loan.id] ?? loan.staffNotes ?? ""}
                  onChange={(e) =>
                    setNotesMap((prev) => ({ ...prev, [loan.id]: e.target.value }))
                  }
                  className="w-full rounded-xl border bg-background px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {loan.repayments.length > 0 && (
                  <button
                    onClick={() => setScheduleLoan(loan)}
                    className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    Repayment Schedule ({loan.repayments.filter((r) => r.status === "PAID").length}/
                    {loan.repayments.length})
                  </button>
                )}

                {loan.status === "PENDING" && (
                  <button
                    onClick={() => setConfirmState({ loan, action: "FORWARD" })}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-500/20 dark:text-indigo-400"
                  >
                    <Forward className="h-3.5 w-3.5" />
                    Forward to Admin
                  </button>
                )}

                {role === "ADMIN" &&
                  ["PENDING", "UNDER_REVIEW"].includes(loan.status) && (
                    <>
                      <button
                        onClick={() => setConfirmState({ loan, action: "APPROVE" })}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Approve & Disburse
                      </button>
                      <button
                        onClick={() => setConfirmState({ loan, action: "REJECT" })}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </>
                  )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Repayment Schedule Modal */}
      {scheduleLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-semibold">
                Repayment Schedule — {scheduleLoan.loanType} Loan
              </h3>
              <button
                onClick={() => setScheduleLoan(null)}
                className="rounded-lg p-1 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <table className="mt-4 w-full text-left text-xs">
              <thead className="border-b text-muted-foreground">
                <tr>
                  <th className="py-2">#</th>
                  <th className="py-2">Due Date</th>
                  <th className="py-2">Principal</th>
                  <th className="py-2">Interest</th>
                  <th className="py-2">Total</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {scheduleLoan.repayments.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 font-medium">{r.installmentNumber}</td>
                    <td className="py-2">{formatDate(r.dueDate)}</td>
                    <td className="py-2">{formatCurrency(r.principalAmount)}</td>
                    <td className="py-2">{formatCurrency(r.interestAmount)}</td>
                    <td className="py-2 font-semibold">{formatCurrency(r.amount)}</td>
                    <td className="py-2">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmState}
        title={
          confirmState?.action === "APPROVE"
            ? "Approve & Disburse Loan?"
            : confirmState?.action === "REJECT"
              ? "Reject Loan Application?"
              : "Forward Loan for Admin Approval?"
        }
        description={
          confirmState?.action === "APPROVE"
            ? `Approving will immediately disburse ${formatCurrency(
                confirmState.loan.requestedAmount
              )} into account ${confirmState.loan.account?.accountNumber} and generate ${
                confirmState.loan.durationMonths
              } monthly installments.`
            : `Confirm action for ${confirmState?.loan.user?.name}'s loan application.`
        }
        variant={confirmState?.action === "REJECT" ? "danger" : "primary"}
        loading={updating}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmState(null)}
      />
    </div>
  );
}
