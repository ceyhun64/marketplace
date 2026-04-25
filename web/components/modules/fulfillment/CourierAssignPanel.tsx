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
    if (!selectedCourierId) return setError("Lütfen bir kurye seçin.");
    setError(null);
    try {
      await assignMutation.mutateAsync({
        shipmentId: shipment.id,
        courierId: selectedCourierId,
      });
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Atama başarısız.");
    }
  };

  const handleGenerateLabel = async () => {
    setError(null);
    try {
      await labelMutation.mutateAsync(shipment.id);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Etiket oluşturulamadı.");
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
            <h2 className="text-lg font-semibold text-[#0D0D0D]">Kurye Ata</h2>
            <p className="font-mono text-xs text-[#7A7060] mt-0.5">
              Takip: {shipment.trackingNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Etiket Oluştur */}
          {!shipment.labelUrl && (
            <div className=" rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#0D0D0D]">
                  Kargo Etiketi
                </p>
                <p className="text-xs text-[#7A7060] mt-0.5">
                  QR kodlu PDF etiket oluştur
                </p>
              </div>
              <button
                onClick={handleGenerateLabel}
                disabled={labelMutation.isPending}
                className="text-xs bg-[#0D0D0D] text-[#F5F2EB] px-4 py-2 rounded-lg hover:bg-[#1A4A6B] disabled:opacity-50 transition-colors font-medium"
              >
                {labelMutation.isPending
                  ? "Oluşturuluyor..."
                  : "Etiket Oluştur"}
              </button>
            </div>
          )}

          {shipment.labelUrl && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">
                  ✓ Etiket Hazır
                </p>
                <p className="text-xs text-green-600 mt-0.5">
                  PDF olarak indirebilirsiniz
                </p>
              </div>
              <a
                href={shipment.labelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors font-medium"
              >
                İndir
              </a>
            </div>
          )}

          {/* Kurye Listesi */}
          <div>
            <p className="text-sm font-medium text-[#0D0D0D] mb-3">
              Müsait Kuryeler
              <span className="ml-2 font-mono text-[10px] text-[#7A7060]">
                ({availableCouriers.length} müsait)
              </span>
            </p>

            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : availableCouriers.length === 0 ? (
              <div className="text-center py-6 text-sm text-[#7A7060]">
                Şu an müsait kurye bulunmuyor.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {availableCouriers.map((courier) => (
                  <button
                    key={courier.id}
                    onClick={() => setSelectedCourierId(courier.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      selectedCourierId === courier.id
                        ? "border-[#1A4A6B] bg-[#1A4A6B]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#1A4A6B]/10 flex items-center justify-center text-base">
                        🚴
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-[#0D0D0D]">
                          {courier.fullName}
                        </p>
                        <p className="text-xs text-[#7A7060] font-mono">
                          {courier.vehicleType ?? "Araç belirtilmemiş"}
                          {courier.vehiclePlate
                            ? ` · ${courier.vehiclePlate}`
                            : ""}
                        </p>
                      </div>
                      {selectedCourierId === courier.id && (
                        <span className="text-[#1A4A6B] text-sm">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
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
            İptal
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedCourierId || assignMutation.isPending}
            className="flex-1 bg-[#1A4A6B] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#1A4A6B]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {assignMutation.isPending ? "Atanıyor..." : "Kurye Ata"}
          </button>
        </div>
      </div>
    </div>
  );
}
