"use client";

import { useMyCourierProfile, useToggleCourierAvailability } from "@/queries/useCouriers";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Truck,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  Package,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Wifi,
  WifiOff,
  Car,
  Bike,
} from "lucide-react";

function VehicleIcon({ type }: { type: string }) {
  const t = type?.toLowerCase();
  if (t === "car") return <Car className="w-5 h-5" />;
  if (t === "bicycle") return <Bike className="w-5 h-5" />;
  return <Truck className="w-5 h-5" />;
}

export default function CourierProfilePage() {
  const { data: profile, isLoading } = useMyCourierProfile();
  const toggleAvailability = useToggleCourierAvailability();

  const handleToggle = async () => {
    try {
      await toggleAvailability.mutateAsync();
      toast.success(
        profile?.isAvailable
          ? "Çevrimdışı olarak işaretlendiniz"
          : "Çevrimiçi olarak işaretlendiniz"
      );
    } catch {
      toast.error("Durum güncellenemedi");
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
        <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500 text-sm">Profil bilgisi yüklenemedi</p>
      </div>
    );
  }

  const memberSince = new Date(profile.createdAt).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const lastLocationTime = profile.lastLocationUpdate
    ? new Date(profile.lastLocationUpdate).toLocaleString("tr-TR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Profilim</h1>
        <p className="text-sm text-gray-500 mt-1">
          Kurye bilgileriniz ve müsaitlik durumunuz
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{ background: "var(--charcoal)" }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
              style={{ background: "var(--red)" }}
            >
              {profile.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg leading-none">
                {profile.fullName}
              </h2>
              <p className="text-white/50 text-xs mt-1">Kurye</p>
            </div>
          </div>

          {/* Availability Toggle */}
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={handleToggle}
              disabled={toggleAvailability.isPending}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 ${
                profile.isAvailable
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "bg-white/10 text-white/60 hover:bg-white/20"
              }`}
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
            <span className="text-[10px] text-white/30">
              {toggleAvailability.isPending ? "Güncelleniyor..." : "Durumu değiştir"}
            </span>
          </div>
        </div>

        {/* Info rows */}
        <div className="divide-y divide-gray-50 px-6">
          {[
            { icon: Mail, label: "E-posta", value: profile.email },
            { icon: Phone, label: "Telefon", value: profile.phone ?? "—" },
            {
              icon: VehicleIcon,
              label: "Araç Tipi",
              value: profile.vehicleType === "Motorcycle"
                ? "🏍️ Motosiklet"
                : profile.vehicleType === "Car"
                ? "🚗 Otomobil"
                : profile.vehicleType === "Bicycle"
                ? "🚲 Bisiklet"
                : profile.vehicleType,
            },
            {
              icon: Truck,
              label: "Plaka",
              value: profile.plateNumber ?? "—",
            },
            { icon: Calendar, label: "Üyelik Tarihi", value: memberSince },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3 py-3.5">
              <row.icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-500 w-32 flex-shrink-0">
                {row.label}
              </span>
              <span className="text-sm font-medium text-gray-900">
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
            label: "Bugün Teslim",
            value: profile.stats.todayDelivered,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            icon: CheckCircle2,
          },
          {
            label: "Aktif Kargo",
            value: profile.stats.totalActive,
            color: "text-blue-600",
            bg: "bg-blue-50",
            icon: Package,
          },
          {
            label: "Toplam Teslimat",
            value: profile.stats.totalDelivered,
            color: "text-gray-700",
            bg: "bg-gray-100",
            icon: Truck,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-gray-100 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                {s.label}
              </p>
              <div className={`p-1.5 rounded-lg ${s.bg}`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Location Status */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          Konum Bilgisi
        </h3>
        {profile.currentLatitude && profile.currentLongitude ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm text-emerald-700 font-medium">
                Konum aktif
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
              <div>
                <span className="text-gray-400">Enlem</span>
                <p className="font-mono font-medium text-gray-700 mt-0.5">
                  {profile.currentLatitude.toFixed(6)}
                </p>
              </div>
              <div>
                <span className="text-gray-400">Boylam</span>
                <p className="font-mono font-medium text-gray-700 mt-0.5">
                  {profile.currentLongitude.toFixed(6)}
                </p>
              </div>
            </div>
            {lastLocationTime && (
              <p className="text-xs text-gray-400">
                Son güncelleme: {lastLocationTime}
              </p>
            )}
            <a
              href={`https://maps.google.com/?q=${profile.currentLatitude},${profile.currentLongitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-medium mt-1"
            >
              <MapPin className="w-3.5 h-3.5" />
              Google Maps'te aç
            </a>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-gray-400">
            <WifiOff className="w-4 h-4" />
            <p className="text-sm">
              Konum bilgisi yok — kargo detay sayfasından konum yayını başlatabilirsiniz
            </p>
          </div>
        )}
      </div>

      {/* Account Status */}
      <div
        className={`rounded-xl p-4 flex items-center gap-3 ${
          profile.isActive
            ? "bg-emerald-50 border border-emerald-100"
            : "bg-red-50 border border-red-100"
        }`}
      >
        {profile.isActive ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        )}
        <div>
          <p
            className={`text-sm font-semibold ${
              profile.isActive ? "text-emerald-700" : "text-red-700"
            }`}
          >
            Hesap {profile.isActive ? "Aktif" : "Pasif"}
          </p>
          <p
            className={`text-xs mt-0.5 ${
              profile.isActive ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {profile.isActive
              ? "Hesabınız aktif, yeni görevler alabilirsiniz."
              : "Hesabınız pasif durumda. Admin ile iletişime geçin."}
          </p>
        </div>
      </div>
    </div>
  );
}
