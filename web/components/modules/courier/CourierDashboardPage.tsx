"use client";

import Link from "next/link";
import { Package, CheckCircle, Clock, Truck } from "lucide-react";
import {
  useMyCourierShipments,
  useConfirmPickup,
  useConfirmDelivery,
} from "@/queries/useCouriers";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_LABEL: Record<string, string> = {
  COURIER_ASSIGNED: "Assigned — Pick Up",
  PICKED_UP: "Picked Up",
  IN_TRANSIT: "In Transit",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
};

const STATUS_COLOR: Record<string, string> = {
  COURIER_ASSIGNED: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  PICKED_UP: "bg-blue-50 text-blue-700 border border-blue-200",
  IN_TRANSIT: "bg-blue-50 text-blue-700 border border-blue-200",
  OUT_FOR_DELIVERY: "bg-violet-50 text-violet-700 border border-violet-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

export default function CourierDashboardPage() {
  const { data: shipments = [], isLoading } = useMyCourierShipments();
  const confirmPickup = useConfirmPickup();
  const confirmDelivery = useConfirmDelivery();

  const active = shipments.filter((s: any) => s.status !== "DELIVERED");
  const done = shipments.filter((s: any) => s.status === "DELIVERED");
  const inTransit = shipments.filter((s: any) =>
    ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(s.status),
  );
  const pending = shipments.filter((s: any) => s.status === "COURIER_ASSIGNED");

  const stats = [
    {
      label: "Active",
      value: active.length,
      icon: Truck,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Pending Pickup",
      value: pending.length,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "In Transit",
      value: inTransit.length,
      icon: Package,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Delivered",
      value: done.length,
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My Shipments</h1>
        <p className="text-sm text-gray-500 mt-1">
          {active.length} active · {done.length} delivered today
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-gray-100 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                {s.label}
              </p>
              <div className={`p-1.5 rounded-lg ${s.bg}`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Shipment List */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">
            All Shipments
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({shipments.length} total)
            </span>
          </p>
          <Link
            href="/courier/shipments"
            className="text-xs text-gray-500 hover:text-gray-900 font-medium"
          >
            View All →
          </Link>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : shipments.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-medium">
              No assigned shipments
            </p>
            <p className="text-xs text-gray-300 mt-1">
              New assignments will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {shipments.slice(0, 8).map((s: any) => (
              <div key={s.id} className="px-5 py-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-bold text-gray-900">
                        {s.trackingNumber}
                      </span>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          STATUS_COLOR[s.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {STATUS_LABEL[s.status] ?? s.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 font-medium">
                      {s.customerName}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate max-w-sm">
                      {s.deliveryAddress}
                    </p>
                    {s.estimatedDelivery && (
                      <p className="text-xs text-gray-300 mt-0.5">
                        ETA:{" "}
                        {new Date(s.estimatedDelivery).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 items-end ml-4 flex-shrink-0">
                    {s.labelUrl && (
                      <a
                        href={s.labelUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        Print Label
                      </a>
                    )}
                    {s.status === "COURIER_ASSIGNED" && (
                      <button
                        onClick={() => confirmPickup.mutate(s.id)}
                        disabled={confirmPickup.isPending}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {confirmPickup.isPending ? "..." : "Picked Up ✓"}
                      </button>
                    )}
                    {(s.status === "PICKED_UP" ||
                      s.status === "IN_TRANSIT" ||
                      s.status === "OUT_FOR_DELIVERY") && (
                      <button
                        onClick={() => confirmDelivery.mutate(s.id)}
                        disabled={confirmDelivery.isPending}
                        className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        {confirmDelivery.isPending ? "..." : "Delivered ✓"}
                      </button>
                    )}
                    {s.status === "DELIVERED" && (
                      <span className="text-xs text-emerald-600 font-medium">
                        ✓ Done
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
