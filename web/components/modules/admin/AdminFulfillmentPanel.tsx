"use client";

import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useShipments, shipmentKeys } from "@/queries/useCouriers";
import CourierAssignPanel from "@/components/modules/fulfillment/CourierAssignPanel";
import { SHIPMENT_STATUS_LABELS, SHIPMENT_STATUS_COLORS } from "@/types/enums";
import { formatDateTime } from "@/lib/format";
import type { Shipment } from "@/types/entities";
import {
  useSignalRTracking,
  type TrackingUpdate,
} from "@/hooks/use-signalr-tracking";
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
      (update: TrackingUpdate) => {
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
                  ? "bg-(--charcoal) text-white border-(--charcoal)"
                  : "bg-(--bg-surface) text-(--text-tertiary) border-(--border-mid) hover:border-(--border-mid)"
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
              ? "bg-(--success-bg) text-(--success) border-(--success-border)"
              : signalrStatus === "connecting"
                ? "bg-(--warning-bg) text-(--warning) border-(--warning-border)"
                : "bg-(--bg-sunken) text-(--text-tertiary) border-(--border-mid)"
          }`}
        >
          {isConnected ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--success)" }}" />
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
        <div className="text-xs text-(--text-tertiary) flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-(--info)" />
          Son güncelleme: Takip #
          {lastUpdate.shipmentId.slice(0, 8).toUpperCase()} →{" "}
          <span className="font-medium text-(--info)">{lastUpdate.status}</span>
          <span className="ml-1">
            {new Date(lastUpdate.updatedAt).toLocaleTimeString("tr-TR")}
          </span>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="bg-(--bg-surface) border border-(--border-light) rounded-xl overflow-hidden">
          <table className="w-full">
            <tbody className="divide-y divide-(--border-subtle)">
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
        <div className="bg-(--bg-surface) border border-(--border-light) rounded-xl p-12 text-center text-(--text-tertiary)">
          <p className="text-sm font-medium">Kargo bulunamadı</p>
        </div>
      ) : (
        <div className="bg-(--bg-surface) border border-(--border-light) rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-(--border-light) bg-(--bg-sunken)">
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
                    className="px-5 py-3 text-left text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-(--border-subtle)">
              {(shipments as Shipment[]).map((s) => {
                const displayStatus = getDisplayStatus(s);
                const isFlashing = flashIds.has(s.id);
                const hasLiveUpdate = !!liveUpdates[s.id];

                return (
                  <tr
                    key={s.id}
                    className={`transition-all duration-500 ${
                      isFlashing ? "bg-(--info-bg)" : "hover:bg-(--bg-sunken)"
                    }`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-(--info)">
                          {s.trackingNumber}
                        </span>
                        {hasLiveUpdate && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-(--success)"
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
                          ] ?? "bg-(--off-white-2) text-(--text-secondary)"
                        }`}
                      >
                        {SHIPMENT_STATUS_LABELS[
                          displayStatus as keyof typeof SHIPMENT_STATUS_LABELS
                        ] ?? displayStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-(--text-secondary)">
                      {s.courierName ?? (
                        <span className="text-xs text-(--text-tertiary) italic">
                          Atanmadı
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-(--text-tertiary)">
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
                          className="text-xs text-(--success) hover:underline font-medium"
                        >
                          İndir
                        </a>
                      ) : (
                        <span className="text-xs text-(--text-tertiary)">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setAssignTarget(s)}
                        className="text-xs text-(--info) hover:underline font-medium"
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
