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
import { Truck, CheckCircle2, Package } from "lucide-react";

export default function CourierShipmentList() {
  const { data: shipments = [], isLoading } = useMyCourierShipments();
  const pickupMutation = useConfirmPickup();
  const deliveryMutation = useConfirmDelivery();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!shipments.length) {
    return (
      <div className="bg-(--bg-surface) border border-(--border-light) rounded-2xl p-12 text-center">
        <div className="text-4xl mb-3">🚴</div>
        <p className="text-sm font-medium text-(--text-primary)">Atanmış paket yok</p>
        <p className="text-xs text-(--text-tertiary) mt-1">Yeni atamalar burada görünecek.</p>
      </div>
    );
  }

  const active = shipments.filter((s) => s.status !== "DELIVERED" && s.status !== "FAILED");
  const completed = shipments.filter((s) => s.status === "DELIVERED" || s.status === "FAILED");

  return (
    <div className="space-y-6">
      {active.length > 0 && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[3px] text-(--text-tertiary) mb-3">
            Aktif Paketler ({active.length})
          </p>
          <div className="space-y-3">
            {active.map((shipment) => (
              <div
                key={shipment.id}
                className="bg-(--bg-surface) border border-(--border-light) rounded-2xl p-4 hover:border-(--border-mid) hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-(--text-primary)">
                        {shipment.trackingNumber}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SHIPMENT_STATUS_COLORS[shipment.status]}`}>
                        {SHIPMENT_STATUS_LABELS[shipment.status]}
                      </span>
                    </div>
                    {shipment.estimatedDeliveryStart && shipment.estimatedDeliveryEnd && (
                      <p className="text-xs text-(--text-tertiary) mt-1 font-mono">
                        📅 {formatEtaWindow(shipment.estimatedDeliveryStart, shipment.estimatedDeliveryEnd)}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/courier/shipments/${shipment.id}`}
                    className="text-xs text-(--text-secondary) hover:text-(--text-primary) font-semibold transition-colors"
                  >
                    Detay →
                  </Link>
                </div>

                {shipment.labelUrl && (
                  <a
                    href={shipment.labelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-(--text-secondary) hover:text-(--text-primary) border border-(--border-light) hover:border-(--border-mid) rounded-xl px-3 py-2 mb-3 transition-colors"
                  >
                    🏷️ Etiketi Görüntüle / Yazdır
                  </a>
                )}

                <div className="flex gap-2">
                  {shipment.status === "COURIER_ASSIGNED" && (
                    <button
                      onClick={() => pickupMutation.mutate(shipment.id)}
                      disabled={pickupMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 h-11 bg-(--charcoal) hover:bg-(--charcoal-2) text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors"
                    >
                      <Package className="w-3.5 h-3.5" />
                      {pickupMutation.isPending ? "..." : "📦 Paketi Aldım"}
                    </button>
                  )}
                  {(shipment.status === "PICKED_UP" ||
                    shipment.status === "IN_TRANSIT" ||
                    shipment.status === "OUT_FOR_DELIVERY") && (
                    <button
                      onClick={() => deliveryMutation.mutate(shipment.id)}
                      disabled={deliveryMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 h-11 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors"
                      style={{ backgroundColor: "var(--success)" }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {deliveryMutation.isPending ? "..." : "✅ Teslim Ettim"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[3px] text-(--text-tertiary) mb-3">
            Tamamlandı ({completed.length})
          </p>
          <div className="space-y-2">
            {completed.map((shipment) => (
              <div
                key={shipment.id}
                className="bg-(--bg-sunken) border border-(--border-subtle) rounded-2xl p-4 flex items-center justify-between"
              >
                <div>
                  <span className="font-mono text-xs font-bold text-(--text-secondary)">
                    {shipment.trackingNumber}
                  </span>
                  {shipment.actualDeliveredAt && (
                    <p className="text-xs text-(--text-tertiary) mt-0.5">
                      {formatDateTime(shipment.actualDeliveredAt)}
                    </p>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SHIPMENT_STATUS_COLORS[shipment.status]}`}>
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
