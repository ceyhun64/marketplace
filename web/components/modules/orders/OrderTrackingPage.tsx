"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

type ShipmentStatus =
  | "Pending"
  | "PaymentConfirmed"
  | "LabelGenerated"
  | "CourierAssigned"
  | "PickedUp"
  | "InTransit"
  | "OutForDelivery"
  | "Delivered"
  | "Failed";

interface TrackingEvent {
  status: ShipmentStatus;
  timestamp: string;
  note?: string;
}

interface TrackingData {
  orderId: string;
  trackingNumber: string;
  status: ShipmentStatus;
  estimatedDelivery: string;
  shippingRate: "Express" | "Regular";
  courierName?: string;
  events: TrackingEvent[];
  recipientName: string;
  deliveryAddress: string;
}

const STEPS: {
  status: ShipmentStatus;
  label: string;
  icon: string;
  desc: string;
}[] = [
  {
    status: "PaymentConfirmed",
    label: "Payment Confirmed",
    icon: "✓",
    desc: "Your payment was received successfully",
  },
  {
    status: "LabelGenerated",
    label: "Preparing",
    icon: "📋",
    desc: "Shipping label generated",
  },
  {
    status: "CourierAssigned",
    label: "Courier Assigned",
    icon: "🏍",
    desc: "Courier is on the way to pick up your order",
  },
  {
    status: "PickedUp",
    label: "Picked Up",
    icon: "📦",
    desc: "Courier has picked up your order",
  },
  {
    status: "InTransit",
    label: "Yolda",
    icon: "🚚",
    desc: "Siparişiniz taşınıyor",
  },
  {
    status: "OutForDelivery",
    label: "Dağıtımda",
    icon: "📍",
    desc: "Kurye adresinize doğru yola çıktı",
  },
  {
    status: "Delivered",
    label: "Teslim Edildi",
    icon: "🎉",
    desc: "Siparişiniz teslim edildi",
  },
];

const STATUS_ORDER: ShipmentStatus[] = [
  "PaymentConfirmed",
  "LabelGenerated",
  "CourierAssigned",
  "PickedUp",
  "InTransit",
  "OutForDelivery",
  "Delivered",
];

// ── Backend status normalizer ─────────────────────────────────────────────────
// Backend returns UPPER_SNAKE_CASE (e.g. "PAYMENT_CONFIRMED"),
// component uses PascalCase (e.g. "PaymentConfirmed").
const STATUS_MAP: Record<string, ShipmentStatus> = {
  PENDING: "Pending",
  PAYMENT_CONFIRMED: "PaymentConfirmed",
  LABEL_GENERATED: "LabelGenerated",
  COURIER_ASSIGNED: "CourierAssigned",
  PICKED_UP: "PickedUp",
  IN_TRANSIT: "InTransit",
  OUT_FOR_DELIVERY: "OutForDelivery",
  DELIVERED: "Delivered",
  FAILED: "Failed",
};

function normalizeStatus(raw: string): ShipmentStatus {
  return STATUS_MAP[raw] ?? (raw as ShipmentStatus);
}

function normalizeTrackingData(raw: TrackingData): TrackingData {
  return {
    ...raw,
    status: normalizeStatus(raw.status as string),
    events: raw.events.map((e) => ({
      ...e,
      status: normalizeStatus(e.status as string),
    })),
  };
}

function getStepIndex(status: ShipmentStatus): number {
  return STATUS_ORDER.indexOf(status);
}

