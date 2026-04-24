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
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Store", "Plan", "Domain", "Status", "Joined", "Action"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
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
      <div className="bg-white border border-gray-100 rounded-xl p-12 text-center text-gray-400">
        <p className="text-sm font-medium">No merchants yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            {["Store", "Plan", "Domain", "Status", "Joined", "Action"].map(
              (h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {merchants.map((m) => (
            <tr key={m.id} className="hover:bg-gray-50 transition-colors">
              {/* Store */}
              <td className="px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white text-xs font-bold">
                    {m.storeName?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{m.storeName}</p>
                    <p className="font-mono text-[10px] text-gray-400">
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
                    <span className="font-mono text-xs text-blue-600">
                      {m.customDomain}
                    </span>
                    {m.domainVerified ? (
                      <span className="text-emerald-500 text-xs">✓</span>
                    ) : (
                      <span className="text-amber-500 text-xs">⏳</span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-gray-300">—</span>
                )}
              </td>

              {/* Status */}
              <td className="px-5 py-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                    m.isSuspended
                      ? "bg-rose-50 text-rose-600"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {m.isSuspended ? "Suspended" : "Active"}
                </span>
              </td>

              {/* Joined */}
              <td className="px-5 py-3 text-xs text-gray-400">
                {m.createdAt ? formatDate(m.createdAt) : "—"}
              </td>

              {/* Action */}
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/admin/merchants/${m.id}/store-setup`}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    Setup Store
                  </Link>
                  <button
                    onClick={() => handleToggleSuspend(m)}
                    disabled={toggling === m.id}
                    className={`text-xs hover:underline disabled:opacity-50 font-medium ${
                      m.isSuspended ? "text-emerald-600" : "text-rose-500"
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
