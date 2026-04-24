"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useShipments } from "@/queries/useCouriers";
import CourierAssignPanel from "@/components/modules/fulfillment/CourierAssignPanel";
import { SHIPMENT_STATUS_LABELS, SHIPMENT_STATUS_COLORS } from "@/types/enums";
import { formatDateTime } from "@/lib/format";
import type { Shipment } from "@/types/entities";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "COURIER_ASSIGNED", label: "Courier Assigned" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "DELIVERED", label: "Delivered" },
];

export default function AdminFulfillmentPanel() {
  const [statusFilter, setStatusFilter] = useState("");
  const [assignTarget, setAssignTarget] = useState<Shipment | null>(null);

  const { data: shipments = [], isLoading } = useShipments(
    statusFilter ? { status: statusFilter } : undefined,
  );

  return (
    <div className="space-y-5">
      {/* Filters */}
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
          <p className="text-sm font-medium">No shipments found</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                {[
                  "Tracking No.",
                  "Status",
                  "Courier",
                  "Updated",
                  "Label",
                  "Action",
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
              {shipments.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <span className="font-mono text-xs font-bold text-blue-600">
                      {s.trackingNumber}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${SHIPMENT_STATUS_COLORS[s.status]}`}
                    >
                      {SHIPMENT_STATUS_LABELS[s.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-700">
                    {s.courierName ?? (
                      <span className="text-xs text-gray-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400">
                    {s.updatedAt ? formatDateTime(s.updatedAt) : "—"}
                  </td>
                  <td className="px-5 py-3">
                    {s.labelUrl ? (
                      <a
                        href={s.labelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-600 hover:underline font-medium"
                      >
                        Download
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
                      {s.courierId ? "Reassign" : "Assign Courier"}
                    </button>
                  </td>
                </tr>
              ))}
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
