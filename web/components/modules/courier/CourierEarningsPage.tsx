"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import api from "@/lib/api";
import { useMyCourierProfile } from "@/queries/useCouriers";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCardSkeleton } from "@/components/ui/stat-card-skeleton";
import { Empty, EmptyMedia, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  TrendingUp,
  Package,
  CheckCircle2,
  Wallet,
  Clock,
  ArrowDownCircle,
  Calendar,
  AlertCircle,
} from "lucide-react";

// -- Types ----------------------------------------------------------------------

interface CourierEarningsSummary {
  totalEarnings: number;
  pendingPayout: number;
  withdrawnTotal: number;
  totalDeliveries: number;
  thisMonthEarnings: number;
  thisWeekDeliveries: number;
  isFallback?: boolean;
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

// -- Skeleton Components --------------------------------------------------------

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

// -- Main Component -------------------------------------------------------------

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
          // Endpoint not ready yet — fall back to whatever profile stats we have
          // and flag the summary as incomplete so the UI can warn the courier.
          return {
            totalEarnings: 0,
            pendingPayout: 0,
            withdrawnTotal: 0,
            totalDeliveries: profile?.stats?.totalDelivered ?? 0,
            thisMonthEarnings: 0,
            thisWeekDeliveries: profile?.stats?.todayDelivered ?? 0,
            isFallback: true,
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

  // Single shared "last 7 days" cutoff — reused for the weekly earnings
  // banner and the This Week stat fallback so the two never disagree.
  const thisWeekRecords = useMemo(
    () =>
      records.filter((r) => {
        const d = new Date(r.deliveredAt);
        // eslint-disable-next-line react-hooks/purity
        const diffDays = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays <= 7;
      }),
    [records],
  );

  const weeklyEarnings = thisWeekRecords.reduce(
    (sum, r) => sum + r.deliveryFee + (r.tip ?? 0),
    0,
  );

  const summaryCards = useMemo(() => [
    {
      label: "Total Earnings",
      value: isLoading ? null : formatCurrency(earnings?.totalEarnings ?? 0),
      sub: "All time",
      icon: TrendingUp,
      text: "text-(--success)",
      bg: "bg-(--success-bg)",
    },
    {
      label: "This Month",
      value: isLoading
        ? null
        : formatCurrency(earnings?.thisMonthEarnings ?? 0),
      sub: "Current month",
      icon: Calendar,
      text: "text-(--info)",
      bg: "bg-(--info-bg)",
    },
    {
      label: "Pending Payout",
      value: isLoading ? null : formatCurrency(earnings?.pendingPayout ?? 0),
      sub: "Awaiting payment",
      icon: Clock,
      text: "text-(--warning)",
      bg: "bg-(--warning-bg)",
    },
    {
      label: "Total Withdrawn",
      value: isLoading ? null : formatCurrency(earnings?.withdrawnTotal ?? 0),
      sub: "Transferred to account",
      icon: ArrowDownCircle,
      text: "text-(--text-secondary)",
      bg: "bg-(--off-white-2)",
    },
    {
      label: "Total Deliveries",
      value: isLoading
        ? null
        : String(
            earnings?.totalDeliveries ?? profile?.stats?.totalDelivered ?? 0,
          ),
      sub: "Completed orders",
      icon: CheckCircle2,
      text: "text-(--success)",
      bg: "bg-(--success-bg)",
    },
    {
      label: "This Week",
      value: isLoading
        ? null
        : String(earnings?.thisWeekDeliveries ?? thisWeekRecords.length),
      sub: "Last 7 days",
      icon: Package,
      text: "text-(--info)",
      bg: "bg-(--info-bg)",
    },
  ], [isLoading, earnings, profile, thisWeekRecords]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-(--text-primary)">
          My Earnings
        </h1>
        <p className="text-sm text-(--text-tertiary) mt-1">
          Delivery fees, tips and payment history
        </p>
        {!isLoading && earnings?.isFallback && (
          <p className="flex items-center gap-1.5 text-xs text-(--warning) mt-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            Earnings data is temporarily unavailable — figures below may be incomplete.
          </p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
              You earned {formatCurrency(weeklyEarnings)} this week
            </p>
            <p className="text-xs text-(--text-secondary) mt-0.5">
              Including delivery fees and tips
            </p>
          </div>
        </div>
      )}

      {/* Delivery History */}
      <div className="bg-(--bg-surface) rounded-2xl border border-(--border-light) overflow-hidden">
        <div className="px-5 py-4 border-b border-(--border-light)">
          <h2 className="text-sm font-semibold text-(--text-primary)">
            Delivery History
          </h2>
          <p className="text-xs text-(--text-tertiary) mt-0.5">
            {records.length >= 50
              ? `Showing your ${records.length} most recent deliveries`
              : `${records.length} completed ${records.length === 1 ? "delivery" : "deliveries"}`}
          </p>
        </div>

        {historyLoading ? (
          <div className="divide-y divide-(--border-subtle)">
            {Array.from({ length: 6 }).map((_, i) => (
              <DeliveryRowSkeleton key={i} />
            ))}
          </div>
        ) : records.length === 0 ? (
          <Empty>
            <EmptyMedia variant="icon"><Package className="w-5 h-5" /></EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No delivery history</EmptyTitle>
              <EmptyDescription>Completed deliveries will appear here</EmptyDescription>
            </EmptyHeader>
          </Empty>
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
                      #
                      {record.orderNumber ??
                        record.trackingNumber?.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <p
                    className="text-sm text-(--text-secondary) font-medium truncate max-w-50"
                    title={record.customerName}
                  >
                    {record.customerName}
                  </p>
                  <p className="text-xs text-(--text-tertiary) mt-0.5">
                    {formatDateTime(record.deliveredAt)}
                  </p>
                </div>

                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-bold text-(--text-primary)">
                    {formatCurrency(record.deliveryFee + (record.tip ?? 0))}
                  </p>
                  {record.tip && record.tip > 0 && (
                    <p className="text-xs text-(--success) font-medium">
                      +{formatCurrency(record.tip)} tip
                    </p>
                  )}
                  <p className="text-xs text-(--text-tertiary)">
                    Fee: {formatCurrency(record.deliveryFee)}
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
