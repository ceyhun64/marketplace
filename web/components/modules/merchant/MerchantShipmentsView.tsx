"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatDate } from "@/lib/format";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                done
                  ? active
                    ? "bg-(--info) ring-2 ring-(--info-bg)"
                    : "bg-(--success)"
                  : isFailed && i === currentIdx
                  ? "bg-(--red)"
                  : "bg-(--off-white-3)"
              }`}
            >
              {done && !active ? (
                <CheckCircle2 className="w-3 h-3 text-white" />
              ) : active ? (
                <div className="w-2 h-2 bg-(--bg-surface) rounded-full" />
              ) : null}
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 transition-colors ${
                  !isFailed && i < currentIdx ? "bg-(--success)" : "bg-(--off-white-3)"
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
    SHIPMENT_STATUS_COLORS[shipment.status] ?? "bg-(--off-white-2) text-(--text-secondary)";

  const eta = shipment.estimatedDeliveryEnd
    ? new Date(shipment.estimatedDeliveryEnd).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
      })
    : null;

  return (
    <>
      <tr
        className="hover:bg-(--bg-sunken) transition-colors cursor-pointer border-b border-(--border-subtle)"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-5 py-4">
          <div className="flex items-center gap-1.5">
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-(--text-tertiary)" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-(--text-tertiary)" />
            )}
            <span className="font-mono text-xs font-bold text-(--info)">
              {shipment.trackingNumber}
            </span>
          </div>
        </td>
        <td className="px-5 py-4 text-sm text-(--text-secondary)">
          {shipment.customerName ?? "—"}
        </td>
        <td className="px-5 py-4">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}
          >
            {statusLabel}
          </span>
        </td>
        <td className="px-5 py-4 text-sm text-(--text-secondary)">
          {shipment.courierName ?? <span className="text-(--text-tertiary)">—</span>}
        </td>
        <td className="px-5 py-4 text-xs text-(--text-secondary)">
          {shipment.actualDeliveredAt ? (
            <span className="text-(--success) font-medium">
              Teslim: {formatDate(shipment.actualDeliveredAt)}
            </span>
          ) : eta ? (
            `Est. ${eta}`
          ) : (
            <span className="text-(--text-tertiary)">—</span>
          )}
        </td>
        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            {shipment.labelUrl && (
              <a
                href={shipment.labelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-(--info) hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Etiket
              </a>
            )}
          </div>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-(--bg-sunken)/60">
          <td colSpan={6} className="px-5 py-4">
            {/* Status stepper */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wider mb-3">
                Kargo Durumu
              </p>
              <StatusStepper current={shipment.status} />
              <div className="flex justify-between mt-1.5">
                {["Prepared", "Label", "Courier", "Picked Up", "In Transit", "Out for Delivery", "Delivered"].map(
                  (label) => (
                    <span key={label} className="text-[10px] text-(--text-tertiary) text-center flex-1">
                      {label}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Events timeline */}
            {shipment.events && shipment.events.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wider mb-2">
                  Shipment History
                </p>
                <div className="space-y-2">
                  {shipment.events
                    .slice()
                    .reverse()
                    .map((event, i) => (
                      <div
                        key={event.id ?? i}
                        className="flex items-start gap-3 bg-(--bg-surface) rounded-lg px-4 py-2.5 border border-(--border-light)"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-(--info) mt-1.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-(--text-primary)">
                            {SHIPMENT_STATUS_LABELS[event.status as ShipmentStatus] ??
                              event.status}
                          </p>
                          {event.note && (
                            <p className="text-xs text-(--text-secondary) mt-0.5">{event.note}</p>
                          )}
                          {event.location && (
                            <p className="text-xs text-(--text-tertiary) flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-(--text-tertiary) shrink-0">
                          {new Date(event.createdAt).toLocaleString("en-US", {
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
              <div className="mt-3 flex items-center gap-4 text-xs text-(--text-secondary) bg-(--bg-surface) rounded-lg px-4 py-2.5 border border-(--border-light)">
                <Truck className="w-4 h-4 text-(--text-tertiary)" />
                <span className="font-medium text-(--text-secondary)">
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
      // Fetch merchant orders with shipment info
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await api.get(`/api/orders/merchant/incoming?${params}`);
      const raw = res.data;
      const orders = Array.isArray(raw)
        ? raw
        : raw?.items ?? raw?.data ?? raw?.orders ?? [];

      // Extract shipments from orders
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
    { value: "all", label: "All" },
    { value: "PENDING", label: "Pending" },
    { value: "LABEL_GENERATED", label: "Label Generated" },
    { value: "COURIER_ASSIGNED", label: "Courier Assigned" },
    { value: "PICKED_UP", label: "Picked Up" },
    { value: "IN_TRANSIT", label: "In Transit" },
    { value: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
    { value: "DELIVERED", label: "Delivered" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-(--text-primary)">Shipment Tracking</h1>
        <p className="text-sm text-(--text-secondary) mt-1">
          Track the shipping status of your orders in real time
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Shipments",
            value: stats.total,
            icon: Package,
            color: "text-(--text-secondary)",
            bg: "bg-(--off-white-2)",
          },
          {
            label: "Pending",
            value: stats.pending,
            icon: Clock,
            color: "text-(--warning)",
            bg: "bg-(--warning-bg)",
          },
          {
            label: "In Transit",
            value: stats.inTransit,
            icon: Truck,
            color: "text-(--info)",
            bg: "bg-(--info-bg)",
          },
          {
            label: "Delivered",
            value: stats.delivered,
            icon: CheckCircle2,
            color: "text-(--success)",
            bg: "bg-(--success-bg)",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-(--text-tertiary) font-medium uppercase tracking-wider">
                {s.label}
              </p>
              <div className={`p-1.5 rounded-lg ${s.bg}`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-(--text-primary)">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-(--bg-surface) rounded-xl border border-(--border-light)">
        <div className="px-5 py-4 border-b border-(--border-light) flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
          <p className="text-sm font-semibold text-(--text-primary)">
            Shipment List
            <span className="ml-2 font-normal text-(--text-tertiary)">
              ({filtered.length} shipment{filtered.length !== 1 ? "s" : ""})
            </span>
          </p>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-(--text-tertiary)" />
              <input
                type="text"
                placeholder="Tracking no or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-(--border-mid) rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors w-52"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | ShipmentStatus)}>
              <SelectTrigger className="h-7 w-auto text-xs rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTER_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-(--bg-sunken) border-b border-(--border-light)">
              <tr>
                {["Tracking No.", "Customer", "Status", "Courier", "Est. Delivery", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold text-(--text-secondary) uppercase tracking-wide"
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
                    <Truck className="w-10 h-10 mx-auto mb-3 text-(--border-mid)" />
                    <p className="text-sm font-medium text-(--text-secondary)">
                      No shipments found
                    </p>
                    <p className="text-xs text-(--text-tertiary) mt-1">
                      Shipping details will appear here once orders are packed
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
      <div className="rounded-xl border border-(--info-border) bg-(--info-bg) px-5 py-4 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-(--info) mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-(--info)">
            About the Shipping Process
          </p>
          <p className="text-xs text-(--info) mt-0.5">
            Once your order is marked as "Packed", an admin generates the shipping label and assigns a courier. Your tracking number will appear here automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
