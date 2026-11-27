"use client";

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse rounded-2xl border bg-card p-6 shadow-sm">
      <div className="h-4 w-1/3 rounded bg-muted" />
      <div className="mt-4 h-8 w-1/2 rounded bg-muted" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: lines }).map((_, idx) => (
          <div key={idx} className="h-3 w-full rounded bg-muted" />
        ))}
      </div>
    </div>
  );
}
