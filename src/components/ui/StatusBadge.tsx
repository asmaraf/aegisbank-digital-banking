"use client";

import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  APPROVED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  ACTIVE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  PAID: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  PENDING: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  UPCOMING: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  UNDER_REVIEW: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  FAILED: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  REJECTED: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  BLOCKED: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  FROZEN: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  OVERDUE: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  REVERSED: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  INACTIVE: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  CLOSED: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const normalized = status?.toUpperCase() || "PENDING";
  const style =
    STATUS_STYLES[normalized] ||
    "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide",
        style,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {normalized.replace("_", " ")}
    </span>
  );
}
