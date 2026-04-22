"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useShipments } from "@/queries/useCouriers";
import CourierAssignPanel from "@/components/modules/fulfillment/CourierAssignPanel";
import { SHIPMENT_STATUS_LABELS, SHIPMENT_STATUS_COLORS } from "@/types/enums";
import { formatDateTime } from "@/lib/format";
import type { Shipment } from "@/types/entities";

const STATUS_FILTERS = [
  { value: "", label: "Tümü" },
  { value: "PENDING", label: "Bekleyen" },
  { value: "COURIER_ASSIGNED", label: "Kurye Atandı" },
  { value: "IN_TRANSIT", label: "Yolda" },
  { value: "DELIVERED", label: "Teslim" },
];

export default function AdminFulfillmentPanel() {
  const [statusFilter, setStatusFilter] = useState("");
  const [assignTarget, setAssignTarget] = useState<Shipment | null>(null);

  const { data: shipments = [], isLoading } = useShipments(
    statusFilter ? { status: statusFilter } : undefined,
  );

  return (
    <div className="space-y-5">
      {/* Filtreler */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all border ${
              statusFilter === value
                ? "bg-[#0D0D0D] text-[#F5F2EB] border-[#0D0D0D]"
                : "bg-white text-[#7A7060] border-gray-200 hover:border-gray-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tablo */}
      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <tbody className="divide-y divide-gray-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-4 rounded" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !shipments.length ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="text-4xl mb-3">🚚</div>
          <p className="text-sm font-medium text-gray-700">
            Gönderi bulunamadı
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-[#7A7060] uppercase tracking-wide">
              <tr>
                {[
                  "Takip No",
                  "Durum",
                  "Kurye",
                  "Güncelleme",
                  "Etiket",
                  "İşlem",
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shipments.map((s) => (
                <tr
                  key={s.id}
                  className="hover:bg-[#F5F2EB]/40 transition-colors"
                >
                  {/* Takip No */}
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-bold text-[#1A4A6B]">
                      {s.trackingNumber}
                    </span>
                  </td>

                  {/* Durum */}
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${SHIPMENT_STATUS_COLORS[s.status]}`}
                    >
                      {SHIPMENT_STATUS_LABELS[s.status]}
                    </span>
                  </td>

                  {/* Kurye */}
                  <td className="px-4 py-3 text-sm text-[#0D0D0D]">
                    {s.courierName ?? (
                      <span className="text-xs text-[#7A7060]">Atanmadı</span>
                    )}
                  </td>

                  {/* Güncelleme */}
                  <td className="px-4 py-3 text-xs text-[#7A7060]">
                    {s.updatedAt ? formatDateTime(s.updatedAt) : "—"}
                  </td>

                  {/* Etiket */}
                  <td className="px-4 py-3">
                    {s.labelUrl ? (
                      <a
                        href={s.labelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#2D7A4F] hover:underline"
                      >
                        📄 İndir
                      </a>
                    ) : (
                      <span className="text-xs text-[#7A7060]">—</span>
                    )}
                  </td>

                  {/* İşlem */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setAssignTarget(s)}
                      className="text-xs text-[#1A4A6B] hover:underline font-medium"
                    >
                      {s.courierId ? "Yeniden Ata" : "Kurye Ata"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Modal */}
      {assignTarget && (
        <CourierAssignPanel
          shipment={assignTarget}
          onClose={() => setAssignTarget(null)}
        />
      )}
    </div>
  );
}
