"use client";

import { useState } from "react";
import {
  useCourierShipments,
  usePickupConfirm,
  useDelivered,
} from "@/queries/useTracking";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
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
  Phone,
} from "lucide-react";
import Link from "next/link";

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
  COURIER_ASSIGNED: "Teslim Alınacak",
  PICKED_UP: "Alındı",
  IN_TRANSIT: "Yolda",
  OUT_FOR_DELIVERY: "Dağıtımda",
  DELIVERED: "Teslim Edildi",
  FAILED: "Başarısız",
};

const STATUS_TOKENS: Record<
  ShipmentStatus,
  { text: string; bg: string; border: string }
> = {
  COURIER_ASSIGNED: {
    text: "text-(--warning)",
    bg: "bg-(--warning-bg)",
    border: "border-(--warning-border)",
  },
  PICKED_UP: {
    text: "text-(--info)",
    bg: "bg-(--info-bg)",
    border: "border-(--info-border)",
  },
  IN_TRANSIT: {
    text: "text-(--info)",
    bg: "bg-(--info-bg)",
    border: "border-(--info-border)",
  },
  OUT_FOR_DELIVERY: {
    text: "text-(--danger)",
    bg: "bg-(--danger-bg)",
    border: "border-(--danger-border)",
  },
  DELIVERED: {
    text: "text-(--success)",
    bg: "bg-(--success-bg)",
    border: "border-(--success-border)",
  },
  FAILED: {
    text: "text-(--danger)",
    bg: "bg-(--danger-bg)",
    border: "border-(--danger-border)",
  },
};

function StatusPill({ status }: { status: ShipmentStatus }) {
  const t = STATUS_TOKENS[status] ?? {
    text: "text-(--text-secondary)",
    bg: "bg-(--off-white-2)",
    border: "border-(--border-light)",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${t.text} ${t.bg} ${t.border}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function ETAText({ dateStr }: { dateStr: string }) {
  const eta = new Date(dateStr);
  const diffMs = eta.getTime() - Date.now();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const isOverdue = diffMs < 0;

  return (
    <span
      className={`flex items-center gap-1 text-xs ${isOverdue ? "text-(--danger) font-semibold" : "text-(--text-tertiary)"}`}
    >
      {isOverdue && <AlertCircle className="h-3.5 w-3.5" />}
      <Clock className="h-3.5 w-3.5" />
      {isOverdue
        ? `${Math.abs(diffHours)} saat gecikti`
        : diffHours < 1
          ? "1 saatten az kaldı"
          : `${diffHours} saat kaldı`}{" "}
      ·{" "}
      {eta.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })}
    </span>
  );
}

