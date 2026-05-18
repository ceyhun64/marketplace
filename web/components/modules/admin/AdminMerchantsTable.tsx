"use client";

import Link from "next/link";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { PLAN_LABELS, PLAN_COLORS } from "@/types/enums";
import { useAdminMerchantList } from "@/queries/useMerchant";
import api from "@/lib/api";
import type { MerchantProfile } from "@/types/entities";

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

  if (isLoading) {
    return (
      <div className="bg-(--bg-surface) border border-(--border-light) rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-(--bg-sunken) border-b border-(--border-light)">
            <tr>
              {["Store", "Plan", "Domain", "Status", "Joined", "Action"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ),
              )}
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
    );
  }

  if (!merchants.length) {
    return (
      <div className="bg-(--bg-surface) border border-(--border-light) rounded-xl p-12 text-center text-(--text-tertiary)">
        <p className="text-sm font-medium">No merchants yet</p>
      </div>
    );
  }

  return (
    <div className="bg-(--bg-surface) border border-(--border-light) rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-(--bg-sunken) border-b border-(--border-light)">
          <tr>
            {["Store", "Plan", "Domain", "Status", "Joined", "Action"].map(
              (h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-left text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide"
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-(--border-subtle)">
          {merchants.map((m) => (
            <tr key={m.id} className="hover:bg-(--bg-sunken) transition-colors">
              {/* Store */}
              <td className="px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-(--charcoal) flex items-center justify-center text-white text-xs font-bold">
                    {m.storeName?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-(--text-primary)">{m.storeName}</p>
                    <p className="font-mono text-[10px] text-(--text-tertiary)">
                      /{m.slug}
                    </p>
                  </div>
                </div>
              </td>

              {/* Plan */}
              <td className="px-5 py-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLAN_COLORS[m.subscriptionPlan]}`}
                >
                  {PLAN_LABELS[m.subscriptionPlan]}
                </span>
              </td>

              {/* Domain */}
              <td className="px-5 py-3">
                {m.customDomain ? (
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs text-(--info)">
                      {m.customDomain}
                    </span>
                    {m.domainVerified ? (
                      <span className="text-(--success) text-xs">✓</span>
                    ) : (
                      <span className="text-(--warning) text-xs">⏳</span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-(--charcoal-mist)">—</span>
                )}
              </td>

              {/* Status */}
              <td className="px-5 py-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                    m.isSuspended
                      ? "bg-(--danger-bg) text-(--danger)"
                      : "bg-(--success-bg) text-(--success)"
                  }`}
                >
                  {m.isSuspended ? "Suspended" : "Active"}
                </span>
              </td>

              {/* Joined */}
              <td className="px-5 py-3 text-xs text-(--text-tertiary)">
                {m.createdAt ? formatDate(m.createdAt) : "—"}
              </td>

              {/* Action */}
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/admin/merchants/${m.id}/store-setup`}
                    className="text-xs text-(--info) hover:underline font-medium"
                  >
                    Setup Store
                  </Link>
                  <button
                    onClick={() => handleToggleSuspend(m)}
                    disabled={toggling === m.id}
                    className={`text-xs hover:underline disabled:opacity-50 font-medium ${
                      m.isSuspended ? "text-(--success)" : "text-(--danger)"
                    }`}
                  >
                    {toggling === m.id
                      ? "..."
                      : m.isSuspended
                        ? "Activate"
                        : "Suspend"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
