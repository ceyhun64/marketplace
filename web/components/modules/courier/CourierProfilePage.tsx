"use client";

import {
  useMyCourierProfile,
  useToggleCourierAvailability,
} from "@/queries/useCouriers";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Truck,
  User,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Package,
  Calendar,
  ToggleLeft,
  ToggleRight,
  MapPin,
  WifiOff,
} from "lucide-react";

export default function CourierProfilePage() {
  const { data: profile, isLoading } = useMyCourierProfile();
  const toggleAvailability = useToggleCourierAvailability();

  const handleToggle = async () => {
    try {
      await toggleAvailability.mutateAsync();
      toast.success(
        profile?.isAvailable
          ? "You are now offline"
          : "You are now online",
      );
    } catch {
      toast.error("Status could not be updated");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <User className="w-12 h-12 mx-auto mb-3 text-(--text-tertiary) opacity-30" />
        <p className="text-(--text-secondary) text-sm">
          Profile information could not be loaded
        </p>
      </div>
    );
  }

  const memberSince = new Date(profile.createdAt).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const lastLocationTime = profile.lastLocationUpdate
    ? new Date(profile.lastLocationUpdate).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-(--text-primary)">
          My Profile
        </h1>
        <p className="text-sm text-(--text-tertiary) mt-1">
          Your courier details and availability status
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-(--bg-surface) rounded-2xl border border-(--border-light) overflow-hidden">
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{ background: "var(--charcoal)" }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shrink-0"
              style={{ background: "var(--red)" }}
            >
              {profile.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg leading-none">
                {profile.fullName}
              </h2>
              <p className="text-white/50 text-xs mt-1">Courier</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <button
              onClick={handleToggle}
              disabled={toggleAvailability.isPending}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 min-h-[44px] ${
                profile.isAvailable
                  ? "bg-(--success) text-white"
                  : "bg-white/10 text-white/60 hover:bg-white/20"
              }`}
              style={
                profile.isAvailable ? { backgroundColor: "var(--success)" } : {}
              }
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
            <span className="text-[10px] text-white/30">
              {toggleAvailability.isPending
                ? "Updating..."
                : "Toggle status"}
            </span>
          </div>
        </div>

        <div className="divide-y divide-(--border-subtle) px-6">
          {[
            { icon: Mail, label: "Email", value: profile.email },
            { icon: Phone, label: "Phone", value: profile.phone ?? "—" },
            {
              icon: Truck,
              label: "Vehicle Type",
              value:
                profile.vehicleType === "Motorcycle"
                  ? "🏍️ Motorcycle"
                  : profile.vehicleType === "Car"
                    ? "🚗 Car"
                    : profile.vehicleType === "Bicycle"
                      ? "🚲 Bicycle"
                      : profile.vehicleType,
            },
            { icon: Truck, label: "Plate", value: profile.plateNumber ?? "—" },
            { icon: Calendar, label: "Member Since", value: memberSince },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3 py-3.5">
              <row.icon className="w-4 h-4 text-(--text-tertiary) shrink-0" />
              <span className="text-sm text-(--text-secondary) w-32 shrink-0">
                {row.label}
              </span>
              <span className="text-sm font-medium text-(--text-primary)">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Delivered Today",
            value: profile.stats.todayDelivered,
            text: "text-(--success)",
            bg: "bg-(--success-bg)",
            icon: CheckCircle2,
          },
          {
            label: "Active Shipments",
            value: profile.stats.totalActive,
            text: "text-(--info)",
            bg: "bg-(--info-bg)",
            icon: Package,
          },
          {
            label: "Total Deliveries",
            value: profile.stats.totalDelivered,
            text: "text-(--text-primary)",
            bg: "bg-(--off-white-2)",
            icon: Truck,
          },
        ].map((s) => (
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
            <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Location */}
      <div className="bg-(--bg-surface) rounded-2xl border border-(--border-light) p-5">
        <h3 className="text-sm font-semibold text-(--text-primary) mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-(--text-tertiary)" />
          Location
        </h3>
        {profile.currentLatitude && profile.currentLongitude ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full bg-(--success) animate-pulse"
                style={{ backgroundColor: "var(--success)" }}
              />
              <span
                className="text-sm text-(--success) font-medium"
                style={{ color: "var(--success)" }}
              >
                Location active
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs text-(--text-secondary)">
              <div>
                <span className="text-(--text-tertiary)">Latitude</span>
                <p className="font-mono font-medium text-(--text-primary) mt-0.5">
                  {profile.currentLatitude.toFixed(6)}
                </p>
              </div>
              <div>
                <span className="text-(--text-tertiary)">Longitude</span>
                <p className="font-mono font-medium text-(--text-primary) mt-0.5">
                  {profile.currentLongitude.toFixed(6)}
                </p>
              </div>
            </div>
            {lastLocationTime && (
              <p className="text-xs text-(--text-tertiary)">
                Last updated: {lastLocationTime}
              </p>
            )}
            <a
              href={`https://maps.google.com/?q=${profile.currentLatitude},${profile.currentLongitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-(--info) hover:underline font-medium"
            >
              <MapPin className="w-3.5 h-3.5" />
              Open in Google Maps
            </a>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-(--text-tertiary)">
            <WifiOff className="w-4 h-4" />
            <p className="text-sm">
              No location data — start location broadcast from the shipment detail page
            </p>
          </div>
        )}
      </div>

      {/* Account Status */}
      <div
        className={`rounded-xl p-4 flex items-center gap-3 ${profile.isActive ? "bg-(--success-bg) border border-(--success-border)" : "bg-(--danger-bg) border border-(--danger-border)"}`}
      >
        {profile.isActive ? (
          <CheckCircle2
            className="w-5 h-5 shrink-0"
            style={{ color: "var(--success)" }}
          />
        ) : (
          <XCircle className="w-5 h-5 text-(--danger) shrink-0" />
        )}
        <div>
          <p
            className="text-sm font-semibold"
            style={{
              color: profile.isActive ? "var(--success)" : "var(--danger)",
            }}
          >
            Account {profile.isActive ? "Active" : "Inactive"}
          </p>
          <p className="text-xs mt-0.5 text-(--text-secondary)">
            {profile.isActive
              ? "Your account is active and you can receive new assignments."
              : "Your account is inactive. Please contact an administrator."}
          </p>
        </div>
      </div>
    </div>
  );
}
