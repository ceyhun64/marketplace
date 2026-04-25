import { Suspense } from "react";
import { notFound } from "next/navigation";
import { fetchSSR } from "@/lib/fetch";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface PageProps {
  params: Promise<{ trackingNo: string }>;
}

type ShipmentStatus =
  | "PLACED"
  | "PAYMENT_CONFIRMED"
  | "LABEL_GENERATED"
  | "COURIER_ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED";

const STATUS_STEPS: { status: ShipmentStatus; label: string; icon: string }[] =
  [
    { status: "PLACED", label: "Order Placed", icon: "📋" },
    { status: "PAYMENT_CONFIRMED", label: "Payment Confirmed", icon: "✅" },
    { status: "LABEL_GENERATED", label: "Label Generated", icon: "🏷️" },
    { status: "COURIER_ASSIGNED", label: "Courier Assigned", icon: "👤" },
    { status: "PICKED_UP", label: "Package Picked Up", icon: "📦" },
    { status: "IN_TRANSIT", label: "Yolda", icon: "🚚" },
    { status: "OUT_FOR_DELIVERY", label: "Dağıtımda", icon: "📍" },
    { status: "DELIVERED", label: "Teslim Edildi", icon: "🎉" },
  ];

const STATUS_ORDER = STATUS_STEPS.map((s) => s.status);

function getStatusIndex(status: ShipmentStatus) {
  if (status === "FAILED") return -1;
  return STATUS_ORDER.indexOf(status);
}

function formatDateTime(dt: string) {
  return new Date(dt).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function TrackingContent({ trackingNo }: { trackingNo: string }) {
  const data = await fetchSSR<{ data: any }>(
    `/fulfillment/events/${trackingNo}`,
  );

  if (!data?.data) notFound();

  const shipment = data.data;
  const currentIndex = getStatusIndex(shipment.status as ShipmentStatus);
  const isFailed = shipment.status === "FAILED";
  const isDelivered = shipment.status === "DELIVERED";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div
        className={`py-10 px-4 text-center ${isDelivered ? "bg-green-600" : isFailed ? "bg-red-600" : "bg-gray-900"}`}
      >
        <Link
          href="/"
          className="text-white/70 text-sm hover:text-white mb-6 inline-block"
        >
          ← Ana Sayfaya Dön
        </Link>
        <p className="text-sm font-medium text-white/70 uppercase tracking-widest mb-2">
          Kargo Takip
        </p>
        <h1 className="text-3xl font-black text-white font-mono tracking-wider">
          {trackingNo}
        </h1>
        <div className="mt-4">
          {isDelivered ? (
            <span className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full text-sm font-semibold">
              🎉 Teslim Edildi
            </span>
          ) : isFailed ? (
            <span className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full text-sm font-semibold">
              ❌ Teslim Başarısız
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full text-sm font-semibold">
              🚚 Yolda
            </span>
          )}
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        {/* ETA Card */}
        {(shipment.estimatedDeliveryWindow || shipment.actualDeliveredAt) && (
          <div
            className={`rounded-2xl p-5 ${isDelivered ? "bg-green-50 border-2 border-green-200" : "bg-blue-50 border-2 border-blue-100"}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
              {isDelivered ? "Teslim Tarihi" : "Tahmini Teslimat"}
            </p>
            {isDelivered && shipment.actualDeliveredAt ? (
              <p className="text-lg font-bold text-green-700">
                {formatDateTime(shipment.actualDeliveredAt)}
              </p>
            ) : shipment.estimatedDeliveryWindow ? (
              <p className="text-lg font-bold text-blue-700">
                {formatDateTime(shipment.estimatedDeliveryWindow.start)}
                {" — "}
                {formatDateTime(shipment.estimatedDeliveryWindow.end)}
              </p>
            ) : null}
          </div>
        )}

        {/* Courier Info */}
        {shipment.courierName && !isDelivered && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Kurye Bilgisi
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
                👤
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {shipment.courierName}
                </p>
                {shipment.courierPhone && (
                  <a
                    href={`tel:${shipment.courierPhone}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {shipment.courierPhone}
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-5">
            Kargo Durumu
          </p>
          {isFailed ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-2">❌</div>
              <p className="font-semibold text-red-600">Teslimat Başarısız</p>
              <p className="text-sm text-gray-500 mt-1">
                Teslimat gerçekleştirilemedi. Lütfen satıcıyla iletişime geçin.
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {STATUS_STEPS.map((step, i) => {
                const isDone = i <= currentIndex;
                const isCurrent = i === currentIndex;
                return (
                  <div key={step.status} className="flex gap-4">
                    {/* Icon */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-base flex-shrink-0 transition-all ${
                          isCurrent
                            ? "bg-blue-600 shadow-lg shadow-blue-200 ring-4 ring-blue-100"
                            : isDone
                              ? "bg-green-500"
                              : "bg-gray-100"
                        }`}
                      >
                        {isDone ? (
                          <span>{isCurrent ? step.icon : "✓"}</span>
                        ) : (
                          <span className="text-gray-400 text-sm">{i + 1}</span>
                        )}
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div
                          className={`w-0.5 flex-1 my-1 ${
                            isDone && i < currentIndex
                              ? "bg-green-400"
                              : "bg-gray-200"
                          }`}
                          style={{ minHeight: "20px" }}
                        />
                      )}
                    </div>

                    {/* Label */}
                    <div
                      className={`pb-5 ${i === STATUS_STEPS.length - 1 ? "pb-0" : ""}`}
                    >
                      <p
                        className={`text-sm font-semibold mt-2 ${
                          isCurrent
                            ? "text-blue-600"
                            : isDone
                              ? "text-green-600"
                              : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </p>
                      {isCurrent && shipment.events?.length > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDateTime(
                            shipment.events.find(
                              (e: any) => e.status === step.status,
                            )?.createdAt || "",
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Event Log */}
        {shipment.events?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">
              Detaylı Geçmiş
            </p>
            <div className="space-y-3">
              {[...(shipment.events as any[])].reverse().map((event: any) => (
                <div
                  key={event.id}
                  className="flex gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0"
                >
                  <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {STATUS_STEPS.find((s) => s.status === event.status)
                        ?.label || event.status}
                    </p>
                    {event.note && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {event.note}
                      </p>
                    )}
                    {event.location && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        📍 {event.location}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDateTime(event.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 pb-6">
          Bu sayfa QR kodunuzdan erişildi. Sipariş no: {shipment.orderNumber}
        </p>
      </div>
    </div>
  );
}

export default async function TrackingPage({ params }: PageProps) {
  const { trackingNo } = await params;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <div className="bg-gray-900 py-10 text-center">
            <Skeleton className="h-8 w-64 mx-auto bg-white/10" />
          </div>
          <div className="max-w-xl mx-auto px-4 py-8 space-y-4">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      }
    >
      <TrackingContent trackingNo={trackingNo} />
    </Suspense>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { trackingNo } = await params;
  return {
    title: `Tracking: ${trackingNo}`,
    description: `${trackingNo} numaralı kargoyu takip edin`,
  };
}
