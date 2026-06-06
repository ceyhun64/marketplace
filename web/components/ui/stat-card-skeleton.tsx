import { Skeleton } from "@/components/ui/skeleton";

/** Shared loading placeholder for dashboard stat cards. */
export function StatCardSkeleton() {
  return (
    <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-5">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-7 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-3 w-16 mt-1.5" />
    </div>
  );
}
