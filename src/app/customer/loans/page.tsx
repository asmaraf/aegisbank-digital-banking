"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Landmark, Calendar, CreditCard, X } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
  useGetAccountsQuery,
  useGetLoansQuery,
  useApplyLoanMutation,
  useRepayLoanMutation,
  LoanApplicationDTO,
} from "@/store/api/bankingApi";
import { loanApplicationSchema } from "@/lib/validations";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils";

type LoanForm = z.infer<typeof loanApplicationSchema>;

export default function CustomerLoansPage() {
  const { data: accountsData } = useGetAccountsQuery();
  const { data: loansData } = useGetLoansQuery();
  const [applyLoan, { isLoading: applying }] = useApplyLoanMutation();
  const [repayLoan, { isLoading: repaying }] = useRepayLoanMutation();
  const [scheduleLoan, setScheduleLoan] = useState<LoanApplicationDTO | null>(null);

  const accounts = accountsData?.accounts ?? [];
  const loans = loansData?.loans ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoanForm>({
    resolver: zodResolver(loanApplicationSchema),
    defaultValues: {
      loanType: "PERSONAL",
      employmentStatus: "EMPLOYED",
      durationMonths: 12,
    },
  });

  const onSubmit = async (values: LoanForm) => {
    try {
      await applyLoan(values).unwrap();
      toast.success("Loan application submitted!");
      reset();
    } catch (err: unknown) {
      toast.error(
        (err as { data?: { error?: string } })?.data?.error || "Application failed"
      );
    }
  };

  const handleRepay = async (loan: LoanApplicationDTO) => {
    try {
      await repayLoan({ id: loan.id, accountId: loan.accountId }).unwrap();
      toast.success("Loan installment paid successfully!");
    } catch (err: unknown) {
      toast.error(
        (err as { data?: { error?: string } })?.data?.error || "Repayment failed"
      );
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Loans & Financing</h1>
          <p className="text-sm text-muted-foreground">
            Apply for personal or business loans, track schedules, and pay installments
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Loan Application Form */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h3 className="text-base font-semibold">Apply for a Loan</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Disbursement Account
                </label>
                <select
                  {...register("accountId")}
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select account...</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.accountType} ({a.accountNumber})
                    </option>
                  ))}
                </select>
                {errors.accountId && (
                  <p className="mt-1 text-xs text-red-500">{errors.accountId.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Loan Type
                  </label>
                  <select
                    {...register("loanType")}
                    className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                  >
                    <option value="PERSONAL">Personal</option>
                    <option value="BUSINESS">Business</option>
                    <option value="HOME">Home</option>
                    <option value="AUTO">Auto</option>
                    <option value="EDUCATION">Education</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Duration (Months)
                  </label>
                  <input
                    type="number"
                    {...register("durationMonths")}
                    className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Requested ($)
                  </label>
                  <input
                    type="number"
                    {...register("requestedAmount")}
                    placeholder="10000"
                    className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                  />
                  {errors.requestedAmount && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.requestedAmount.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Monthly Income ($)
                  </label>
                  <input
                    type="number"
                    {...register("monthlyIncome")}
                    placeholder="6000"
                    className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Employment Status
                </label>
                <select
                  {...register("employmentStatus")}
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                >
                  <option value="EMPLOYED">Employed</option>
                  <option value="SELF_EMPLOYED">Self Employed</option>
                  <option value="BUSINESS_OWNER">Business Owner</option>
                  <option value="STUDENT">Student</option>
                  <option value="UNEMPLOYED">Unemployed</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Loan Purpose
                </label>
                <textarea
                  rows={3}
                  {...register("description")}
                  placeholder="Describe how the funds will be used..."
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
                disabled={applying}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {applying ? "Submitting..." : "Submit Loan Application"}
              </button>
            </form>
          </div>

          {/* Loans List */}
          <div className="space-y-4 lg:col-span-2">
            {loans.length === 0 ? (
              <EmptyState
                title="No loan applications"
                description="Apply for a loan using the form to track approvals and repayments."
              />
            ) : (
              loans.map((loan) => (
                <div key={loan.id} className="rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
                        <Landmark className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">
                            {loan.loanType} Loan — {formatCurrency(loan.requestedAmount)}
                          </h4>
                          <StatusBadge status={loan.status} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {loan.durationMonths} months • {loan.interestRate}% APR • Applied{" "}
                          {formatDate(loan.createdAt)}
                        </p>
                      </div>
                    </div>

                    {loan.status === "ACTIVE" && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Remaining Balance</p>
                        <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                          {formatCurrency(loan.remainingBalance)}
                        </p>
                      </div>
                    )}
                  </div>

                  <p className="mt-3 text-sm text-muted-foreground">{loan.description}</p>

                  {loan.repayments.length > 0 && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-4">
                      <button
                        onClick={() => setScheduleLoan(loan)}
                        className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        View Schedule (
                        {loan.repayments.filter((r) => r.status === "PAID").length}/
                        {loan.repayments.length} paid)
                      </button>

                      {loan.status === "ACTIVE" && (
                        <button
                          onClick={() => handleRepay(loan)}
                          disabled={repaying}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          Pay Next Installment
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {scheduleLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-semibold">Repayment Schedule</h3>
              <button onClick={() => setScheduleLoan(null)}>
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
    </DashboardShell>
  );
}
