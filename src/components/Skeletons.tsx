"use client";

/**
 * Reusable skeleton components for loading states
 */

export function GigCardSkeleton() {
  return (
    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <div className="h-5 w-16 rounded-full bg-white/10" />
            <div className="h-5 w-20 rounded-full bg-white/10" />
          </div>
          <div className="h-5 w-3/4 rounded bg-white/10" />
          <div className="flex gap-3">
            <div className="h-3 w-20 rounded bg-white/10" />
            <div className="h-3 w-24 rounded bg-white/10" />
          </div>
        </div>
        <div className="text-right space-y-2">
          <div className="h-7 w-20 rounded bg-white/10" />
          <div className="h-3 w-10 rounded bg-white/10 ml-auto" />
        </div>
      </div>
    </div>
  );
}

export function GigDetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse space-y-6">
      <div className="flex gap-2">
        <div className="h-6 w-16 rounded-full bg-white/10" />
        <div className="h-6 w-16 rounded-full bg-white/10" />
      </div>
      <div className="h-9 w-2/3 rounded bg-white/10" />
      <div className="flex gap-4">
        <div className="h-4 w-24 rounded bg-white/10" />
        <div className="h-4 w-20 rounded bg-white/10" />
        <div className="h-4 w-28 rounded bg-white/10" />
      </div>
      <div className="h-12 w-full rounded-lg bg-white/5" />
      <div className="h-28 w-full rounded-xl bg-emerald-500/5 border border-emerald-500/10" />
      <div className="h-5 w-32 rounded bg-white/10" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 w-full rounded-xl bg-white/[0.02] border border-white/5" />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-36 rounded bg-white/10" />
          <div className="h-4 w-24 rounded bg-white/10" />
        </div>
        <div className="h-10 w-28 rounded-lg bg-white/10" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="h-3 w-16 rounded bg-white/10" />
            <div className="h-7 w-12 rounded bg-white/10" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <div className="h-5 w-40 rounded bg-white/10" />
        {[1, 2].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-white/[0.02] border border-white/5" />
        ))}
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
          <div className="h-3 w-16 rounded bg-white/10" />
          <div className="h-7 w-12 rounded bg-white/10" />
          <div className="h-3 w-10 rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}
