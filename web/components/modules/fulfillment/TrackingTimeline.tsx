"use client";

import {
  SHIPMENT_STATUS_LABELS,
  SHIPMENT_STATUS_ORDER,
  type ShipmentStatus,
} from "@/types/enums";
import { formatDateTime } from "@/lib/format";
import type { ShipmentStatusEvent } from "@/types/entities";

interface Props {
  currentStatus: ShipmentStatus;
  events: ShipmentStatusEvent[];
  trackingNumber: string;
  courierName?: string;
  courierPhone?: string;
  courierVehicle?: string;
  estimatedDeliveryStart?: string;
  estimatedDeliveryEnd?: string;
  isFailed?: boolean;
}

const STATUS_ICONS: Record<ShipmentStatus, string> = {
  PENDING: "🕐",
  LABEL_GENERATED: "🏷️",
  COURIER_ASSIGNED: "👤",
  PICKED_UP: "📦",
  IN_TRANSIT: "🚚",
  OUT_FOR_DELIVERY: "🏃",
  DELIVERED: "✅",
  FAILED: "❌",
};

export default function TrackingTimeline({
  currentStatus,
  events,
  trackingNumber,
  courierName,
  courierPhone,
  courierVehicle,
  estimatedDeliveryStart,
  estimatedDeliveryEnd,
  isFailed,
}: Props) {
  const currentIdx = SHIPMENT_STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className="space-y-6">
      {/* Tracking No + ETA */}
      <div className="bg-[#0D0D0D] rounded-2xl p-5 text-[#F5F2EB]">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[3px] text-[#7A7060] mb-1">
              Takip Numarası
            </p>
            <p className="font-mono text-lg font-bold tracking-widest text-[#F5F2EB]">
              {trackingNumber}
            </p>
          </div>
          {(estimatedDeliveryStart || estimatedDeliveryEnd) && !isFailed && (
            <div className="text-right">
              <p className="font-mono text-[10px] uppercase tracking-[3px] text-[#7A7060] mb-1">
                Tahmini Teslim
              </p>
              <p className="text-sm font-semibold text-[#2D7A4F]">
                {estimatedDeliveryStart &&
                  new Date(estimatedDeliveryStart).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                  })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Courier Info */}
      {courierName && (
        <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-4">
          <div className="w-12 h-12 rounded-full bg-[#1A4A6B]/10 flex items-center justify-center text-xl">
            🚴
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[#0D0D0D]">{courierName}</p>
            <div className="flex items-center gap-3 mt-0.5">
              {courierPhone && (
                <a
                  href={`tel:${courierPhone}`}
                  className="text-xs text-[#1A4A6B] font-mono hover:underline"
                >
                  {courierPhone}
                </a>
              )}
              {courierVehicle && (
                <span className="text-xs text-[#7A7060]">
                  · {courierVehicle}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#7A7060]">
              Kurye
            </p>
            <p
              className={`text-xs font-medium mt-0.5 ${
                currentStatus === "DELIVERED"
                  ? "text-[#2D7A4F]"
                  : "text-[#C84B2F]"
              }`}
            >
              {STATUS_ICONS[currentStatus]}{" "}
              {SHIPMENT_STATUS_LABELS[currentStatus]}
            </p>
          </div>
        </div>
      )}

      {/* Timeline Steps */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <p className="font-mono text-[10px] uppercase tracking-[3px] text-[#7A7060] mb-5">
          Sipariş Durumu
        </p>

        <div className="space-y-0">
          {SHIPMENT_STATUS_ORDER.filter((s) => s !== "FAILED").map(
            (status, idx) => {
              const isDone = currentIdx >= idx && !isFailed;
              const isCurrent = currentStatus === status && !isFailed;
              // Find the event for this status
              const event = events.find((e) => e.status === status);
              const isLast =
                idx ===
                SHIPMENT_STATUS_ORDER.filter((s) => s !== "FAILED").length - 1;

              return (
                <div key={status} className="flex gap-4">
                  {/* Connector line + dot */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 border-2 transition-all ${
                        isCurrent
                          ? "border-[#C84B2F] bg-[#C84B2F] text-white shadow-lg shadow-[#C84B2F]/20 scale-110"
                          : isDone
                            ? "border-[#2D7A4F] bg-[#2D7A4F] text-white"
                            : "border-gray-200 bg-gray-50 text-gray-300"
                      }`}
                    >
                      {isDone && !isCurrent ? "✓" : STATUS_ICONS[status]}
                    </div>
                    {!isLast && (
                      <div
                        className={`w-0.5 h-10 mt-1 rounded-full transition-colors ${
                          isDone && currentIdx > idx
                            ? "bg-[#2D7A4F]"
                            : "bg-gray-100"
                        }`}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`pb-8 ${isLast ? "pb-0" : ""} flex-1 pt-1`}>
                    <p
                      className={`text-sm font-semibold ${
                        isCurrent
                          ? "text-[#C84B2F]"
                          : isDone
                            ? "text-[#0D0D0D]"
                            : "text-gray-300"
                      }`}
                    >
                      {SHIPMENT_STATUS_LABELS[status]}
                    </p>
                    {event ? (
                      <div className="mt-0.5">
                        <p className="text-xs text-[#7A7060]">
                          {formatDateTime(event.createdAt)}
                        </p>
                        {event.note && (
                          <p className="text-xs text-[#7A7060] mt-0.5">
                            {event.note}
                          </p>
                        )}
                        {event.location && (
                          <p className="text-xs text-[#1A4A6B] mt-0.5 font-mono">
                            📍 {event.location}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-300 mt-0.5">Bekleniyor</p>
                    )}
                  </div>
                </div>
              );
            },
          )}

          {/* Failed state */}
          {isFailed && (
            <div className="flex gap-4 mt-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 border-2 border-red-400 bg-red-50 text-red-500">
                ❌
              </div>
              <div className="pt-1">
                <p className="text-sm font-semibold text-red-500">
                  Teslimat Başarısız
                </p>
                <p className="text-xs text-[#7A7060] mt-0.5">
                  {events.find((e) => e.status === "FAILED")?.note ??
                    "Teslimat gerçekleştirilemedi."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
