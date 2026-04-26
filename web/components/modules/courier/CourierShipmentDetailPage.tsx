"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, useCallback } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft,
  Package,
  MapPin,
  Clock,
  Printer,
  CheckCircle2,
  Truck,
  Phone,
  User,
  FileText,
  Navigation,
  LocateFixed,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useUpdateCourierLocation } from "@/queries/useCouriers";

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

interface ShipmentDetail {
  id: string;
  trackingNumber: string;
  status: ShipmentStatus;
  shippingRate: "EXPRESS" | "REGULAR";
  orderId: string;
  orderNumber: string;
  labelUrl?: string;

  merchant: {
    name: string;
    address: string;
    phone?: string;
    latitude?: number;
    longitude?: number;
  };

  customer: {
    name: string;
    address: string;
    phone?: string;
  };

  estimatedPickupWindow?: {
    start: string;
    end: string;
  };
  estimatedDeliveryWindow?: {
    start: string;
    end: string;
  };
  actualDeliveredAt?: string;

  items: Array<{
    productName: string;
    quantity: number;
  }>;

  events: Array<{
    id: string;
    status: ShipmentStatus;
    note?: string;
    location?: string;
    createdAt: string;
    createdByName: string;
  }>;
}

const STATUS_LABELS: Record<ShipmentStatus, string> = {
  PLACED: "Order Placed",
  PAYMENT_CONFIRMED: "Payment Confirmed",
  LABEL_GENERATED: "Label Generated",
  COURIER_ASSIGNED: "Courier Assigned",
  PICKED_UP: "Package Picked Up",
  IN_TRANSIT: "In Transit",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  FAILED: "Delivery Failed",
};

function formatDateTime(dt: string) {
  return new Date(dt).toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Konum Gönderme Hook'u (Geolocation API + 30sn interval) ──────────────────

function useCourierLocationBroadcast(active: boolean) {
  const { mutate: sendLocation } = useUpdateCourierLocation();
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastCoordsRef = useRef<{ latitude: number; longitude: number } | null>(
    null,
  );

  const send = useCallback(
    (coords: { latitude: number; longitude: number }) => {
      lastCoordsRef.current = coords;
      sendLocation(coords);
      setIsSending(true);
      // Kısa süre sonra indicator'ı kapat
      setTimeout(() => setIsSending(false), 1500);
    },
    [sendLocation],
  );

  useEffect(() => {
    if (!active) {
      // Durdur
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      setError("Bu cihaz konum özelliğini desteklemiyor.");
      return;
    }

    // Geolocation API ile konumu izle
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setError(null);
        send({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setError("Konum izni reddedildi.");
        } else {
          setError("Konum alınamadı.");
        }
      },
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 10_000 },
    );

    // Konum değişmese bile 30sn'de bir son konumu gönder (heartbeat)
    intervalRef.current = setInterval(() => {
      if (lastCoordsRef.current) {
        sendLocation(lastCoordsRef.current);
      }
    }, 30_000);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [active, send, sendLocation]);

  return { isSending, error };
}

// ── Ana Bileşen ───────────────────────────────────────────────────────────────