export default function TrackingPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveConnected, setLiveConnected] = useState(false);
  const connectionRef = useRef<unknown>(null);

  useEffect(() => {
    api
      .get<TrackingData>(`/api/orders/${orderId}/tracking`)
      .then((r) => setData(normalizeTrackingData(r.data)))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [orderId]);

  // SignalR bağlantısı
  useEffect(() => {
    if (!data?.trackingNumber) return;

    let connection: {
      start: () => Promise<void>;
      invoke: (method: string, ...args: unknown[]) => Promise<void>;
      on: (method: string, callback: (...args: unknown[]) => void) => void;
      stop: () => Promise<void>;
    } | null = null;

    async function connectSignalR() {
      try {
        const signalR = await import("@microsoft/signalr");
        const token = document.cookie
          .split("; ")
          .find((r) => r.startsWith("access_token="))
          ?.split("=")[1];

        connection = new signalR.HubConnectionBuilder()
          .withUrl(
            `${process.env.NEXT_PUBLIC_API_URL}/hubs/tracking`,
            token ? { accessTokenFactory: () => token } : {},
          )
          .withAutomaticReconnect()
          .build() as typeof connection;

        await connection!.start();
        await connection!.invoke("JoinShipmentGroup", data!.trackingNumber);
        setLiveConnected(true);

        connection!.on("StatusUpdated", (updated: unknown) => {
          const u = updated as {
            status: ShipmentStatus;
            timestamp: string;
            note?: string;
          };
          setData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              status: normalizeStatus(u.status as string),
              events: [
                {
                  status: normalizeStatus(u.status as string),
                  timestamp: u.timestamp,
                  note: u.note,
                },
                ...prev.events,
              ],
            };
          });
        });

        connectionRef.current = connection;
      } catch {
        setLiveConnected(false);
      }
    }

    connectSignalR();

    return () => {
      if (connectionRef.current) {
        (connectionRef.current as { stop: () => Promise<void> }).stop();
      }
    };
  }, [data?.trackingNumber]);

  if (loading) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen  flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Sipariş takip bilgisi bulunamadı.</p>
        <Link href="/orders" className="text-sm underline underline-offset-2">
          ← Siparişlerime dön
        </Link>
      </div>
    );
  }

  const currentStep = getStepIndex(data.status);
  const isFailed = data.status === "Failed";
  const isDelivered = data.status === "Delivered";

  return (
    <div className="min-h-screen ">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <Link
            href="/orders"
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors mb-3 inline-block"
          >
            ← Siparişlerim
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Kargo Takip</h1>
              <p className="text-xs font-mono text-gray-400 mt-0.5">
                {data.trackingNumber}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-2 h-2 rounded-full ${
                  liveConnected ? "bg-green-500 animate-pulse" : "bg-gray-300"
                }`}
              />
              <span className="text-xs text-gray-400">
                {liveConnected ? "Canlı" : "Bağlanıyor..."}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* ETA card */}
        {!isFailed && (
          <div
            className={`rounded-2xl p-5 ${
              isDelivered
                ? "bg-green-50 border border-green-200"
                : "bg-gray-900 text-white"
            }`}
          >
            {isDelivered ? (
              <div className="text-center">
                <p className="text-3xl mb-1">🎉</p>
                <p className="font-bold text-green-800 text-lg">
                  Siparişiniz Teslim Edildi
                </p>
                <p className="text-sm text-green-700 mt-0.5">
                  {new Date(data.events[0]?.timestamp).toLocaleDateString(
                    "tr-TR",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">
                  Tahmini Teslimat
                </p>
                <p className="text-2xl font-bold">
                  {new Date(data.estimatedDelivery).toLocaleDateString(
                    "tr-TR",
                    { weekday: "long", day: "numeric", month: "long" },
                  )}
                </p>
                <div className="flex gap-3 mt-3 pt-3 border-t border-white/10">
                  <div>
                    <p className="text-xs text-gray-400">Shipping Type</p>
                    <p className="text-sm font-medium">
                      {data.shippingRate === "Express"
                        ? "⚡ Ekspres"
                        : "📦 Standart"}
                    </p>
                  </div>
                  {data.courierName && (
                    <div>
                      <p className="text-xs text-gray-400">Kurye</p>
                      <p className="text-sm font-medium">{data.courierName}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-400">Alıcı</p>
                    <p className="text-sm font-medium">{data.recipientName}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Progress steps */}
        {!isFailed ? (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-5 font-mono">
              Sipariş Durumu
            </p>
            <div className="space-y-0">
              {STEPS.map((step, idx) => {
                const done = idx <= currentStep;
                const active = idx === currentStep;

                return (
                  <div key={step.status} className="flex gap-4">
                    {/* Line + dot */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 transition-all ${
                          done
                            ? active
                              ? "bg-gray-900 text-white ring-4 ring-gray-200"
                              : "bg-gray-900 text-white"
                            : "bg-gray-100 text-gray-300"
                        }`}
                      >
                        {done ? (active ? step.icon : "✓") : ""}
                      </div>
                      {idx < STEPS.length - 1 && (
                        <div
                          className={`w-0.5 h-8 transition-all ${
                            idx < currentStep ? "bg-gray-900" : "bg-gray-100"
                          }`}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="pb-6 flex-1">
                      <p
                        className={`font-semibold text-sm ${
                          done ? "text-gray-900" : "text-gray-300"
                        }`}
                      >
                        {step.label}
                      </p>
                      {active && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {step.desc}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
            <p className="text-2xl mb-2">⚠️</p>
            <p className="font-bold text-red-800">Teslimat Başarısız</p>
            <p className="text-sm text-red-600 mt-1">
              Kurye teslimatı tamamlayamadı. Lütfen destek ile iletişime geçin.
            </p>
          </div>
        )}

        {/* Event log */}
        {data.events.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-4 font-mono">
              Geçmiş
            </p>
            <div className="space-y-3">
              {data.events.map((event, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-start gap-4 text-sm pb-3 border-b border-gray-50 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-gray-800 font-medium">
                      {STEPS.find((s) => s.status === event.status)?.label ??
                        event.status}
                    </p>
                    {event.note && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {event.note}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 font-mono whitespace-nowrap flex-shrink-0">
                    {new Date(event.timestamp).toLocaleString("tr-TR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delivery address */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2 font-mono">
            Teslimat Adresi
          </p>
          <p className="text-sm text-gray-700">{data.deliveryAddress}</p>
        </div>
      </div>
    </div>
  );
}
