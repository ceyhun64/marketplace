"use client";

import Link from "next/link";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { PLAN_LABELS, PLAN_COLORS } from "@/types/enums";
import { useAdminMerchantList } from "@/queries/useMerchant";
import api from "@/lib/api";
import type { MerchantProfile } from "@/types/entities";

// -- Skeleton ------------------------------------------------------------------

function TableSkeleton() {
  return (
    <div className="bg-(--bg-surface) border border-(--border-light) rounded-xl overflow-hidden">
      {/* Desktop skeleton */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-(--bg-sunken) border-b border-(--border-light)">
            <tr>
              {["Store", "Plan", "Domain", "Status", "Joined", "Action"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-(--border-subtle)">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-5 py-3">
                    <Skeleton className="h-4 w-full rounded" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile skeleton */}
      <div className="sm:hidden divide-y divide-(--border-subtle) p-3 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="pt-3 first:pt-0 space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -- Main component ------------------------------------------------------------

export default function AdminMerchantsTable() {
  const { data: merchants = [], isLoading, refetch } = useAdminMerchantList();
  const [toggling, setToggling] = useState<string | null>(null);

  const handleToggleSuspend = async (merchant: MerchantProfile) => {
    setToggling(merchant.id);
    try {
      await api.patch(`/api/admin/merchants/${merchant.id}/suspend`, {
        isSuspended: !merchant.isSuspended,
      });
      refetch();
    } finally {
      setToggling(null);
    }
  };

  if (isLoading) return <TableSkeleton />;

  if (!merchants.length) {
    return (
      <div className="bg-(--bg-surface) border border-(--border-light) rounded-xl p-12 text-center text-(--text-tertiary)">
        <p className="text-sm font-medium">No merchants yet</p>
      </div>
    );
  }

  return (
    <div className="bg-(--bg-surface) border border-(--border-light) rounded-xl overflow-hidden">
      {/* -- Desktop table — hidden below sm ----------------------------------- */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-(--bg-sunken) border-b border-(--border-light)">
            <tr>
              {["Store", "Plan", "Domain", "Status", "Joined", "Action"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-(--border-subtle)">
            {merchants.map((m) => (
              <tr key={m.id} className="hover:bg-(--bg-sunken) transition-colors">
                {/* Store */}
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-(--charcoal) flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {m.storeName?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-(--text-primary) truncate">{m.storeName}</p>
                      <p className="font-mono text-[10px] text-(--text-tertiary)">/{m.slug}</p>
                    </div>
                  </div>
                </td>
                {/* Plan */}
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLAN_COLORS[(m.subscriptionPlan ?? m.currentPlan ?? "BASIC") as keyof typeof PLAN_COLORS]}`}>
                    {PLAN_LABELS[(m.subscriptionPlan ?? m.currentPlan ?? "BASIC") as keyof typeof PLAN_LABELS]}
                  </span>
                </td>
                {/* Domain */}
                <td className="px-5 py-3">
                  {m.customDomain ? (
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs text-(--info)">{m.customDomain}</span>
                      {m.domainVerified
                        ? <span className="text-(--success) text-xs">✓</span>
                        : <span className="text-(--warning) text-xs">⏳</span>}
                    </div>
                  ) : (
                    <span className="text-xs text-(--charcoal-mist)">—</span>
                  )}
                </td>
                {/* Status */}
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${m.isSuspended ? "bg-(--danger-bg) text-(--danger)" : "bg-(--success-bg) text-(--success)"}`}>
                    {m.isSuspended ? "Suspended" : "Active"}
                  </span>
                </td>
                {/* Joined */}
                <td className="px-5 py-3 text-xs text-(--text-tertiary) whitespace-nowrap">
                  {m.createdAt ? formatDate(m.createdAt) : "—"}
                </td>
                {/* Action */}
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/merchants/${m.id}/store-setup`} className="text-xs text-(--info) hover:underline font-medium">
                      Setup Store
                    </Link>
                    <button
                      onClick={() => handleToggleSuspend(m)}
                      disabled={toggling === m.id}
                      className={`text-xs hover:underline disabled:opacity-50 font-medium ${m.isSuspended ? "text-(--success)" : "text-(--danger)"}`}
                    >
                      {toggling === m.id ? "..." : m.isSuspended ? "Activate" : "Suspend"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* -- Mobile cards — hidden above sm ------------------------------------ */}
      <div className="sm:hidden divide-y divide-(--border-subtle)">
        {merchants.map((m) => (
          <div key={m.id} className="p-4 space-y-3">
            {/* Row 1: Store info + status badge */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-(--charcoal) flex items-center justify-center text-white text-sm font-bold shrink-0">
                {m.storeName?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-(--text-primary) text-sm truncate">{m.storeName}</p>
                <p className="font-mono text-[10px] text-(--text-tertiary) mt-0.5">/{m.slug}</p>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium shrink-0 ${m.isSuspended ? "bg-(--danger-bg) text-(--danger)" : "bg-(--success-bg) text-(--success)"}`}>
                {m.isSuspended ? "Suspended" : "Active"}
              </span>
            </div>

            {/* Row 2: Plan + Domain + Date */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${PLAN_COLORS[(m.subscriptionPlan ?? m.currentPlan ?? "BASIC") as keyof typeof PLAN_COLORS]}`}>
                {PLAN_LABELS[(m.subscriptionPlan ?? m.currentPlan ?? "BASIC") as keyof typeof PLAN_LABELS]}
              </span>
              {m.customDomain && (
                <span className="font-mono text-[11px] text-(--info) flex items-center gap-1">
                  {m.customDomain}
                  {m.domainVerified ? " ✓" : " ⏳"}
                </span>
              )}
              {m.createdAt && (
                <span className="text-[11px] text-(--text-tertiary)">{formatDate(m.createdAt)}</span>
              )}
            </div>

            {/* Row 3: Actions */}
            <div className="flex gap-3">
              <Link
                href={`/admin/merchants/${m.id}/store-setup`}
                className="flex-1 text-center text-xs font-semibold text-(--info) border border-(--info-border) bg-(--info-bg) rounded-lg py-2 min-h-10 flex items-center justify-center"
              >
                Setup Store
              </Link>
              <button
                onClick={() => handleToggleSuspend(m)}
                disabled={toggling === m.id}
                className={`flex-1 text-xs font-semibold rounded-lg py-2 min-h-10 border transition-colors disabled:opacity-50 ${
                  m.isSuspended
                    ? "text-(--success) border-(--success-border) bg-(--success-bg)"
                    : "text-(--danger) border-(--danger-border) bg-(--danger-bg)"
                }`}
              >
                {toggling === m.id ? "..." : m.isSuspended ? "Activate" : "Suspend"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
