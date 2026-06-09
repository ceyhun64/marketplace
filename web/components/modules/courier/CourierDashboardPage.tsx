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
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCardSkeleton } from "@/components/ui/stat-card-skeleton";
import { Empty, EmptyMedia, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";


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

// -- Main Component ----------------------------------------------------------

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

  // eslint-disable-next-line react-hooks/purity
  const todayStr = new Date().toDateString();
  const todayDelivered =
    profile?.stats?.todayDelivered ??
    shipments.filter((s: any) => {
      if (s.status !== "DELIVERED") return false;
      const updated = s.actualDeliveredAt ?? s.updatedAt;
      if (!updated) return false;
      return new Date(updated).toDateString() === todayStr;
    }).length;

  const handleToggleAvailability = async () => {
    try {
      await toggleAvailability.mutateAsync();
      toast.success(
        profile?.isAvailable
          ? "You are now offline"
          : "You are now online",
      );
    } catch {
      toast.error("Failed to update status");
    }
  };

  const stats = [
    {
      label: "Active",
      value: active.length,
      icon: Truck,
      text: "text-(--info)",
      bg: "bg-(--info-bg)",
    },
    {
      label: "Pending Pickup",
      value: pending.length,
      icon: Clock,
      text: "text-(--warning)",
      bg: "bg-(--warning-bg)",
    },
    {
      label: "In Transit",
      value: inTransit.length,
      icon: Package,
      text: "text-(--info)",
      bg: "bg-(--info-bg)",
    },
    {
      label: "Delivered Today",
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
              `Hi, ${profile?.fullName?.split(" ")[0] ?? "Courier"}`
            )}
          </h1>
          <p className="text-sm text-(--text-tertiary) mt-1">
            Your delivery dashboard and active tasks
          </p>
        </div>

        {!profileLoading && profile && (
          <button
            onClick={handleToggleAvailability}
            disabled={toggleAvailability.isPending}
            aria-pressed={profile.isAvailable}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all min-w-32.5 justify-center ${
              profile.isAvailable
                ? "bg-(--success-bg) border-(--success-border) text-(--success)"
                : "bg-(--off-white-2) border-(--border-mid) text-(--text-secondary)"
            }`}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {profile.isAvailable ? (
              <>
                <ToggleRight className="w-4 h-4" />
                Online
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4" />
                Offline
              </>
            )}
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
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
            Active Tasks
            <span className="ml-2 text-sm font-normal text-(--text-tertiary)">
              ({active.length} packages)
            </span>
          </p>
          <Link
            href="/courier/shipments"
            className="text-xs text-(--text-secondary) hover:text-(--text-primary) font-semibold flex items-center gap-1 transition-colors"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="divide-y divide-(--border-subtle)">
            {[1, 2, 3].map((i) => (
              <ShipmentCardSkeleton key={i} />
            ))}
          </div>
        ) : active.length === 0 ? (
          <Empty>
            <EmptyMedia variant="icon"><Package className="w-5 h-5" /></EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No active tasks</EmptyTitle>
              <EmptyDescription>New tasks will appear here</EmptyDescription>
            </EmptyHeader>
          </Empty>
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
                  <StatusBadge type="shipment" status={s.status} />
                </div>

                {/* Customer & Address */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-sm text-(--text-primary) font-medium">
                    <Package className="w-3.5 h-3.5 text-(--text-tertiary) shrink-0" />
                    {s.customerName}
                  </div>
                  <div className="flex items-start gap-2 text-xs text-(--text-secondary)">
                    <MapPin className="w-3.5 h-3.5 text-(--text-tertiary) shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{s.customerAddress}</span>
                  </div>
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
                      {confirmPickup.isPending ? "..." : "Package Picked Up ✓"}
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
                      {confirmDelivery.isPending ? "..." : "Delivered ✓"}
                    </Button>
                  )}
                  <Link
                    href={`/courier/shipments/${s.id}`}
                    className="flex items-center justify-center h-11 px-4 rounded-xl border border-(--border-mid) text-(--text-secondary) hover:bg-(--bg-sunken) transition-colors text-sm font-medium shrink-0"
                  >
                    Details
                  </Link>
                </div>
              </div>
            ))}
            {active.length > 8 && (
              <Link
                href="/courier/shipments"
                className="block px-5 py-3 text-center text-xs font-semibold text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-sunken) transition-colors"
              >
                +{active.length - 8} more active task
                {active.length - 8 === 1 ? "" : "s"} — view all
              </Link>
            )}
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
                All Tasks
              </p>
              <p className="text-xs text-(--text-tertiary)">
                {shipments.length} total
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
                My Earnings
              </p>
              <p className="text-xs text-(--text-tertiary)">History & total</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
