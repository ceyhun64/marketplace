"use client";

import Link from "next/link";
import {
  Package,
  CheckCircle2,
  Clock,
  Truck,
  ToggleRight,
  ToggleLeft,
  MapPin,
  Phone,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import {
  useMyCourierShipments,
  useConfirmPickup,
  useConfirmDelivery,
  useMyCourierProfile,
  useToggleCourierAvailability,
} from "@/queries/useCouriers";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

// ── Status helpers ──────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  COURIER_ASSIGNED: "Teslim Alınacak",
  PICKED_UP: "Alındı",
  IN_TRANSIT: "Yolda",
  OUT_FOR_DELIVERY: "Dağıtımda",
  DELIVERED: "Teslim Edildi",
  FAILED: "Başarısız",
};

const STATUS_TOKENS: Record<
  string,
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

function StatusPill({ status }: { status: string }) {
  const t = STATUS_TOKENS[status] ?? {
    text: "text-(--text-secondary)",
    bg: "bg-(--off-white-2)",
    border: "border-(--border-light)",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${t.text} ${t.bg} ${t.border}`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function StatSkeleton() {
  return (
    <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-5">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-7 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-12" />
    </div>
  );
}

function ShipmentCardSkeleton() {
  return (
    <div className="p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
      <Skeleton className="h-3.5 w-48" />
      <Skeleton className="h-3 w-36" />
      <Skeleton className="h-11 w-full rounded-xl" />
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function CourierDashboardPage() {
  const { data: shipments = [], isLoading } = useMyCourierShipments();
  const { data: profile, isLoading: profileLoading } = useMyCourierProfile();
  const toggleAvailability = useToggleCourierAvailability();
  const confirmPickup = useConfirmPickup();
  const confirmDelivery = useConfirmDelivery();

  const active = shipments.filter(
    (s: any) => s.status !== "DELIVERED" && s.status !== "FAILED",
  );
  const inTransit = shipments.filter((s: any) =>
    ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(s.status),
  );
  const pending = shipments.filter((s: any) => s.status === "COURIER_ASSIGNED");

  const todayDelivered =
    profile?.stats?.todayDelivered ??
    shipments.filter((s: any) => {
      if (s.status !== "DELIVERED") return false;
      const updated = s.actualDeliveredAt ?? s.updatedAt;
      if (!updated) return false;
      return new Date(updated).toDateString() === new Date().toDateString();
    }).length;

  const handleToggleAvailability = async () => {
    try {
      await toggleAvailability.mutateAsync();
      toast.success(
        profile?.isAvailable
          ? "Çevrimdışı olarak işaretlendiniz"
          : "Çevrimiçi olarak işaretlendiniz",
      );
    } catch {
      toast.error("Durum güncellenemedi");
    }
  };

  const stats = [
    {
      label: "Aktif",
      value: active.length,
      icon: Truck,
      text: "text-(--info)",
      bg: "bg-(--info-bg)",
    },
    {
      label: "Teslim Bekliyor",
      value: pending.length,
      icon: Clock,
      text: "text-(--warning)",
      bg: "bg-(--warning-bg)",
    },
    {
      label: "Yolda",
      value: inTransit.length,
      icon: Package,
      text: "text-(--info)",
      bg: "bg-(--info-bg)",
    },
    {
      label: "Bugün Teslim",
      value: todayDelivered,
      icon: CheckCircle2,
      text: "text-(--success)",
      bg: "bg-(--success-bg)",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header + Availability Toggle */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-(--text-primary)">
            {profileLoading ? (
              <Skeleton className="h-7 w-40" />
            ) : (
              `Merhaba, ${profile?.fullName?.split(" ")[0] ?? "Kurye"} 👋`
            )}
          </h1>
          <p className="text-sm text-(--text-tertiary) mt-1">
            Teslimat panonuz ve aktif görevleriniz
          </p>
        </div>

        {!profileLoading && profile && (
          <button
            onClick={handleToggleAvailability}
            disabled={toggleAvailability.isPending}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all min-w-[130px] justify-center ${
              profile.isAvailable
                ? "bg-(--success-bg) border-(--success-border) text-(--success)"
                : "bg-(--off-white-2) border-(--border-mid) text-(--text-secondary)"
            }`}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {profile.isAvailable ? (
              <>
                <ToggleRight className="w-4 h-4" />
                Çevrimiçi
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4" />
                Çevrimdışı
              </>
            )}
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          : stats.map((s) => (
              <div
                key={s.label}
                className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-(--text-tertiary) font-medium uppercase tracking-wider">
                    {s.label}
                  </p>
                  <div className={`p-1.5 rounded-lg ${s.bg}`}>
                    <s.icon className={`w-4 h-4 ${s.text}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-(--text-primary)">
                  {s.value}
                </p>
              </div>
            ))}
      </div>

      {/* Active Shipments */}
      <div className="bg-(--bg-surface) rounded-2xl border border-(--border-light) overflow-hidden">
        <div className="px-5 py-4 border-b border-(--border-light) flex items-center justify-between">
          <p className="text-sm font-semibold text-(--text-primary)">
            Aktif Görevler
            <span className="ml-2 text-sm font-normal text-(--text-tertiary)">
              ({active.length} paket)
            </span>
          </p>
          <Link
            href="/courier/shipments"
            className="text-xs text-(--text-secondary) hover:text-(--text-primary) font-semibold flex items-center gap-1 transition-colors"
          >
            Tümünü Gör <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="divide-y divide-(--border-subtle)">
            {[1, 2, 3].map((i) => (
              <ShipmentCardSkeleton key={i} />
            ))}
          </div>
        ) : active.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-10 h-10 text-(--text-tertiary) opacity-20 mx-auto mb-3" />
            <p className="text-sm text-(--text-secondary) font-medium">
              Aktif görev bulunmuyor
            </p>
            <p className="text-xs text-(--text-tertiary) mt-1">
              Yeni görevler burada görünecek
            </p>
          </div>
        ) : (
          <div className="divide-y divide-(--border-subtle)">
            {active.slice(0, 8).map((s: any) => (
              <div key={s.id} className="p-5">
                {/* Tracking + Status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-(--text-primary)">
                      {s.trackingNumber}
                    </span>
                    {s.shippingRate === "EXPRESS" && (
                      <span className="text-[10px] font-bold text-(--danger) bg-(--danger-bg) border border-(--danger-border) px-1.5 py-0.5 rounded-md">
                        EXPRESS
                      </span>
                    )}
                  </div>
                  <StatusPill status={s.status} />
                </div>

                {/* Customer & Address */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-sm text-(--text-primary) font-medium">
                    <Package className="w-3.5 h-3.5 text-(--text-tertiary) shrink-0" />
                    {s.customerName}
                  </div>
                  <div className="flex items-start gap-2 text-xs text-(--text-secondary)">
                    <MapPin className="w-3.5 h-3.5 text-(--text-tertiary) shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{s.deliveryAddress}</span>
                  </div>
                  {s.customerPhone && (
                    <a
                      href={`tel:${s.customerPhone}`}
                      className="flex items-center gap-2 text-xs text-(--info) font-medium w-fit"
                      style={{ WebkitTapHighlightColor: "transparent" }}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {s.customerPhone}
                    </a>
                  )}
                </div>

                {/* Action buttons — large 44px touch targets */}
                <div className="flex gap-2">
                  {s.status === "COURIER_ASSIGNED" && (
                    <Button
                      onClick={() => confirmPickup.mutate(s.id)}
                      disabled={confirmPickup.isPending}
                      className="flex-1 h-11 text-sm font-semibold bg-(--charcoal) hover:bg-(--charcoal-2) text-white rounded-xl"
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      {confirmPickup.isPending ? "..." : "Paketi Aldım ✓"}
                    </Button>
                  )}
                  {(s.status === "PICKED_UP" ||
                    s.status === "IN_TRANSIT" ||
                    s.status === "OUT_FOR_DELIVERY") && (
                    <Button
                      onClick={() => confirmDelivery.mutate(s.id)}
                      disabled={confirmDelivery.isPending}
                      className="flex-1 h-11 text-sm font-semibold text-white rounded-xl"
                      style={{ backgroundColor: "var(--success)" }}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {confirmDelivery.isPending ? "..." : "Teslim Ettim ✓"}
                    </Button>
                  )}
                  <Link
                    href={`/courier/shipments/${s.id}`}
                    className="flex items-center justify-center h-11 px-4 rounded-xl border border-(--border-mid) text-(--text-secondary) hover:bg-(--bg-sunken) transition-colors text-sm font-medium shrink-0"
                  >
                    Detay
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Nav */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/courier/shipments">
          <div className="bg-(--bg-surface) rounded-2xl border border-(--border-light) p-5 hover:border-(--border-mid) hover:shadow-sm transition-all cursor-pointer flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-(--info-bg)">
              <Package className="w-5 h-5 text-(--info)" />
            </div>
            <div>
              <p className="text-sm font-semibold text-(--text-primary)">
                Tüm Görevler
              </p>
              <p className="text-xs text-(--text-tertiary)">
                {shipments.length} toplam
              </p>
            </div>
          </div>
        </Link>
        <Link href="/courier/earnings">
          <div className="bg-(--bg-surface) rounded-2xl border border-(--border-light) p-5 hover:border-(--border-mid) hover:shadow-sm transition-all cursor-pointer flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-(--success-bg)">
              <TrendingUp className="w-5 h-5 text-(--success)" />
            </div>
            <div>
              <p className="text-sm font-semibold text-(--text-primary)">
                Kazançlarım
              </p>
              <p className="text-xs text-(--text-tertiary)">Geçmiş & toplam</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
