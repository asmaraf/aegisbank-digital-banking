"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Landmark, Lock, Mail, ArrowRight } from "lucide-react";
import { loginSchema } from "@/lib/validations";

type LoginForm = z.infer<typeof loginSchema>;

const DEMO_USERS = [
  { label: "Admin", email: "admin@aegisbank.com", pass: "Admin@123" },
  { label: "Bank Staff", email: "staff@aegisbank.com", pass: "Staff@123" },
  { label: "Customer", email: "customer@aegisbank.com", pass: "Customer@123" },
];

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setSubmitting(true);
    try {
      const res = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (res?.error) {
        toast.error("Authentication failed", {
          description: res.error || "Verify credentials and retry.",
        });
        return;
      }

      toast.success("Signed in", {
        description: "Redirecting to your portal.",
      });

      const callbackUrl = searchParams.get("callbackUrl");
      const destination =
        callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
          ? callbackUrl
          : "/dashboard";

      router.replace(destination);
    } catch {
      toast.error("Sign in failed", {
        description: "Check network connection and retry.",
      });
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
      <div className="relative z-10 w-full max-w-md space-y-6">
        <div className="text-center text-white">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Landmark className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">AegisBank</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold">Sign in to your portal</h1>
          <p className="mt-1 text-sm text-slate-300">
            Digital banking for customers, staff, and administrators
          </p>
        </div>

        <div className="rounded-2xl border border-white/15 bg-card/95 p-6 shadow-2xl backdrop-blur-md">
          {searchParams.get("callbackUrl") === "/customer/transfer" && (
            <div className="mb-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3 text-xs text-indigo-300">
              <span className="font-semibold text-white">Customer login required:</span> Sign in with a Customer account to transfer funds.
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  {...register("email")}
                  placeholder="name@aegisbank.com"
                  className="w-full rounded-xl border bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  {...register("password")}
                  placeholder="••••••••"
                  className="w-full rounded-xl border bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "Signing in..." : "Sign In"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 border-t pt-4">
            <p className="text-xs font-medium text-muted-foreground">
              Quick Demo Access (Click to fill):
            </p>
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.label}
                  type="button"
                  onClick={() => {
                    setValue("email", u.email);
                    setValue("password", u.pass);
                  }}
                  className="rounded-xl border bg-background px-2.5 py-2 text-xs font-medium hover:border-indigo-500 hover:bg-indigo-500/5 transition"
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-slate-300">
          New to AegisBank?{" "}
          <Link
            href="/register"
            className="font-semibold text-indigo-400 hover:underline"
          >
            Open a customer account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0D14]" />}>
      <LoginFormContent />
    </Suspense>
  );
}
