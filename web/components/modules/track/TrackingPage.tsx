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

const STATUS_STEPS: { status: ShipmentStatus; label: string }[] = [
  { status: "PLACED",            label: "Order Placed"       },
  { status: "PAYMENT_CONFIRMED", label: "Payment Confirmed"  },
  { status: "LABEL_GENERATED",   label: "Label Generated"    },
  { status: "COURIER_ASSIGNED",  label: "Courier Assigned"   },
  { status: "PICKED_UP",         label: "Package Picked Up"  },
  { status: "IN_TRANSIT",        label: "In Transit"         },
  { status: "OUT_FOR_DELIVERY",  label: "Out for Delivery"   },
  { status: "DELIVERED",         label: "Delivered"          },
];

const STATUS_ORDER = STATUS_STEPS.map((s) => s.status);

function getStatusIndex(status: ShipmentStatus) {
  if (status === "FAILED") return -1;
  return STATUS_ORDER.indexOf(status);
}

function formatDateTime(dt: string) {
  return new Date(dt).toLocaleString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function TrackingContent({ trackingNo }: { trackingNo: string }) {
  const data = await fetchSSR<{ data: any }>(`/fulfillment/events/${trackingNo}`);

  if (!data?.data) return notFound();

  const shipment = data.data;
  const currentIndex = getStatusIndex(shipment.status as ShipmentStatus);
  const isFailed   = shipment.status === "FAILED";
  const isDelivered = shipment.status === "DELIVERED";

  const headerBg = isDelivered
    ? "var(--success)"
    : isFailed
    ? "var(--red)"
    : "var(--charcoal)";

  return (
    <div className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* Header */}
      <div
        className="py-10 px-4 text-center"
        style={{ background: headerBg }}
      >
        <Link
          href="/"
          className="text-sm mb-6 inline-block transition-opacity hover:opacity-70"
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          ← Back to Home
        </Link>
        <p
          className="text-sm font-medium uppercase tracking-widest mb-2"
          style={{ color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-mono)" }}
        >
          Shipment Tracking
        </p>
        <h1
          className="text-3xl font-black text-white tracking-wider"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {trackingNo}
        </h1>
        <div className="mt-4">
          {isDelivered ? (
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
              style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
            >
              ✓ Delivered
            </span>
          ) : isFailed ? (
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
              style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
            >
              ✕ Delivery Failed
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
              style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
            >
              In Transit
            </span>
          )}
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        {/* ETA Card */}
        {(shipment.estimatedDeliveryWindow || shipment.actualDeliveredAt) && (
          <div
            className="rounded-2xl p-5"
            style={
              isDelivered
                ? { background: "var(--success-bg)", border: "2px solid var(--success-border)" }
                : { background: "var(--info-bg)", border: "2px solid var(--info-border)" }
            }
          >
            <p
              className="text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-mono)" }}
            >
              {isDelivered ? "Delivered On" : "Estimated Delivery"}
            </p>
            {isDelivered && shipment.actualDeliveredAt ? (
              <p
                className="text-lg font-bold"
                style={{ color: "var(--success)" }}
              >
                {formatDateTime(shipment.actualDeliveredAt)}
              </p>
            ) : shipment.estimatedDeliveryWindow ? (
              <p
                className="text-lg font-bold"
                style={{ color: "var(--info)" }}
              >
                {formatDateTime(shipment.estimatedDeliveryWindow.start)}
                {" — "}
                {formatDateTime(shipment.estimatedDeliveryWindow.end)}
              </p>
            ) : null}
          </div>
        )}

        {/* Courier Info */}
        {shipment.courierName && !isDelivered && (
          <div
            className="rounded-2xl p-5"
            style={{ background: "white", border: "1px solid var(--border-light)" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wide mb-3"
              style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-mono)" }}
            >
              Courier Info
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ background: "var(--charcoal)" }}
              >
                {shipment.courierName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--charcoal)" }}
                >
                  {shipment.courierName}
                </p>
                {shipment.courierPhone && (
                  <a
                    href={`tel:${shipment.courierPhone}`}
                    className="text-sm hover:underline"
                    style={{ color: "var(--info)" }}
                  >
                    {shipment.courierPhone}
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "white", border: "1px solid var(--border-light)" }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wide mb-5"
            style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-mono)" }}
          >
            Shipment Status
          </p>
          {isFailed ? (
            <div className="text-center py-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-white text-xl font-bold"
                style={{ background: "var(--red)" }}
              >
                ✕
              </div>
              <p className="font-semibold" style={{ color: "var(--red)" }}>
                Delivery Failed
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--charcoal-soft)" }}>
                Delivery could not be completed. Please contact the seller.
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {STATUS_STEPS.map((step, i) => {
                const isDone    = i <= currentIndex;
                const isCurrent = i === currentIndex;
                return (
                  <div key={step.status} className="flex gap-4">
                    {/* Icon column */}
                    <div className="flex flex-col items-center">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all"
                        style={{
                          background: isCurrent
                            ? "var(--charcoal)"
                            : isDone
                            ? "var(--success)"
                            : "var(--off-white-2)",
                          color: isCurrent || isDone ? "white" : "var(--charcoal-mist)",
                          boxShadow: isCurrent ? "0 0 0 4px rgba(30,30,30,0.12)" : "none",
                        }}
                      >
                        {isDone ? (
                          <span>{isCurrent ? "●" : "✓"}</span>
                        ) : (
                          <span>{i + 1}</span>
                        )}
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div
                          className="w-0.5 flex-1 my-1"
                          style={{
                            background:
                              isDone && i < currentIndex
                                ? "var(--success)"
                                : "var(--border-light)",
                            minHeight: "20px",
                          }}
                        />
                      )}
                    </div>

                    {/* Label column */}
                    <div className={`pb-5 ${i === STATUS_STEPS.length - 1 ? "pb-0" : ""}`}>
                      <p
                        className="text-sm font-semibold mt-2"
                        style={{
                          color: isCurrent
                            ? "var(--charcoal)"
                            : isDone
                            ? "var(--success)"
                            : "var(--charcoal-mist)",
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        {step.label}
                      </p>
                      {isCurrent && shipment.events?.length > 0 && (
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: "var(--charcoal-mist)", fontFamily: "var(--font-mono)" }}
                        >
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
          <div
            className="rounded-2xl p-5"
            style={{ background: "white", border: "1px solid var(--border-light)" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wide mb-4"
              style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-mono)" }}
            >
              Event History
            </p>
            <div className="space-y-3">
              {[...(shipment.events as any[])].reverse().map((event: any) => (
                <div
                  key={event.id}
                  className="flex gap-3 pb-3 last:pb-0"
                  style={{ borderBottom: "1px solid var(--border-subtle)" }}
                >
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ background: "var(--charcoal-mist)" }}
                  />
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--charcoal)", fontFamily: "var(--font-body)" }}
                    >
                      {STATUS_STEPS.find((s) => s.status === event.status)?.label ?? event.status}
                    </p>
                    {event.note && (
                      <p className="text-xs mt-0.5" style={{ color: "var(--charcoal-soft)" }}>
                        {event.note}
                      </p>
                    )}
                    {event.location && (
                      <p className="text-xs mt-0.5" style={{ color: "var(--charcoal-mist)", fontFamily: "var(--font-mono)" }}>
                        {event.location}
                      </p>
                    )}
                    <p
                      className="text-xs mt-1"
                      style={{ color: "var(--charcoal-mist)", fontFamily: "var(--font-mono)" }}
                    >
                      {formatDateTime(event.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <p
          className="text-center text-xs pb-6"
          style={{ color: "var(--charcoal-mist)", fontFamily: "var(--font-mono)" }}
        >
          Scanned via QR code · Order #{shipment.orderNumber}
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
        <div className="min-h-screen" style={{ background: "var(--off-white)" }}>
          <div className="py-10 text-center" style={{ background: "var(--charcoal)" }}>
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
    description: `Track shipment ${trackingNo} — real-time delivery status.`,
  };
}
