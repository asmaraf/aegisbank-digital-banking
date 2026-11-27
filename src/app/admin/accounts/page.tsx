"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Plus, Snowflake, Play, SlidersHorizontal, X } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
  useGetAccountsQuery,
  useGetCustomersQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  BankAccountDTO,
} from "@/store/api/bankingApi";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { formatCurrency } from "@/lib/utils";

export default function AdminAccountsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useGetAccountsQuery(search ? { search } : undefined);
  const { data: custData } = useGetCustomersQuery();
  const [createAccount, { isLoading: creating }] = useCreateAccountMutation();
  const [updateAccount, { isLoading: updating }] = useUpdateAccountMutation();

  const [showCreate, setShowCreate] = useState(false);
  const [newAcc, setNewAcc] = useState({
    userId: "",
    accountType: "SAVINGS",
    initialDeposit: 0,
    dailyTransferLimit: 10000,
    maxSingleTransaction: 5000,
    minBalance: 50,
  });

  const [editLimitsAcc, setEditLimitsAcc] = useState<BankAccountDTO | null>(null);
  const [limitsForm, setLimitsForm] = useState({
    dailyTransferLimit: 10000,
    maxSingleTransaction: 5000,
    minBalance: 0,
  });

  const [freezeTarget, setFreezeTarget] = useState<BankAccountDTO | null>(null);

  const accounts = data?.accounts ?? [];
  const customers = custData?.customers ?? [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAccount(newAcc).unwrap();
      toast.success("Bank account created");
      setShowCreate(false);
    } catch (err: unknown) {
      toast.error(
        (err as { data?: { error?: string } })?.data?.error || "Failed to create account"
      );
    }
  };

  const handleFreezeToggle = async () => {
    if (!freezeTarget) return;
    const nextStatus = freezeTarget.status === "FROZEN" ? "ACTIVE" : "FROZEN";
    try {
      await updateAccount({ id: freezeTarget.id, status: nextStatus }).unwrap();
      toast.success(`Account ${nextStatus.toLowerCase()}`);
      setFreezeTarget(null);
    } catch {
      toast.error("Failed to update account status");
    }
  };

  const handleSaveLimits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLimitsAcc) return;
    try {
      await updateAccount({ id: editLimitsAcc.id, ...limitsForm }).unwrap();
      toast.success("Account transaction limits updated");
      setEditLimitsAcc(null);
    } catch {
      toast.error("Failed to update limits");
    }
  };

  return (
    <DashboardShell onSearch={setSearch}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bank Account Management</h1>
            <p className="text-sm text-muted-foreground">
              Create accounts, freeze suspicious activity, and configure per-account limits
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Create Bank Account
          </button>
        </div>

        {isLoading ? (
          <SkeletonCard lines={5} />
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Account Number</th>
                    <th className="px-4 py-3">Holder</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Balance</th>
                    <th className="px-4 py-3">Daily / Max Tx</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {accounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs font-semibold">
                        {acc.accountNumber}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{acc.user?.name}</p>
                        <p className="text-xs text-muted-foreground">{acc.user?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium">{acc.accountType}</td>
                      <td className="px-4 py-3 font-semibold">
                        {formatCurrency(acc.balance)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatCurrency(acc.dailyTransferLimit)} /{" "}
                        {formatCurrency(acc.maxSingleTransaction)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={acc.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditLimitsAcc(acc);
                              setLimitsForm({
                                dailyTransferLimit: acc.dailyTransferLimit,
                                maxSingleTransaction: acc.maxSingleTransaction,
                                minBalance: acc.minBalance,
                              });
                            }}
                            className="rounded-lg border p-1.5 hover:bg-muted"
                            title="Configure Limits"
                          >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setFreezeTarget(acc)}
                            className={`rounded-lg border p-1.5 ${
                              acc.status === "FROZEN"
                                ? "text-emerald-600 hover:bg-emerald-500/10"
                                : "text-red-600 hover:bg-red-500/10"
                            }`}
                            title={acc.status === "FROZEN" ? "Unfreeze Account" : "Freeze Account"}
                          >
                            {acc.status === "FROZEN" ? (
                              <Play className="h-3.5 w-3.5" />
                            ) : (
                              <Snowflake className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Account Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-semibold">Open Customer Bank Account</h3>
              <button onClick={() => setShowCreate(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Customer
                </label>
                <select
                  required
                  value={newAcc.userId}
                  onChange={(e) => setNewAcc({ ...newAcc, userId: e.target.value })}
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Account Type
                  </label>
                  <select
                    value={newAcc.accountType}
                    onChange={(e) => setNewAcc({ ...newAcc, accountType: e.target.value })}
                    className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                  >
                    <option value="SAVINGS">Savings</option>
                    <option value="CURRENT">Current</option>
                    <option value="BUSINESS">Business</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Initial Deposit ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newAcc.initialDeposit}
                    onChange={(e) =>
                      setNewAcc({ ...newAcc, initialDeposit: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                {creating ? "Creating..." : "Create Account"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Limits Modal */}
      {editLimitsAcc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-semibold">
                Limits — {editLimitsAcc.accountNumber}
              </h3>
              <button onClick={() => setEditLimitsAcc(null)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveLimits} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Daily Transfer Limit ($)
                </label>
                <input
                  type="number"
                  value={limitsForm.dailyTransferLimit}
                  onChange={(e) =>
                    setLimitsForm({
                      ...limitsForm,
                      dailyTransferLimit: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Max Single Transaction ($)
                </label>
                <input
                  type="number"
                  value={limitsForm.maxSingleTransaction}
                  onChange={(e) =>
                    setLimitsForm({
                      ...limitsForm,
                      maxSingleTransaction: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Minimum Balance ($)
                </label>
                <input
                  type="number"
                  value={limitsForm.minBalance}
                  onChange={(e) =>
                    setLimitsForm({ ...limitsForm, minBalance: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={updating}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Save Limits
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!freezeTarget}
        title={
          freezeTarget?.status === "FROZEN"
            ? "Unfreeze Bank Account?"
            : "Freeze Bank Account?"
        }
        description={`Confirm ${
          freezeTarget?.status === "FROZEN" ? "reactivating" : "freezing"
        } account ${freezeTarget?.accountNumber}.`}
        variant={freezeTarget?.status === "FROZEN" ? "primary" : "danger"}
        loading={updating}
        onConfirm={handleFreezeToggle}
        onCancel={() => setFreezeTarget(null)}
      />
    </DashboardShell>
  );
}
