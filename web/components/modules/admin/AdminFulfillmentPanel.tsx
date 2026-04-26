"use client";

import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useShipments, shipmentKeys } from "@/queries/useCouriers";
import CourierAssignPanel from "@/components/modules/fulfillment/CourierAssignPanel";
import { SHIPMENT_STATUS_LABELS, SHIPMENT_STATUS_COLORS } from "@/types/enums";
import { formatDateTime } from "@/lib/format";
import type { Shipment } from "@/types/entities";
import { useSignalRTracking } from "@/hooks/use-signalr-tracking";
import { Wifi, WifiOff, Radio } from "lucide-react";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "LABEL_GENERATED", label: "Label Generated" },
  { value: "COURIER_ASSIGNED", label: "Courier Assigned" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "DELIVERED", label: "Delivered" },
];

export default function AdminFulfillmentPanel() {
  const [statusFilter, setStatusFilter] = useState("");
  const [assignTarget, setAssignTarget] = useState<Shipment | null>(null);
  const [liveUpdates, setLiveUpdates] = useState<
    Record<string, { status: string; updatedAt: string }>
  >({});
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());

  const queryClient = useQueryClient();

  const { data: shipments = [], isLoading } = useShipments(
    statusFilter ? { status: statusFilter } : undefined,
  );

  // Tüm görünen shipment ID'lerini SignalR'a kayıt et
  const shipmentIds = (shipments as Shipment[]).map((s) => s.id);

  const { status: signalrStatus, lastUpdate } = useSignalRTracking({
    shipmentIds,
    enabled: shipmentIds.length > 0,
    onUpdate: useCallback(
      (update) => {
        // Canlı güncellemeyi state'e kaydet
        setLiveUpdates((prev) => ({
          ...prev,
          [update.shipmentId]: {
            status: update.status,
            updatedAt: update.updatedAt,
          },
        }));

        // Flash animasyonu tetikle
        setFlashIds((prev) => new Set(prev).add(update.shipmentId));
        setTimeout(() => {
          setFlashIds((prev) => {
            const next = new Set(prev);
            next.delete(update.shipmentId);
            return next;
          });
        }, 2000);

        // Cache'i de yenile (kısa gecikmeyle, backend'in yazması için)
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: shipmentKeys.list() });
        }, 500);
      },
      [queryClient],
    ),
  });

  const isConnected = signalrStatus === "connected";

  // Bir shipment'ın gösterilecek güncel statusunu belirle
  const getDisplayStatus = (shipment: Shipment): string => {
    const live = liveUpdates[shipment.id];
    return live?.status ?? shipment.status;
  };

  return (
    <div className="space-y-5">
      {/* Filters + SignalR Status */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all border ${
                statusFilter === value
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* SignalR bağlantı durumu göstergesi */}
        <div
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
            isConnected
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : signalrStatus === "connecting"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-gray-50 text-gray-500 border-gray-200"
          }`}
        >
          {isConnected ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <Radio className="w-3 h-3" />
              <span>Canlı</span>
            </>
          ) : signalrStatus === "connecting" ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <Wifi className="w-3 h-3" />
              <span>Bağlanıyor...</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              <span>Çevrimdışı</span>
            </>
          )}
        </div>
      </div>

      {/* Son güncelleme bilgisi */}
      {lastUpdate && (
        <div className="text-xs text-gray-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          Son güncelleme: Takip #
          {lastUpdate.shipmentId.slice(0, 8).toUpperCase()} →{" "}
          <span className="font-medium text-blue-600">{lastUpdate.status}</span>
          <span className="ml-1">
            {new Date(lastUpdate.updatedAt).toLocaleTimeString("tr-TR")}
          </span>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full">
            <tbody className="divide-y divide-gray-50">
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-5 py-3">
                      <Skeleton className="h-4 rounded" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !shipments.length ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center text-gray-400">
          <p className="text-sm font-medium">Kargo bulunamadı</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                {[
                  "Takip No.",
                  "Durum",
                  "Kurye",
                  "Güncelleme",
                  "Etiket",
                  "İşlem",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(shipments as Shipment[]).map((s) => {
                const displayStatus = getDisplayStatus(s);
                const isFlashing = flashIds.has(s.id);
                const hasLiveUpdate = !!liveUpdates[s.id];

                return (
                  <tr
                    key={s.id}
                    className={`transition-all duration-500 ${
                      isFlashing ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600">
                          {s.trackingNumber}
                        </span>
                        {hasLiveUpdate && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                            title="Canlı güncelleme alındı"
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium transition-all ${
                          SHIPMENT_STATUS_COLORS[
                            displayStatus as keyof typeof SHIPMENT_STATUS_COLORS
                          ] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {SHIPMENT_STATUS_LABELS[
                          displayStatus as keyof typeof SHIPMENT_STATUS_LABELS
                        ] ?? displayStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-700">
                      {s.courierName ?? (
                        <span className="text-xs text-gray-400 italic">
                          Atanmadı
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400">
                      {liveUpdates[s.id]?.updatedAt
                        ? formatDateTime(liveUpdates[s.id].updatedAt)
                        : s.updatedAt
                          ? formatDateTime(s.updatedAt)
                          : "—"}
                    </td>
                    <td className="px-5 py-3">
                      {s.labelUrl ? (
                        <a
                          href={s.labelUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-600 hover:underline font-medium"
                        >
                          İndir
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setAssignTarget(s)}
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        {s.courierId ? "Yeniden Ata" : "Kurye Ata"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {assignTarget && (
        <CourierAssignPanel
          shipment={assignTarget}
          onClose={() => setAssignTarget(null)}
        />
      )}
    </div>
  );
}
