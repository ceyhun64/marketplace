"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import api from "@/lib/api";
import { useMyCourierProfile } from "@/queries/useCouriers";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  Package,
  CheckCircle2,
  Wallet,
  Clock,
  ArrowDownCircle,
  Calendar,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface CourierEarningsSummary {
  totalEarnings: number;
  pendingPayout: number;
  withdrawnTotal: number;
  totalDeliveries: number;
  thisMonthEarnings: number;
  thisWeekDeliveries: number;
}

interface DeliveryRecord {
  id: string;
  trackingNumber: string;
  customerName: string;
  deliveredAt: string;
  deliveryFee: number;
  tip?: number;
  orderNumber: string;
}

// ── Formatters ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Skeleton Components ────────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-5">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-7 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-3 w-16 mt-1.5" />
    </div>
  );
}

function DeliveryRowSkeleton() {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="space-y-1.5">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="text-right space-y-1">
        <Skeleton className="h-4 w-16 ml-auto" />
        <Skeleton className="h-3 w-12 ml-auto" />
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function CourierEarningsPage() {
  const { data: profile, isLoading: profileLoading } = useMyCourierProfile();

  const { data: earnings, isLoading: earningsLoading } =
    useQuery<CourierEarningsSummary>({
      queryKey: ["courier-earnings-summary"],
      queryFn: async () => {
        try {
          const { data } = await api.get("/api/couriers/me/earnings");
          return data;
        } catch {
          // Fallback to derived data from profile stats if endpoint not ready
          return {
            totalEarnings: 0,
            pendingPayout: 0,
            withdrawnTotal: 0,
            totalDeliveries: profile?.stats?.totalDelivered ?? 0,
            thisMonthEarnings: 0,
            thisWeekDeliveries: profile?.stats?.todayDelivered ?? 0,
          } as CourierEarningsSummary;
        }
      },
      enabled: !profileLoading,
    });

  const { data: deliveryHistory, isLoading: historyLoading } = useQuery<
    DeliveryRecord[]
  >({
    queryKey: ["courier-delivery-history"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/api/couriers/me/deliveries?limit=50");
        return Array.isArray(data) ? data : (data?.items ?? data?.data ?? []);
      } catch {
        return [];
      }
    },
  });

  const isLoading = earningsLoading || profileLoading;
  const records: DeliveryRecord[] = deliveryHistory ?? [];

  // Compute weekly total from history as fallback
  const weeklyEarnings = records
    .filter((r) => {
      const d = new Date(r.deliveredAt);
      const now = new Date();
      const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    })
    .reduce((sum, r) => sum + r.deliveryFee + (r.tip ?? 0), 0);

  const summaryCards = useMemo(() => [
    {
      label: "Toplam Kazanç",
      value: isLoading ? null : formatCurrency(earnings?.totalEarnings ?? 0),
      sub: "Tüm zamanlar",
      icon: TrendingUp,
      text: "text-(--success)",
      bg: "bg-(--success-bg)",
    },
    {
      label: "Bu Ay",
      value: isLoading
        ? null
        : formatCurrency(earnings?.thisMonthEarnings ?? 0),
      sub: "Cari ay",
      icon: Calendar,
      text: "text-(--info)",
      bg: "bg-(--info-bg)",
    },
    {
      label: "Bekleyen Ödeme",
      value: isLoading ? null : formatCurrency(earnings?.pendingPayout ?? 0),
      sub: "Ödeme bekleniyor",
      icon: Clock,
      text: "text-(--warning)",
      bg: "bg-(--warning-bg)",
    },
    {
      label: "Çekilen Toplam",
      value: isLoading ? null : formatCurrency(earnings?.withdrawnTotal ?? 0),
      sub: "Hesabınıza aktarıldı",
      icon: ArrowDownCircle,
      text: "text-(--text-secondary)",
      bg: "bg-(--off-white-2)",
    },
    {
      label: "Toplam Teslimat",
      value: isLoading
        ? null
        : String(
            earnings?.totalDeliveries ?? profile?.stats?.totalDelivered ?? 0,
          ),
      sub: "Tamamlanan sipariş",
      icon: CheckCircle2,
      text: "text-(--success)",
      bg: "bg-(--success-bg)",
    },
    {
      label: "Bu Hafta Teslimat",
      value: isLoading
        ? null
        : String(
            earnings?.thisWeekDeliveries ??
              records.filter((r) => {
                const d = new Date(r.deliveredAt);
                // eslint-disable-next-line react-hooks/purity
                return (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24) <= 7;
              }).length,
          ),
      sub: "Son 7 gün",
      icon: Package,
      text: "text-(--info)",
      bg: "bg-(--info-bg)",
    },
  ], [isLoading, earnings, profile, records]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-(--text-primary)">
          Kazançlarım
        </h1>
        <p className="text-sm text-(--text-tertiary) mt-1">
          Teslim ücretleri, bahşişler ve ödeme geçmişi
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))
          : summaryCards.map((card) => (
              <div
                key={card.label}
                className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-(--text-tertiary) font-medium uppercase tracking-wider">
                    {card.label}
                  </p>
                  <div className={`p-1.5 rounded-lg ${card.bg}`}>
                    <card.icon className={`w-4 h-4 ${card.text}`} />
                  </div>
                </div>
                <p className={`text-xl font-bold ${card.text}`}>{card.value}</p>
                <p className="text-xs text-(--text-tertiary) mt-1">
                  {card.sub}
                </p>
              </div>
            ))}
      </div>

      {/* Weekly earnings highlight */}
      {!isLoading && weeklyEarnings > 0 && (
        <div className="rounded-xl border border-(--success-border) bg-(--success-bg) px-5 py-4 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-(--bg-surface)/80">
            <Wallet className="w-5 h-5" style={{ color: "var(--success)" }} />
          </div>
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--success)" }}
            >
              Bu hafta {formatCurrency(weeklyEarnings)} kazandınız
            </p>
            <p className="text-xs text-(--text-secondary) mt-0.5">
              Teslimat ücretleri ve bahşişler dahil
            </p>
          </div>
        </div>
      )}

      {/* Delivery History */}
      <div className="bg-(--bg-surface) rounded-2xl border border-(--border-light) overflow-hidden">
        <div className="px-5 py-4 border-b border-(--border-light)">
          <h2 className="text-sm font-semibold text-(--text-primary)">
            Teslimat Geçmişi
          </h2>
          <p className="text-xs text-(--text-tertiary) mt-0.5">
            Son {records.length} teslimatlı sipariş
          </p>
        </div>

        {historyLoading ? (
          <div className="divide-y divide-(--border-subtle)">
            {Array.from({ length: 6 }).map((_, i) => (
              <DeliveryRowSkeleton key={i} />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-10 h-10 text-(--text-tertiary) opacity-20 mx-auto mb-3" />
            <p className="text-sm text-(--text-secondary) font-medium">
              Teslimat geçmişi yok
            </p>
            <p className="text-xs text-(--text-tertiary) mt-1">
              Tamamlanan teslimatlar burada görünecek
            </p>
          </div>
        ) : (
          <div className="divide-y divide-(--border-subtle)">
            {records.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between px-5 py-4 hover:bg-(--bg-sunken) transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2
                      className="w-3.5 h-3.5 shrink-0"
                      style={{ color: "var(--success)" }}
                    />
                    <span className="font-mono text-xs font-bold text-(--text-primary)">
                      #{record.orderNumber ?? record.trackingNumber?.slice(-8)}
                    </span>
                  </div>
                  <p className="text-sm text-(--text-secondary) font-medium truncate max-w-[200px]">
                    {record.customerName}
                  </p>
                  <p className="text-xs text-(--text-tertiary) mt-0.5">
                    {formatDate(record.deliveredAt)}
                  </p>
                </div>

                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-bold text-(--text-primary)">
                    {formatCurrency(record.deliveryFee + (record.tip ?? 0))}
                  </p>
                  {record.tip && record.tip > 0 && (
                    <p
                      className="text-xs text-(--success) font-medium"
                      style={{ color: "var(--success)" }}
                    >
                      +{formatCurrency(record.tip)} bahşiş
                    </p>
                  )}
                  <p className="text-xs text-(--text-tertiary)">
                    Ücret: {formatCurrency(record.deliveryFee)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