export default function CourierShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const shipmentId = params.id as string;

  // Konum yayını: sadece kargo aktifken (alındı ama teslim edilmedi)
  const [locationActive, setLocationActive] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["courier-shipment", shipmentId],
    queryFn: async () => {
      const res = await api.get(`/api/fulfillment/${shipmentId}`);
      return res.data;
    },
    enabled: !!shipmentId,
    refetchInterval: 30000,
  });

  const pickupMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(
        `/api/fulfillment/${shipmentId}/pickup-confirm`,
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success("Kargo teslim alındı olarak işaretlendi");
      setLocationActive(true); // Teslim alındıktan sonra konum yayınını başlat
      queryClient.invalidateQueries({
        queryKey: ["courier-shipment", shipmentId],
      });
    },
    onError: () => toast.error("İşlem başarısız oldu"),
  });

  const deliveredMutation = useMutation({
    mutationFn: async () => {
      const recipientName = prompt("Teslim alan kişinin adını girin:");
      if (!recipientName) return;
      const res = await api.post(`/api/fulfillment/${shipmentId}/delivered`, {
        recipientName,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Teslimat tamamlandı! ✓");
      setLocationActive(false); // Teslim tamamlandı, konum yayınını durdur
      queryClient.invalidateQueries({
        queryKey: ["courier-shipment", shipmentId],
      });
    },
    onError: () => toast.error("İşlem başarısız oldu"),
  });

  const shipment: ShipmentDetail | null = data?.data || null;

  // Durum değiştiğinde konum yayın durumunu otomatik ayarla
  useEffect(() => {
    if (!shipment) return;
    const activeStatuses: ShipmentStatus[] = [
      "PICKED_UP",
      "IN_TRANSIT",
      "OUT_FOR_DELIVERY",
    ];
    const shouldBeActive = activeStatuses.includes(shipment.status);
    setLocationActive(shouldBeActive);
  }, [shipment?.status]);

  const { isSending, error: locationError } =
    useCourierLocationBroadcast(locationActive);

  const handlePrintLabel = () => {
    if (shipment?.labelUrl) {
      window.open(shipment.labelUrl, "_blank");
    } else {
      toast.error("Kargo etiketi henüz oluşturulmadı");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="p-6 text-center py-20">
        <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">Kargo bulunamadı</p>
        <Button
          variant="ghost"
          className="mt-3"
          onClick={() => router.push("/courier/shipments")}
        >
          Geri Git
        </Button>
      </div>
    );
  }

  const canPickup = shipment.status === "COURIER_ASSIGNED";
  const canDeliver =
    shipment.status === "PICKED_UP" ||
    shipment.status === "IN_TRANSIT" ||
    shipment.status === "OUT_FOR_DELIVERY";
  const isCompleted =
    shipment.status === "DELIVERED" || shipment.status === "FAILED";

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/courier/shipments")}
          className="text-gray-500 p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900">Kargo Detayı</h1>
          <p className="text-xs font-mono text-blue-600">
            {shipment.trackingNumber}
          </p>
        </div>
        <span
          className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
            shipment.status === "DELIVERED"
              ? "bg-green-100 text-green-700"
              : shipment.status === "FAILED"
                ? "bg-red-100 text-red-700"
                : shipment.status === "COURIER_ASSIGNED"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-blue-100 text-blue-700"
          }`}
        >
          {STATUS_LABELS[shipment.status]}
        </span>
      </div>

      {/* Konum Yayın Durumu */}
      {locationActive && (
        <div
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-medium transition-all ${
            locationError
              ? "bg-red-50 text-red-600 border border-red-200"
              : isSending
                ? "bg-blue-50 text-blue-600 border border-blue-200"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
          }`}
        >
          {locationError ? (
            <>
              <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{locationError}</span>
            </>
          ) : (
            <>
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  isSending ? "bg-blue-500 animate-pulse" : "bg-emerald-500"
                }`}
              />
              <Wifi className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                {isSending
                  ? "Konum gönderiliyor..."
                  : "Canlı konum yayınlanıyor"}
              </span>
              <button
                onClick={() => setLocationActive(false)}
                className="ml-auto text-xs underline opacity-60 hover:opacity-100"
              >
                Durdur
              </button>
            </>
          )}
        </div>
      )}

      {/* Konum Yayınını Başlat Butonu (aktif değilse ve kargo alınmışsa) */}
      {!locationActive && canDeliver && (
        <button
          onClick={() => setLocationActive(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-gray-300 text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
        >
          <LocateFixed className="w-3.5 h-3.5" />
          Canlı Konum Yayınını Başlat
        </button>
      )}

      {/* Action Buttons */}
      {!isCompleted && (
        <div className="grid grid-cols-2 gap-3">
          <Button
            className="h-14 text-sm font-semibold"
            disabled={!canPickup || pickupMutation.isPending}
            onClick={() => pickupMutation.mutate()}
          >
            <Package className="w-5 h-5 mr-2" />
            {pickupMutation.isPending ? "İşleniyor..." : "Teslim Aldım"}
          </Button>
          <Button
            className="h-14 text-sm font-semibold bg-green-600 hover:bg-green-700"
            disabled={!canDeliver || deliveredMutation.isPending}
            onClick={() => deliveredMutation.mutate()}
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            {deliveredMutation.isPending ? "İşleniyor..." : "Teslim Ettim"}
          </Button>
        </div>
      )}
      {isCompleted && shipment.status === "DELIVERED" && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-1" />
          <p className="text-green-700 font-semibold text-sm">
            Teslimat Tamamlandı
          </p>
          {shipment.actualDeliveredAt && (
            <p className="text-green-600 text-xs mt-1">
              {formatDateTime(shipment.actualDeliveredAt)}
            </p>
          )}
        </div>
      )}

      {/* Label */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gray-100 rounded-lg">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Kargo Etiketi
              </p>
              <p className="text-xs text-gray-500">
                {shipment.labelUrl ? "Etiket hazır" : "Etiket bekleniyor"}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintLabel}
            disabled={!shipment.labelUrl}
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Yazdır
          </Button>
        </CardContent>
      </Card>

      {/* ETA */}
      {(shipment.estimatedPickupWindow || shipment.estimatedDeliveryWindow) && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              Teslimat Zaman Penceresi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {shipment.estimatedPickupWindow && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Teslim Alma Penceresi</span>
                <span className="font-medium text-gray-900">
                  {formatDateTime(shipment.estimatedPickupWindow.start)} –{" "}
                  {formatDateTime(shipment.estimatedPickupWindow.end)}
                </span>
              </div>
            )}
            {shipment.estimatedDeliveryWindow && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Teslimat Penceresi</span>
                <span className="font-medium text-gray-900">
                  {formatDateTime(shipment.estimatedDeliveryWindow.start)} –{" "}
                  {formatDateTime(shipment.estimatedDeliveryWindow.end)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Kargo Tipi</span>
              <span
                className={`font-semibold ${
                  shipment.shippingRate === "EXPRESS"
                    ? "text-amber-600"
                    : "text-gray-700"
                }`}
              >
                {shipment.shippingRate === "EXPRESS"
                  ? "⚡ Ekspres"
                  : "Standart"}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Addresses */}
      <div className="grid grid-cols-1 gap-4">
        {/* Pickup Address */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-50 rounded-lg mt-0.5">
                <Package className="w-4 h-4 text-orange-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Teslim Alma Adresi (Satıcı)
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {shipment.merchant.name}
                </p>
                <p className="text-sm text-gray-600 mt-0.5">
                  {shipment.merchant.address}
                </p>
                {shipment.merchant.phone && (
                  <a
                    href={`tel:${shipment.merchant.phone}`}
                    className="flex items-center gap-1 text-sm text-blue-600 mt-1.5 hover:underline"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {shipment.merchant.phone}
                  </a>
                )}
              </div>
              {shipment.merchant.latitude && shipment.merchant.longitude && (
                <a
                  href={`https://maps.google.com/?q=${shipment.merchant.latitude},${shipment.merchant.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="ghost" size="sm" className="text-blue-600">
                    <Navigation className="w-4 h-4" />
                  </Button>
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Delivery Address */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-50 rounded-lg mt-0.5">
                <MapPin className="w-4 h-4 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Teslimat Adresi (Müşteri)
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {shipment.customer.name}
                </p>
                <p className="text-sm text-gray-600 mt-0.5">
                  {shipment.customer.address}
                </p>
                {shipment.customer.phone && (
                  <a
                    href={`tel:${shipment.customer.phone}`}
                    className="flex items-center gap-1 text-sm text-blue-600 mt-1.5 hover:underline"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {shipment.customer.phone}
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      {shipment.items?.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Sipariş İçeriği
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {shipment.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-700">{item.productName}</span>
                <span className="font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">
                  x{item.quantity}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Status Timeline */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Truck className="w-4 h-4 text-gray-500" />
            Durum Geçmişi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {shipment.events?.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              Henüz durum güncellemesi yok
            </p>
          ) : (
            <div className="space-y-0">
              {[...(shipment.events || [])].reverse().map((event, i, arr) => (
                <div key={event.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                        i === 0
                          ? "bg-blue-500 ring-2 ring-blue-200"
                          : "bg-gray-300"
                      }`}
                    />
                    {i < arr.length - 1 && (
                      <div className="w-px bg-gray-200 flex-1 my-1" />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium text-gray-900">
                      {STATUS_LABELS[event.status]}
                    </p>
                    {event.note && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {event.note}
                      </p>
                    )}
                    {event.location && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDateTime(event.createdAt)} · {event.createdByName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
