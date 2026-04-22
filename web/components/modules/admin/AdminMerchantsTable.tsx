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
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Mağaza", "Plan", "Domain", "Durum", "Tarih", "İşlem"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs text-[#7A7060] uppercase tracking-wide font-medium"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-4 py-3">
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
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <div className="text-4xl mb-3">🏪</div>
        <p className="text-sm font-medium text-gray-700">Henüz merchant yok</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-[#7A7060] uppercase tracking-wide">
          <tr>
            {["Mağaza", "Plan", "Domain", "Durum", "Kayıt Tarihi", "İşlem"].map(
              (h) => (
                <th key={h} className="px-4 py-3 text-left font-medium">
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {merchants.map((m) => (
            <tr key={m.id} className="hover:bg-[#F5F2EB]/40 transition-colors">
              {/* Mağaza */}
              <td className="px-4 py-3">
                <div>
                  <p className="font-semibold text-[#0D0D0D]">{m.storeName}</p>
                  <p className="font-mono text-[10px] text-[#7A7060]">
                    /{m.slug}
                  </p>
                </div>
              </td>

              {/* Plan */}
              <td className="px-4 py-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium ${PLAN_COLORS[m.subscriptionPlan]}`}
                >
                  {PLAN_LABELS[m.subscriptionPlan]}
                </span>
              </td>

              {/* Domain */}
              <td className="px-4 py-3">
                {m.customDomain ? (
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs text-[#1A4A6B]">
                      {m.customDomain}
                    </span>
                    {m.domainVerified ? (
                      <span className="text-[#2D7A4F] text-xs">✓</span>
                    ) : (
                      <span className="text-yellow-500 text-xs">⏳</span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-[#7A7060]">—</span>
                )}
              </td>

              {/* Durum */}
              <td className="px-4 py-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    m.isSuspended
                      ? "bg-red-50 text-red-600"
                      : "bg-green-50 text-green-700"
                  }`}
                >
                  {m.isSuspended ? "Askıya Alındı" : "Aktif"}
                </span>
              </td>

              {/* Tarih */}
              <td className="px-4 py-3 text-xs text-[#7A7060]">
                {m.createdAt ? formatDate(m.createdAt) : "—"}
              </td>

              {/* İşlem */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/admin/merchants/${m.id}/store-setup`}
                    className="text-xs text-[#1A4A6B] hover:underline font-medium"
                  >
                    Mağaza Kur
                  </Link>
                  <button
                    onClick={() => handleToggleSuspend(m)}
                    disabled={toggling === m.id}
                    className={`text-xs hover:underline disabled:opacity-50 ${
                      m.isSuspended ? "text-[#2D7A4F]" : "text-red-500"
                    }`}
                  >
                    {toggling === m.id
                      ? "..."
                      : m.isSuspended
                        ? "Aktifleştir"
                        : "Askıya Al"}
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
