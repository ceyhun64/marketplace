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
      <div className="bg-(--bg-surface) rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-(--border-light)">
          <div>
            <h2 className="text-lg font-semibold text-(--text-primary)">Assign Courier</h2>
            <p className="font-mono text-xs text-(--text-tertiary) mt-0.5">
              Tracking: {shipment.trackingNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-(--text-tertiary) hover:text-(--text-secondary) text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Generate Label */}
          {!shipment.labelUrl && (
            <div className="bg-(--bg-sunken) rounded-xl p-4 flex items-center justify-between border border-(--border-light)">
              <div>
                <p className="text-sm font-medium text-(--text-primary)">
                  Shipping Label
                </p>
                <p className="text-xs text-(--text-tertiary) mt-0.5">
                  Generate a QR-coded PDF label
                </p>
              </div>
              <button
                onClick={handleGenerateLabel}
                disabled={labelMutation.isPending}
                className="text-xs bg-(--charcoal) text-white px-4 py-2 rounded-lg hover:bg-(--charcoal-2) disabled:opacity-50 transition-colors font-medium"
              >
                {labelMutation.isPending ? "Generating..." : "Generate Label"}
              </button>
            </div>
          )}

          {shipment.labelUrl && (
            <div className="bg-(--success-bg) border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-(--success)">
                  ✓ Label Ready
                </p>
                <p className="text-xs text-(--success) mt-0.5">
                  Download the PDF label
                </p>
              </div>
              <a
                href={shipment.labelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-(--success) text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors font-medium"
              >
                Download
              </a>
            </div>
          )}

          {/* Courier List */}
          <div>
            <p className="text-sm font-medium text-(--text-primary) mb-3">
              Available Couriers
              <span className="ml-2 text-xs text-(--text-tertiary) font-normal">
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
              <div className="text-center py-6 text-sm text-(--text-tertiary)">
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
                        ? "border-blue-500 bg-(--info-bg)"
                        : "border-(--border-mid) hover:border-(--border-mid) hover:bg-(--bg-sunken)"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-(--charcoal) flex items-center justify-center text-white text-xs font-bold">
                        {courier.fullName?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-(--text-primary)">
                          {courier.fullName}
                        </p>
                        <p className="text-xs text-(--text-tertiary) font-mono">
                          {courier.vehicleType ?? "Vehicle not specified"}
                          {courier.vehiclePlate
                            ? ` · ${courier.vehiclePlate}`
                            : ""}
                        </p>
                      </div>
                      {selectedCourierId === courier.id && (
                        <span className="text-(--info) text-sm font-bold">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-(--danger) bg-(--danger-bg) rounded-lg px-3 py-2 border border-(--danger-border)">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 border border-(--border-mid) text-(--text-secondary) rounded-xl py-2.5 text-sm font-medium hover:bg-(--bg-sunken) transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedCourierId || assignMutation.isPending}
            className="flex-1 bg-(--charcoal) text-white rounded-xl py-2.5 text-sm font-medium hover:bg-(--charcoal-2) disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {assignMutation.isPending ? "Assigning..." : "Assign Courier"}
          </button>
        </div>
      </div>
    </div>
  );
}
