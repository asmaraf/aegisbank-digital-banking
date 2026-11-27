"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Search, UserPlus, ShieldCheck, Ban, CheckCircle2, Eye, X } from "lucide-react";
import {
  useGetCustomersQuery,
  useRegisterCustomerMutation,
  useUpdateCustomerMutation,
  useGetCustomerDetailQuery,
  CustomerDTO,
} from "@/store/api/bankingApi";
import { registerCustomerSchema } from "@/lib/validations";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { formatCurrency, formatDateTime } from "@/lib/utils";

type NewCustomerForm = z.infer<typeof registerCustomerSchema>;

export function CustomersManagementView({ role }: { role: "ADMIN" | "STAFF" }) {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useGetCustomersQuery(search ? { search } : undefined);
  const [registerCustomer, { isLoading: creating }] = useRegisterCustomerMutation();
  const [updateCustomer, { isLoading: updating }] = useUpdateCustomerMutation();

  const [showNewModal, setShowNewModal] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<{
    customer: CustomerDTO;
    status: "ACTIVE" | "INACTIVE" | "BLOCKED";
  } | null>(null);

  const { data: detailData } = useGetCustomerDetailQuery(detailId || "", {
    skip: !detailId,
  });

  const form = useForm<NewCustomerForm>({
    resolver: zodResolver(registerCustomerSchema),
    defaultValues: { accountType: "SAVINGS" },
  });

  const customers = data?.customers ?? [];

  const handleCreate = async (values: NewCustomerForm) => {
    try {
      await registerCustomer(values).unwrap();
      toast.success("Customer registered with initial bank account");
      form.reset();
      setShowNewModal(false);
    } catch (err: unknown) {
      toast.error(
        (err as { data?: { error?: string } })?.data?.error || "Registration failed"
      );
    }
  };

  const handleStatusConfirm = async () => {
    if (!confirmStatus) return;
    try {
      await updateCustomer({
        id: confirmStatus.customer.id,
        status: confirmStatus.status,
      }).unwrap();
      toast.success(`Customer status updated to ${confirmStatus.status}`);
      setConfirmStatus(null);
    } catch (err: unknown) {
      toast.error(
        (err as { data?: { error?: string } })?.data?.error || "Failed to update status"
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, email, phone..."
            className="w-full rounded-xl border bg-card py-2 pl-9 pr-4 text-sm outline-none focus:border-indigo-500"
          />
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <UserPlus className="h-4 w-4" />
          Register Customer
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
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Accounts</th>
                  <th className="px-4 py-3">Total Balance</th>
                  <th className="px-4 py-3">KYC</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-semibold">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {c.accounts.length} account(s)
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {formatCurrency(c.totalBalance)}
                    </td>
                    <td className="px-4 py-3">
                      {c.kycVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Verified
                        </span>
                      ) : (
                        <button
                          onClick={async () => {
                            await updateCustomer({ id: c.id, kycVerified: true }).unwrap();
                            toast.success("KYC verified");
                          }}
                          className="rounded-lg border px-2 py-1 text-xs font-medium text-amber-600 hover:bg-amber-500/10"
                        >
                          Verify KYC
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setDetailId(c.id)}
                          className="rounded-lg border p-1.5 hover:bg-muted"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {role === "ADMIN" && c.status !== "ACTIVE" && (
                          <button
                            onClick={() => setConfirmStatus({ customer: c, status: "ACTIVE" })}
                            className="rounded-lg border p-1.5 text-emerald-600 hover:bg-emerald-500/10"
                            title="Activate"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {role === "ADMIN" && c.status !== "BLOCKED" && (
                          <button
                            onClick={() => setConfirmStatus({ customer: c, status: "BLOCKED" })}
                            className="rounded-lg border p-1.5 text-red-600 hover:bg-red-500/10"
                            title="Block Suspicious Customer"
                          >
                            <Ban className="h-3.5 w-3.5" />
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
      )}

      {/* Register Customer Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-semibold">Register New Customer</h3>
              <button onClick={() => setShowNewModal(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={form.handleSubmit(handleCreate)} className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  {...form.register("name")}
                  placeholder="Full Name"
                  className="rounded-xl border bg-background px-3 py-2 text-sm"
                />
                <input
                  {...form.register("email")}
                  placeholder="Email"
                  className="rounded-xl border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  {...form.register("phone")}
                  placeholder="Phone"
                  className="rounded-xl border bg-background px-3 py-2 text-sm"
                />
                <select
                  {...form.register("accountType")}
                  className="rounded-xl border bg-background px-3 py-2 text-sm"
                >
                  <option value="SAVINGS">Savings Account</option>
                  <option value="CURRENT">Current Account</option>
                  <option value="BUSINESS">Business Account</option>
                </select>
              </div>
              <input
                {...form.register("address")}
                placeholder="Address"
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="password"
                  {...form.register("password")}
                  placeholder="Temporary Password"
                  className="rounded-xl border bg-background px-3 py-2 text-sm"
                />
                <input
                  type="password"
                  maxLength={6}
                  {...form.register("transactionPin")}
                  placeholder="4-6 digit PIN"
                  className="rounded-xl border bg-background px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                {creating ? "Creating..." : "Create Customer & Account"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Customer Detail Drawer */}
      {detailId && detailData?.customer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
          <div className="h-full w-full max-w-lg overflow-y-auto border-l bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-lg font-bold">{detailData.customer.name}</h3>
                <p className="text-xs text-muted-foreground">{detailData.customer.email}</p>
              </div>
              <button onClick={() => setDetailId(null)} className="rounded-lg p-1 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                  Bank Accounts
                </h4>
                <div className="mt-2 space-y-2">
                  {detailData.customer.accounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="flex items-center justify-between rounded-xl border p-3"
                    >
                      <div>
                        <p className="font-mono text-xs font-semibold">
                          {acc.accountNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">{acc.accountType}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{formatCurrency(acc.balance)}</p>
                        <StatusBadge status={acc.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                  Recent Transactions
                </h4>
                <div className="mt-2 space-y-2">
                  {detailData.transactions.slice(0, 8).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between rounded-xl border p-3 text-xs"
                    >
                      <div>
                        <p className="font-semibold">{tx.description}</p>
                        <p className="text-muted-foreground">
                          {tx.transactionId} • {formatDateTime(tx.createdAt)}
                        </p>
                      </div>
                      <span className="font-bold">{formatCurrency(tx.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmStatus}
        title={`Set Customer Status to ${confirmStatus?.status}?`}
        description={`This will immediately update access for ${confirmStatus?.customer.name}.`}
        variant={confirmStatus?.status === "BLOCKED" ? "danger" : "primary"}
        loading={updating}
        onConfirm={handleStatusConfirm}
        onCancel={() => setConfirmStatus(null)}
      />
    </div>
  );
}
