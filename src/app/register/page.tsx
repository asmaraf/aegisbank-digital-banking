"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Landmark, ArrowRight } from "lucide-react";
import { registerCustomerSchema } from "@/lib/validations";

type RegisterForm = z.infer<typeof registerCustomerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerCustomerSchema),
    defaultValues: {
      accountType: "SAVINGS",
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Registration failed");
        return;
      }
      toast.success("Account created! You can now sign in.");
      router.push("/login");
    } catch {
      toast.error("Network error during registration");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#0B0D14] px-4 py-12">
      <div
        aria-hidden="true"
        style={{ backgroundImage: "url('/images/banking-parallax.jpg')" }}
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] bg-[#0B0D14]/65 backdrop-blur-[2px]"
      />
      <div className="relative z-10 w-full max-w-lg space-y-6">
        <div className="text-center text-white">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Landmark className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">AegisBank</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold">Open a Digital Bank Account</h1>
          <p className="mt-1 text-sm text-slate-300">
            Get instant access to Savings, Current, or Business banking
          </p>
        </div>

        <div className="rounded-2xl border border-white/15 bg-card/95 p-6 shadow-2xl backdrop-blur-md">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Full Name
                </label>
                <input
                  {...register("name")}
                  placeholder="Alex Rivera"
                  className="w-full rounded-xl border bg-background px-3.5 py-2 text-sm outline-none focus:border-indigo-500"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Email Address
                </label>
                <input
                  type="email"
                  {...register("email")}
                  placeholder="alex@example.com"
                  className="w-full rounded-xl border bg-background px-3.5 py-2 text-sm outline-none focus:border-indigo-500"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Phone Number
                </label>
                <input
                  {...register("phone")}
                  placeholder="+1 (555) 234-5678"
                  className="w-full rounded-xl border bg-background px-3.5 py-2 text-sm outline-none focus:border-indigo-500"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Account Type
                </label>
                <select
                  {...register("accountType")}
                  className="w-full rounded-xl border bg-background px-3.5 py-2 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="SAVINGS">Savings Account</option>
                  <option value="CURRENT">Current Account</option>
                  <option value="BUSINESS">Business Account</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Residential Address
              </label>
              <input
                {...register("address")}
                placeholder="123 Fintech Ave, Austin, TX"
                className="w-full rounded-xl border bg-background px-3.5 py-2 text-sm outline-none focus:border-indigo-500"
              />
              {errors.address && (
                <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Password (min 8 chars)
                </label>
                <input
                  type="password"
                  {...register("password")}
                  placeholder="••••••••"
                  className="w-full rounded-xl border bg-background px-3.5 py-2 text-sm outline-none focus:border-indigo-500"
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Transaction PIN (4-6 digits)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  {...register("transactionPin")}
                  placeholder="1234"
                  className="w-full rounded-xl border bg-background px-3.5 py-2 text-sm outline-none focus:border-indigo-500"
                />
                {errors.transactionPin && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.transactionPin.message}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "Creating Account..." : "Create Account"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-300">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-indigo-400 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
