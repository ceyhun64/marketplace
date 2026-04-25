"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMyCourierShipments,
  useConfirmPickup,
  useConfirmDelivery,
} from "@/queries/useCouriers";
import { SHIPMENT_STATUS_LABELS, SHIPMENT_STATUS_COLORS } from "@/types/enums";
import { formatDateTime, formatEtaWindow } from "@/lib/format";

export default function CourierShipmentList() {
  const { data: shipments = [], isLoading } = useMyCourierShipments();
  const pickupMutation = useConfirmPickup();
  const deliveryMutation = useConfirmDelivery();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!shipments.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <div className="text-4xl mb-3">🚴</div>
        <p className="text-sm font-medium text-gray-700">No assigned packages</p>
        <p className="text-xs text-[#7A7060] mt-1">
          New assignments will appear here.
        </p>
      </div>
    );
  }

  const active = shipments.filter(
    (s) => s.status !== "DELIVERED" && s.status !== "FAILED",
  );
  const completed = shipments.filter(
    (s) => s.status === "DELIVERED" || s.status === "FAILED",
  );

  return (
    <div className="space-y-6">
      {/* Aktif paketler */}
      {active.length > 0 && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[3px] text-[#7A7060] mb-3">
            Active Packages ({active.length})
          </p>
          <div className="space-y-3">
            {active.map((shipment) => (
              <div
                key={shipment.id}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#1A4A6B]">
                        {shipment.trackingNumber}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${SHIPMENT_STATUS_COLORS[shipment.status]}`}
                      >
                        {SHIPMENT_STATUS_LABELS[shipment.status]}
                      </span>
                    </div>
                    {shipment.estimatedDeliveryStart &&
                      shipment.estimatedDeliveryEnd && (
                        <p className="text-xs text-[#7A7060] mt-1 font-mono">
                          📅{" "}
                          {formatEtaWindow(
                            shipment.estimatedDeliveryStart,
                            shipment.estimatedDeliveryEnd,
                          )}
                        </p>
                      )}
                  </div>
                  <Link
                    href={`/courier/shipments/${shipment.id}`}
                    className="text-xs text-[#1A4A6B] hover:underline font-medium"
                  >
                    Details →
                  </Link>
                </div>

                {/* Download Label */}
                {shipment.labelUrl && (
                  <a
                    href={shipment.labelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#7A7060] hover:text-[#0D0D0D] border border-gray-200 rounded-lg px-3 py-1.5 mb-3 transition-colors"
                  >
                    🏷️ View / Print Label
                  </a>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {shipment.status === "COURIER_ASSIGNED" && (
                    <button
                      onClick={() => pickupMutation.mutate(shipment.id)}
                      disabled={pickupMutation.isPending}
                      className="flex-1 bg-[#1A4A6B] text-white rounded-lg py-2 text-xs font-medium hover:bg-[#1A4A6B]/80 disabled:opacity-50 transition-colors"
                    >
                      {pickupMutation.isPending ? "..." : "📦 Picked Up"}
                    </button>
                  )}
                  {(shipment.status === "PICKED_UP" ||
                    shipment.status === "IN_TRANSIT" ||
                    shipment.status === "OUT_FOR_DELIVERY") && (
                    <button
                      onClick={() => deliveryMutation.mutate(shipment.id)}
                      disabled={deliveryMutation.isPending}
                      className="flex-1 bg-[#2D7A4F] text-white rounded-lg py-2 text-xs font-medium hover:bg-[#2D7A4F]/80 disabled:opacity-50 transition-colors"
                    >
                      {deliveryMutation.isPending ? "..." : "✅ Delivered"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed paketler */}
      {completed.length > 0 && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[3px] text-[#7A7060] mb-3">
            Completed ({completed.length})
          </p>
          <div className="space-y-2">
            {completed.map((shipment) => (
              <div
                key={shipment.id}
                className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <span className="font-mono text-xs font-bold text-[#7A7060]">
                    {shipment.trackingNumber}
                  </span>
                  {shipment.actualDeliveredAt && (
                    <p className="text-xs text-[#7A7060] mt-0.5">
                      {formatDateTime(shipment.actualDeliveredAt)}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${SHIPMENT_STATUS_COLORS[shipment.status]}`}
                >
                  {SHIPMENT_STATUS_LABELS[shipment.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