// ── Confirm Dialog ─────────────────────────────────────────────────────────────

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
        toast.success("Paket alındı olarak işaretlendi.");
      } else {
        await delivered.mutateAsync({
          id: shipment.id,
          recipientName: recipientName || undefined,
        });
        toast.success("Paket teslim edildi olarak işaretlendi.");
      }
      onOpenChange(false);
    } catch {
      toast.error("İşlem başarısız. Tekrar deneyin.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {action === "pickup" ? "Paketi Aldığını Onayla" : "Teslim Onayı"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="rounded-xl bg-(--bg-sunken) border border-(--border-light) p-4 text-sm space-y-1">
            <p className="font-semibold text-(--text-primary)">
              {shipment.customerName}
            </p>
            <p className="text-(--text-secondary) text-xs leading-relaxed">
              {shipment.deliveryAddress}
            </p>
            <p className="font-mono text-xs text-(--text-tertiary)">
              {shipment.trackingNumber}
            </p>
          </div>
          {action === "delivered" && (
            <div className="space-y-1.5">
              <Label className="text-sm text-(--text-primary)">
                Teslim Alan Ad Soyad (isteğe bağlı)
              </Label>
              <Input
                placeholder="Ad Soyad..."
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="border-(--border-mid)"
              />
            </div>
          )}
        </div>
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            İptal
          </Button>
          <Button
            className="flex-1 h-11"
            onClick={handleConfirm}
            disabled={isPending}
            style={{ backgroundColor: "var(--charcoal)" }}
          >
            {isPending ? "İşleniyor..." : "Onayla"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Shipment Card Skeleton ─────────────────────────────────────────────────────

function ShipmentCardSkeleton() {
  return (
    <div className="bg-(--bg-surface) rounded-2xl border border-(--border-light) p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
      <Skeleton className="h-3.5 w-48" />
      <Skeleton className="h-3 w-36" />
      <div className="flex gap-2">
        <Skeleton className="h-11 flex-1 rounded-xl" />
        <Skeleton className="h-11 w-20 rounded-xl" />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CourierShipmentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "active" | "delivered" | "all"
  >("active");
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
    (s) => s.status !== "DELIVERED" && s.status !== "FAILED",
  ).length;

  const openAction = (shipment: Shipment, action: "pickup" | "delivered") =>
    setDialogState({ open: true, shipment, action });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-(--text-primary)">
          Sevkiyatlarım
        </h1>
        <p className="text-sm text-(--text-tertiary) mt-1">
          {activeCount > 0
            ? `${activeCount} aktif sevkiyat bekliyor`
            : "Tüm sevkiyatlar tamamlandı"}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--text-tertiary)" />
          <Input
            placeholder="Takip no, müşteri adı veya adres..."
            className="pl-9 border-(--border-mid) h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
        >
          <SelectTrigger className="w-36 h-11 border-(--border-mid) shrink-0">
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
            <ShipmentCardSkeleton key={i} />
          ))
        ) : filtered.length === 0 ? (
          <div className="bg-(--bg-surface) rounded-2xl border border-(--border-light) py-16 text-center">
            <Package className="mx-auto mb-3 h-10 w-10 text-(--text-tertiary) opacity-20" />
            <p className="text-sm font-medium text-(--text-secondary)">
              Sevkiyat bulunamadı
            </p>
            <p className="mt-1 text-xs text-(--text-tertiary)">
              {search
                ? "Arama kriterlerini değiştirmeyi deneyin."
                : "Bu filtre için sevkiyat yok."}
            </p>
          </div>
        ) : (
          filtered.map((shipment) => (
            <div
              key={shipment.id}
              className={`bg-(--bg-surface) rounded-2xl border overflow-hidden ${
                shipment.status === "FAILED"
                  ? "border-(--danger-border)"
                  : "border-(--border-light)"
              }`}
            >
              <div className="p-5">
                {/* Tracking + Status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="font-mono text-sm font-bold text-(--text-primary)">
                    {shipment.trackingNumber}
                  </span>
                  <StatusPill status={shipment.status} />
                </div>

                {/* Details */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-start gap-2 text-sm text-(--text-primary) font-medium">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-(--text-tertiary)" />
                    <span>
                      {shipment.customerName}
                      <span className="font-normal text-(--text-secondary)">
                        {" "}
                        — {shipment.deliveryAddress}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-(--text-tertiary)">
                    <Package className="h-3.5 w-3.5 shrink-0" />
                    {shipment.productSummary}
                    <span>· {shipment.merchantStoreName}</span>
                  </div>
                  {shipment.customerPhone && (
                    <a
                      href={`tel:${shipment.customerPhone}`}
                      className="flex items-center gap-1.5 text-xs text-(--info) font-medium w-fit"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {shipment.customerPhone}
                    </a>
                  )}
                  {shipment.estimatedDelivery && (
                    <ETAText dateStr={shipment.estimatedDelivery} />
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/courier/shipments/${shipment.id}`}
                    className="flex items-center gap-1.5 text-xs border border-(--border-mid) rounded-xl px-3 py-2.5 text-(--text-secondary) hover:bg-(--bg-sunken) transition-colors font-medium min-h-[44px]"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                    Detay
                  </Link>
                  {shipment.labelUrl && (
                    <button
                      onClick={() => window.open(shipment.labelUrl, "_blank")}
                      className="flex items-center gap-1.5 text-xs border border-(--border-mid) rounded-xl px-3 py-2.5 text-(--text-secondary) hover:bg-(--bg-sunken) transition-colors font-medium min-h-[44px]"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Etiket
                    </button>
                  )}
                  {shipment.status === "COURIER_ASSIGNED" && (
                    <Button
                      size="sm"
                      className="flex-1 h-11 text-sm font-semibold bg-(--charcoal) hover:bg-(--charcoal-2) text-white rounded-xl"
                      onClick={() => openAction(shipment, "pickup")}
                    >
                      <Truck className="mr-1.5 h-4 w-4" />
                      Paketi Aldım
                    </Button>
                  )}
                  {(shipment.status === "PICKED_UP" ||
                    shipment.status === "IN_TRANSIT" ||
                    shipment.status === "OUT_FOR_DELIVERY") && (
                    <Button
                      size="sm"
                      className="flex-1 h-11 text-sm font-semibold text-white rounded-xl"
                      style={{ backgroundColor: "var(--success)" }}
                      onClick={() => openAction(shipment, "delivered")}
                    >
                      <CheckCircle2 className="mr-1.5 h-4 w-4" />
                      Teslim Ettim
                    </Button>
                  )}
                  {shipment.status === "DELIVERED" && (
                    <span className="flex items-center gap-1.5 text-xs text-(--success) font-semibold">
                      <CheckCircle2 className="h-4 w-4" /> Teslim Edildi
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <ActionDialog
        open={dialogState.open}
        onOpenChange={(v) => setDialogState((s) => ({ ...s, open: v }))}
        shipment={dialogState.shipment}
        action={dialogState.action}
      />
    </div>
  );
}
