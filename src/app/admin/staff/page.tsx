"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { UserPlus, X, CheckCircle2, Ban } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { formatDate } from "@/lib/utils";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
  createdAt: string;
}

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
  });

  const loadStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/staff");
      const json = await res.json();
      setStaff(json.staff ?? []);
    } catch {
      toast.error("Load failed", {
        description: "Refresh to reload the bank staff roster.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error("Registration failed", {
          description: json.error || "Review credentials and retry.",
        });
        return;
      }
      toast.success("Staff registered", {
        description: "New bank staff member added to roster.",
      });
      setForm({ name: "", email: "", phone: "", address: "", password: "" });
      setShowModal(false);
      loadStaff();
    } catch {
      toast.error("Network error", {
        description: "Check server connection and retry.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: "ACTIVE" | "BLOCKED") => {
    try {
      const res = await fetch("/api/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        toast.error("Update failed", {
          description: "Check permissions and retry.",
        });
        return;
      }
      toast.success("Status updated", {
        description: `Staff member marked as ${status}.`,
      });
      loadStaff();
    } catch {
      toast.error("Network error", {
        description: "Check server connection and retry.",
      });
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bank Staff</h1>
            <p className="text-sm text-muted-foreground">
              Register and manage Bank Staff accounts (only Admins can create staff)
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <UserPlus className="h-4 w-4" />
            Add Bank Staff
          </button>
        </div>

        {loading ? (
          <SkeletonCard lines={4} />
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Added</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {staff.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-semibold">{s.name}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{s.email}</td>
                      <td className="px-4 py-3 text-xs">{s.phone || "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(s.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {s.status === "ACTIVE" ? (
                          <button
                            onClick={() => handleStatusChange(s.id, "BLOCKED")}
                            className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-500/10"
                          >
                            <Ban className="h-3.5 w-3.5" />
                            Block
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(s.id, "ACTIVE")}
                            className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-500/10"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-semibold">Register Bank Staff</h3>
              <button onClick={() => setShowModal(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="mt-4 space-y-3">
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Full Name"
                className="w-full rounded-xl border bg-background px-3.5 py-2 text-sm"
              />
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="staff.name@aegisbank.com"
                className="w-full rounded-xl border bg-background px-3.5 py-2 text-sm"
              />
              <input
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone Number"
                className="w-full rounded-xl border bg-background px-3.5 py-2 text-sm"
              />
              <input
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Branch / Office Address"
                className="w-full rounded-xl border bg-background px-3.5 py-2 text-sm"
              />
              <input
                required
                type="password"
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Password (min 8 chars)"
                className="w-full rounded-xl border bg-background px-3.5 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create Staff Account"}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
