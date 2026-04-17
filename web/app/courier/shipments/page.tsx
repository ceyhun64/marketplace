"use client";

import { useState } from "react";
import { useCourierShipments, usePickupConfirm, useDelivered } from "@/queries/useTracking";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  Truck,
  Search,
  ExternalLink,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ShipmentStatus =
  | "COURIER_ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED";

interface Shipment {
  id: string;
  trackingNumber: string;
  status: ShipmentStatus;
  customerName: string;
  customerPhone?: string;
  deliveryAddress: string;
  merchantStoreName: string;
  merchantAddress: string;
  estimatedDelivery: string;
  labelUrl?: string;
  productSummary: string;
  orderNumber: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<ShipmentStatus, string> = {
  COURIER_ASSIGNED:   "Atandı — Teslim Alınmayı Bekliyor",
  PICKED_UP:          "Teslim Alındı",
  IN_TRANSIT:         "Yolda",
  OUT_FOR_DELIVERY:   "Dağıtımda",
  DELIVERED:          "Teslim Edildi",
  FAILED:             "Teslim Başarısız",
};

const STATUS_COLOR: Record<ShipmentStatus, string> = {
  COURIER_ASSIGNED:   "bg-blue-100 text-blue-800",
  PICKED_UP:          "bg-indigo-100 text-indigo-800",
  IN_TRANSIT:         "bg-yellow-100 text-yellow-800",
  OUT_FOR_DELIVERY:   "bg-orange-100 text-orange-800",
  DELIVERED:          "bg-green-100 text-green-800",
  FAILED:             "bg-red-100 text-red-800",
};

function StatusBadge({ status }: { status: ShipmentStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLOR[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function ETAText({ dateStr }: { dateStr: string }) {
  const eta = new Date(dateStr);
  const now = new Date();
  const diffMs = eta.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const isOverdue = diffMs < 0;

  return (
    <span className={`flex items-center gap-1 text-xs ${isOverdue ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
      {isOverdue && <AlertCircle className="h-3.5 w-3.5" />}
      <Clock className="h-3.5 w-3.5" />
      {isOverdue
        ? `${Math.abs(diffHours)} saat gecikti`
        : diffHours < 1
        ? "1 saatten az kaldı"
        : `${diffHours} saat kaldı`}{" "}
      · {eta.toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
    </span>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────

function ActionDialog({
  open,
  onOpenChange,
  shipment,
  action,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  shipment: Shipment | null;
  action: "pickup" | "delivered";
}) {
  const [recipientName, setRecipientName] = useState("");
  const pickupConfirm = usePickupConfirm();
  const delivered = useDelivered();

  if (!shipment) return null;

  const isPending = pickupConfirm.isPending || delivered.isPending;

  const handleConfirm = async () => {
    try {
      if (action === "pickup") {
        await pickupConfirm.mutateAsync({ id: shipment.id });
        toast.success("Kargo teslim alındı olarak işaretlendi.");
      } else {
        await delivered.mutateAsync({ id: shipment.id, recipientName: recipientName || undefined });
        toast.success("Kargo teslim edildi olarak işaretlendi.");
      }
      onOpenChange(false);
    } catch {
      toast.error("İşlem başarısız. Lütfen tekrar deneyin.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {action === "pickup" ? "Kargo Teslim Alındı mı?" : "Teslimat Onayı"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium">{shipment.customerName}</p>
            <p className="mt-1 text-muted-foreground">{shipment.deliveryAddress}</p>
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              {shipment.trackingNumber}
            </p>
          </div>

          {action === "delivered" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Teslim Alan Kişi (opsiyonel)</label>
              <Input
                placeholder="Ad soyad..."
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending ? "İşleniyor..." : "Onayla"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CourierShipmentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "delivered" | "all">("active");
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    shipment: Shipment | null;
    action: "pickup" | "delivered";
  }>({ open: false, shipment: null, action: "pickup" });

  const { data, isLoading } = useCourierShipments(statusFilter);
  const shipments: Shipment[] = data ?? [];

  const filtered = shipments.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.trackingNumber.toLowerCase().includes(q) ||
      s.customerName.toLowerCase().includes(q) ||
      s.deliveryAddress.toLowerCase().includes(q)
    );
  });

  const activeCount = shipments.filter(
    (s) => s.status !== "DELIVERED" && s.status !== "FAILED"
  ).length;

  const openAction = (shipment: Shipment, action: "pickup" | "delivered") =>
    setDialogState({ open: true, shipment, action });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Sevkiyatlarım</h1>
        <p className="text-sm text-muted-foreground">
          {activeCount > 0
            ? `${activeCount} aktif sevkiyat bekliyor`
            : "Tüm sevkiyatlar tamamlandı"}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Takip no, müşteri adı veya adres..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="delivered">Teslim Edildi</SelectItem>
            <SelectItem value="all">Tümü</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Shipment Cards */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <Package className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <p className="font-medium">Sevkiyat bulunamadı</p>
              <p className="mt-1 text-sm">
                {search ? "Arama kriterlerinizi değiştirin." : "Bu filtre için sevkiyat yok."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((shipment) => (
            <Card
              key={shipment.id}
              className={shipment.status === "FAILED" ? "border-red-200 bg-red-50/30" : ""}
            >
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  {/* Left info */}
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold">
                        {shipment.trackingNumber}
                      </span>
                      <StatusBadge status={shipment.status} />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-start gap-1.5 text-sm">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span>
                          <span className="font-medium">{shipment.customerName}</span>
                          {" — "}
                          <span className="text-muted-foreground">{shipment.deliveryAddress}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Package className="h-3.5 w-3.5 shrink-0" />
                        <span>{shipment.productSummary}</span>
                        <span className="text-xs">· {shipment.merchantStoreName}</span>
                      </div>
                      <ETAText dateStr={shipment.estimatedDelivery} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {shipment.labelUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(shipment.labelUrl, "_blank")}
                      >
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                        Etiket
                      </Button>
                    )}

                    {shipment.status === "COURIER_ASSIGNED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                        onClick={() => openAction(shipment, "pickup")}
                      >
                        <Truck className="mr-1.5 h-3.5 w-3.5" />
                        Teslim Aldım
                      </Button>
                    )}

                    {(shipment.status === "PICKED_UP" ||
                      shipment.status === "IN_TRANSIT" ||
                      shipment.status === "OUT_FOR_DELIVERY") && (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => openAction(shipment, "delivered")}
                      >
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        Teslim Ettim
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Confirm Dialog */}
      <ActionDialog
        open={dialogState.open}
        onOpenChange={(v) => setDialogState((s) => ({ ...s, open: v }))}
        shipment={dialogState.shipment}
        action={dialogState.action}
      />
    </div>
  );
}
