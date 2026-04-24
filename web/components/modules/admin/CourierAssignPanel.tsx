"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCouriers,
  useAssignCourier,
  useGenerateLabel,
} from "@/queries/useCouriers";
import type { Shipment } from "@/types/entities";

interface Props {
  shipment: Shipment;
  onClose: () => void;
}

export default function CourierAssignPanel({ shipment, onClose }: Props) {
  const { data: couriers = [], isLoading } = useCouriers();
  const assignMutation = useAssignCourier();
  const labelMutation = useGenerateLabel();
  const [selectedCourierId, setSelectedCourierId] = useState(
    shipment.courierId ?? "",
  );
  const [error, setError] = useState<string | null>(null);

  const availableCouriers = couriers.filter((c) => c.isAvailable);

  const handleAssign = async () => {
    if (!selectedCourierId) return setError("Please select a courier.");
    setError(null);
    try {
      await assignMutation.mutateAsync({
        shipmentId: shipment.id,
        courierId: selectedCourierId,
      });
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Assignment failed.");
    }
  };

  const handleGenerateLabel = async () => {
    setError(null);
    try {
      await labelMutation.mutateAsync(shipment.id);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to generate label.");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Assign Courier</h2>
            <p className="font-mono text-xs text-gray-400 mt-0.5">
              Tracking: {shipment.trackingNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Generate Label */}
          {!shipment.labelUrl && (
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between border border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Shipping Label
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Generate a QR-coded PDF label
                </p>
              </div>
              <button
                onClick={handleGenerateLabel}
                disabled={labelMutation.isPending}
                className="text-xs bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors font-medium"
              >
                {labelMutation.isPending ? "Generating..." : "Generate Label"}
              </button>
            </div>
          )}

          {shipment.labelUrl && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-800">
                  ✓ Label Ready
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  Download the PDF label
                </p>
              </div>
              <a
                href={shipment.labelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-emerald-700 text-white px-4 py-2 rounded-lg hover:bg-emerald-800 transition-colors font-medium"
              >
                Download
              </a>
            </div>
          )}

          {/* Courier List */}
          <div>
            <p className="text-sm font-medium text-gray-900 mb-3">
              Available Couriers
              <span className="ml-2 text-xs text-gray-400 font-normal">
                ({availableCouriers.length} available)
              </span>
            </p>

            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : availableCouriers.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-400">
                No available couriers right now.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {availableCouriers.map((courier) => (
                  <button
                    key={courier.id}
                    onClick={() => setSelectedCourierId(courier.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      selectedCourierId === courier.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center text-white text-xs font-bold">
                        {courier.fullName?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900">
                          {courier.fullName}
                        </p>
                        <p className="text-xs text-gray-400 font-mono">
                          {courier.vehicleType ?? "Vehicle not specified"}
                          {courier.vehiclePlate
                            ? ` · ${courier.vehiclePlate}`
                            : ""}
                        </p>
                      </div>
                      {selectedCourierId === courier.id && (
                        <span className="text-blue-600 text-sm font-bold">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2 border border-rose-100">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-700 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedCourierId || assignMutation.isPending}
            className="flex-1 bg-gray-900 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {assignMutation.isPending ? "Assigning..." : "Assign Courier"}
          </button>
        </div>
      </div>
    </div>
  );
}
