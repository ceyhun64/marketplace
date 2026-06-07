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
  XCircle,
  AlertCircle,
  Search,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Phone,
} from "lucide-react";
import {
  SHIPMENT_STATUS_LABELS,
  SHIPMENT_STATUS_COLORS,
} from "@/types/enums";
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
  customerName?: string;
  trackingNumber: string;
  status: ShipmentStatus;
  estimatedDelivery?: string;
  labelUrl?: string;
}

interface TrackingEvent {
  id: string;
  status: string;
  note?: string;
  location?: string;
  createdAt: string;
}

interface OrderTracking {
  orderId: string;
  orderStatus: string;
  trackingNumber?: string;
  shipmentStatus?: string;
  estimatedDelivery?: string;
  labelUrl?: string;
  courierName?: string;
  courierPhone?: string;
  history: TrackingEvent[];
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

const STEP_LABELS = [
  "Prepared",
  "Label",
  "Courier",
  "Picked Up",
  "In Transit",
  "Out for Delivery",
  "Delivered",
];

function StatusStepper({
  current,
  history,
}: {
  current: ShipmentStatus | string;
  history?: TrackingEvent[];
}) {
  if (current === "FAILED") {
    // We don't know which step the shipment failed at from the status alone —
    // derive the last successfully-reached step from the history instead of
    // guessing, so we never claim progress that didn't happen.
    const lastReachedIdx = (history ?? [])
      .map((e) => STATUS_STEPS.indexOf(e.status as ShipmentStatus))
      .filter((idx) => idx >= 0)
      .reduce((max, idx) => Math.max(max, idx), -1);
    const lastReachedLabel =
      lastReachedIdx >= 0 ? STEP_LABELS[lastReachedIdx] : null;

    return (
      <div className="flex items-center gap-2 rounded-lg border border-(--red)/30 bg-(--red)/5 px-3 py-2.5">
        <XCircle className="w-4 h-4 text-(--red) shrink-0" />
        <span className="text-xs font-medium text-(--red)">
          Shipment failed
          {lastReachedLabel && ` — last reached step: "${lastReachedLabel}"`}
        </span>
      </div>
    );
  }

  const currentIdx = STATUS_STEPS.indexOf(current as ShipmentStatus);

  return (
    <div className="flex items-center gap-0 w-full">
      {STATUS_STEPS.map((step, i) => {
        const done = i <= currentIdx;
        const active = i === currentIdx;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                done
                  ? active
                    ? "bg-(--info) ring-2 ring-(--info-bg)"
                    : "bg-(--success)"
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
                  i < currentIdx ? "bg-(--success)" : "bg-(--off-white-3)"
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

  const { data: tracking, isLoading: trackingLoading } = useQuery({
    queryKey: ["merchant-shipment-tracking", shipment.orderId],
    queryFn: async () => {
      const { data } = await api.get<OrderTracking>(
        `/api/orders/${shipment.orderId}/tracking`,
      );
      return data;
    },
    enabled: expanded,
    staleTime: 60_000,
  });

  const eta = tracking?.estimatedDelivery ?? shipment.estimatedDelivery;
  const etaShort = eta
    ? new Date(eta).toLocaleDateString("en-US", { day: "2-digit", month: "short" })
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
            {shipment.trackingNumber ? (
              <span className="font-mono text-xs font-bold text-(--info)">
                {shipment.trackingNumber}
              </span>
            ) : (
              <span className="text-xs text-(--text-tertiary)">
                Not yet assigned
              </span>
            )}
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
        <td className="px-5 py-4 text-xs text-(--text-secondary)">
          {etaShort ? `Est. ${etaShort}` : <span className="text-(--text-tertiary)">—</span>}
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
                Label
              </a>
            )}
          </div>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-(--bg-sunken)/60">
          <td colSpan={5} className="px-5 py-4">
            {trackingLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : (
              <>
                {/* Status stepper */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wider mb-3">
                    Shipment Status
                  </p>
                  <StatusStepper
                    current={tracking?.shipmentStatus ?? shipment.status}
                    history={tracking?.history}
                  />
                  {(tracking?.shipmentStatus ?? shipment.status) !== "FAILED" && (
                    <div className="flex justify-between mt-1.5">
                      {STEP_LABELS.map((label) => (
                        <span
                          key={label}
                          className="text-[10px] text-(--text-tertiary) text-center flex-1"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Courier info */}
                {(tracking?.courierName || tracking?.courierPhone) && (
                  <div className="mb-3 flex items-center gap-4 text-xs text-(--text-secondary) bg-(--bg-surface) rounded-lg px-4 py-2.5 border border-(--border-light)">
                    <Truck className="w-4 h-4 text-(--text-tertiary)" />
                    <span className="font-medium text-(--text-secondary)">
                      {tracking?.courierName ?? "Courier assigned"}
                    </span>
                    {tracking?.courierPhone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {tracking.courierPhone}
                      </span>
                    )}
                  </div>
                )}

                {/* Events timeline */}
                {tracking?.history && tracking.history.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wider mb-2">
                      Shipment History
                    </p>
                    <div className="space-y-2">
                      {tracking.history.map((event, i) => (
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
                ) : (
                  <p className="text-xs text-(--text-tertiary)">
                    No status history yet.
                  </p>
                )}
              </>
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

      // Extract shipments from orders — only the summary fields the
      // backend's ShipmentSummaryDto actually returns at this level.
      // Full courier/timeline details are loaded per-row from the
      // /api/orders/{id}/tracking endpoint when a row is expanded.
      return orders
        .filter((o: any) => o.shipment)
        .map((o: any) => ({
          id: o.shipment.id,
          orderId: o.id,
          customerName: o.customerName,
          trackingNumber: o.shipment.trackingNumber ?? "",
          status: o.shipment.status as ShipmentStatus,
          estimatedDelivery: o.shipment.estimatedDelivery,
          labelUrl: o.shipment.labelUrl,
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
    { value: "FAILED", label: "Failed" },
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
                {["Tracking No.", "Customer", "Status", "Est. Delivery", ""].map(
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
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <Skeleton className="h-4 w-full rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
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
            Once your order is marked as &quot;Packed&quot;, an admin generates the shipping label and assigns a courier. Your tracking number will appear here automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
