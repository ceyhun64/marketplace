"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import {
  SHIPMENT_STATUS_LABELS,
  SHIPMENT_STATUS_COLORS,
} from "@/types/enums";
import type { Shipment, ShipmentStatusEvent } from "@/types/entities";
import type { ShipmentStatus } from "@/types/enums";

interface MerchantShipment {
  id: string;
  orderId: string;
  orderNumber?: string;
  customerName?: string;
  trackingNumber: string;
  status: ShipmentStatus;
  courierName?: string;
  courierPhone?: string;
  estimatedDeliveryStart?: string;
  estimatedDeliveryEnd?: string;
  actualDeliveredAt?: string;
  labelUrl?: string;
  events: ShipmentStatusEvent[];
  updatedAt?: string;
}

const STATUS_STEPS: ShipmentStatus[] = [
  "PENDING",
  "LABEL_GENERATED",
  "COURIER_ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

function StatusStepper({ current }: { current: ShipmentStatus }) {
  const currentIdx = STATUS_STEPS.indexOf(current);
  const isFailed = current === "FAILED";

  return (
    <div className="flex items-center gap-0 w-full">
      {STATUS_STEPS.map((step, i) => {
        const done = !isFailed && i <= currentIdx;
        const active = !isFailed && i === currentIdx;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                done
                  ? active
                    ? "bg-[var(--info)] ring-2 ring-[var(--info-bg)]"
                    : "bg-[var(--success)]"
                  : isFailed && i === currentIdx
                  ? "bg-[var(--red)]"
                  : "bg-[var(--off-white-3)]"
              }`}
            >
              {done && !active ? (
                <CheckCircle2 className="w-3 h-3 text-white" />
              ) : active ? (
                <div className="w-2 h-2 bg-[var(--bg-surface)] rounded-full" />
              ) : null}
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 transition-colors ${
                  !isFailed && i < currentIdx ? "bg-[var(--success)]" : "bg-[var(--off-white-3)]"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ShipmentRow({ shipment }: { shipment: MerchantShipment }) {
  const [expanded, setExpanded] = useState(false);

  const statusLabel = SHIPMENT_STATUS_LABELS[shipment.status] ?? shipment.status;
  const statusColor =
    SHIPMENT_STATUS_COLORS[shipment.status] ?? "bg-[var(--off-white-2)] text-[var(--text-secondary)]";

  const eta = shipment.estimatedDeliveryEnd
    ? new Date(shipment.estimatedDeliveryEnd).toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "short",
      })
    : null;

  return (
    <>
      <tr
        className="hover:bg-[var(--bg-sunken)] transition-colors cursor-pointer border-b border-[var(--border-subtle)]"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-5 py-4">
          <div className="flex items-center gap-1.5">
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            )}
            <span className="font-mono text-xs font-bold text-[var(--info)]">
              {shipment.trackingNumber}
            </span>
          </div>
        </td>
        <td className="px-5 py-4 text-sm text-[var(--text-secondary)]">
          {shipment.customerName ?? "—"}
        </td>
        <td className="px-5 py-4">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}
          >
            {statusLabel}
          </span>
        </td>
        <td className="px-5 py-4 text-sm text-[var(--text-secondary)]">
          {shipment.courierName ?? <span className="text-[var(--text-tertiary)]">—</span>}
        </td>
        <td className="px-5 py-4 text-xs text-[var(--text-secondary)]">
          {shipment.actualDeliveredAt ? (
            <span className="text-[var(--success)] font-medium">
              Teslim: {new Date(shipment.actualDeliveredAt).toLocaleDateString("tr-TR")}
            </span>
          ) : eta ? (
            `Tahmini: ${eta}`
          ) : (
            <span className="text-[var(--text-tertiary)]">—</span>
          )}
        </td>
        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            {shipment.labelUrl && (
              <a
                href={shipment.labelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--info)] hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Etiket
              </a>
            )}
          </div>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-[var(--bg-sunken)]/60">
          <td colSpan={6} className="px-5 py-4">
            {/* Status stepper */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
                Kargo Durumu
              </p>
              <StatusStepper current={shipment.status} />
              <div className="flex justify-between mt-1.5">
                {["Hazırlandı", "Etiket", "Kurye", "Alındı", "Yolda", "Dağıtımda", "Teslim"].map(
                  (label) => (
                    <span key={label} className="text-[10px] text-[var(--text-tertiary)] text-center flex-1">
                      {label}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Events timeline */}
            {shipment.events && shipment.events.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
                  Kargo Geçmişi
                </p>
                <div className="space-y-2">
                  {shipment.events
                    .slice()
                    .reverse()
                    .map((event, i) => (
                      <div
                        key={event.id ?? i}
                        className="flex items-start gap-3 bg-[var(--bg-surface)] rounded-lg px-4 py-2.5 border border-[var(--border-light)]"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--info)] mt-1.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {SHIPMENT_STATUS_LABELS[event.status as ShipmentStatus] ??
                              event.status}
                          </p>
                          {event.note && (
                            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{event.note}</p>
                          )}
                          {event.location && (
                            <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-[var(--text-tertiary)] shrink-0">
                          {new Date(event.createdAt).toLocaleString("tr-TR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Courier info */}
            {(shipment.courierName || shipment.courierPhone) && (
              <div className="mt-3 flex items-center gap-4 text-xs text-[var(--text-secondary)] bg-[var(--bg-surface)] rounded-lg px-4 py-2.5 border border-[var(--border-light)]">
                <Truck className="w-4 h-4 text-[var(--text-tertiary)]" />
                <span className="font-medium text-[var(--text-secondary)]">
                  {shipment.courierName}
                </span>
                {shipment.courierPhone && (
                  <span>{shipment.courierPhone}</span>
                )}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export default function MerchantShipmentsView() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ShipmentStatus>("all");

  const { data, isLoading } = useQuery<MerchantShipment[]>({
    queryKey: ["merchant-shipments", statusFilter],
    queryFn: async () => {
      // Merchant'ın siparişlerini çek, shipment bilgisiyle
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await api.get(`/api/orders/merchant/incoming?${params}`);
      const raw = res.data;
      const orders = Array.isArray(raw)
        ? raw
        : raw?.items ?? raw?.data ?? raw?.orders ?? [];

      // Sipariş içinden shipment'ları çıkar
      return orders
        .filter((o: any) => o.shipment)
        .map((o: any) => ({
          id: o.shipment.id,
          orderId: o.id,
          customerName: o.customerName,
          trackingNumber: o.shipment.trackingNumber ?? `TRK-${o.id.slice(0, 8).toUpperCase()}`,
          status: o.shipment.status as ShipmentStatus,
          courierName: o.shipment.courierName,
          courierPhone: o.shipment.courierPhone,
          estimatedDeliveryStart: o.shipment.estimatedDeliveryStart,
          estimatedDeliveryEnd: o.shipment.estimatedDeliveryEnd,
          actualDeliveredAt: o.shipment.actualDeliveredAt,
          labelUrl: o.shipment.labelUrl,
          events: o.shipment.events ?? [],
          updatedAt: o.shipment.updatedAt,
        })) as MerchantShipment[];
    },
  });

  const shipments = data ?? [];

  const filtered = shipments.filter((s) => {
    if (!search) return true;
    return (
      s.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.customerName?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const stats = {
    total: shipments.length,
    inTransit: shipments.filter((s) =>
      ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(s.status)
    ).length,
    delivered: shipments.filter((s) => s.status === "DELIVERED").length,
    pending: shipments.filter((s) =>
      ["PENDING", "LABEL_GENERATED", "COURIER_ASSIGNED"].includes(s.status)
    ).length,
  };

  const STATUS_FILTER_OPTIONS: { value: "all" | ShipmentStatus; label: string }[] = [
    { value: "all", label: "Tümü" },
    { value: "PENDING", label: "Beklemede" },
    { value: "LABEL_GENERATED", label: "Etiket Oluşturuldu" },
    { value: "COURIER_ASSIGNED", label: "Kurye Atandı" },
    { value: "PICKED_UP", label: "Alındı" },
    { value: "IN_TRANSIT", label: "Yolda" },
    { value: "OUT_FOR_DELIVERY", label: "Dağıtımda" },
    { value: "DELIVERED", label: "Teslim Edildi" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Kargo Takip</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Siparişlerinizin kargo durumunu anlık takip edin
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Toplam Kargo",
            value: stats.total,
            icon: Package,
            color: "text-[var(--text-secondary)]",
            bg: "bg-[var(--off-white-2)]",
          },
          {
            label: "Bekleyen",
            value: stats.pending,
            icon: Clock,
            color: "text-[var(--warning)]",
            bg: "bg-[var(--warning-bg)]",
          },
          {
            label: "Yolda",
            value: stats.inTransit,
            icon: Truck,
            color: "text-[var(--info)]",
            bg: "bg-[var(--info-bg)]",
          },
          {
            label: "Teslim Edildi",
            value: stats.delivered,
            icon: CheckCircle2,
            color: "text-[var(--success)]",
            bg: "bg-[var(--success-bg)]",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-light)] p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-[var(--text-tertiary)] font-medium uppercase tracking-wider">
                {s.label}
              </p>
              <div className={`p-1.5 rounded-lg ${s.bg}`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-light)]">
        <div className="px-5 py-4 border-b border-[var(--border-light)] flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Kargo Listesi
            <span className="ml-2 font-normal text-[var(--text-tertiary)]">
              ({filtered.length} kargo)
            </span>
          </p>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Takip no veya müşteri..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-[var(--border-mid)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors w-52"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs border border-[var(--border-mid)] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-[var(--bg-surface)] cursor-pointer"
            >
              {STATUS_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-sunken)] border-b border-[var(--border-light)]">
              <tr>
                {["Takip No", "Müşteri", "Durum", "Kurye", "Tahmini Teslimat", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <Skeleton className="h-4 w-full rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Truck className="w-10 h-10 mx-auto mb-3 text-[var(--border-mid)]" />
                    <p className="text-sm font-medium text-[var(--text-secondary)]">
                      Kargo kaydı bulunamadı
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">
                      Siparişler paketlendiğinde kargo bilgileri burada görünür
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((shipment) => (
                  <ShipmentRow key={shipment.id} shipment={shipment} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info banner */}
      <div className="rounded-xl border border-blue-100 bg-[var(--info-bg)] px-5 py-4 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-[var(--info)] mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-[var(--info)]">
            Kargo Süreci Hakkında
          </p>
          <p className="text-xs text-[var(--info)] mt-0.5">
            Siparişiniz "Paketlendi" olarak işaretlendiğinde admin tarafından
            kargo etiketi oluşturulur ve kurye atanır. Takip numaranız
            otomatik olarak burada görünür.
          </p>
        </div>
      </div>
    </div>
  );
}
