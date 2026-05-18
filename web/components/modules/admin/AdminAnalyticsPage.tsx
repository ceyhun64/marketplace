"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminOverview,
  useAdminRevenue,
  useAdminFulfillmentStats,
} from "@/queries/useAnalytics";
import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import type { AnalyticsPeriod } from "@/types/api";

const RevenueChart = dynamic(
  () => import("@/components/modules/charts/AdminRevenueChart"),
  { ssr: false },
);
const OrderChart = dynamic(
  () => import("@/components/modules/charts/AdminOrderChart"),
  { ssr: false },
);
const SourceChart = dynamic(
  () => import("@/components/modules/charts/AdminSourceChart"),
  { ssr: false },
);

function ChartSkeleton() {
  return (
    <div className="w-full h-50 bg-(--off-white-2) rounded-lg animate-pulse" />
  );
}

const PERIOD_OPTIONS: { label: string; value: AnalyticsPeriod }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

/** API'den gelen veriyi güvenli şekilde diziye çevirir */
function toArray(data: unknown): any[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    // { items: [...] } veya { data: [...] } veya { rows: [...] } şeklinde gelebilir
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items;
    if (Array.isArray(obj.data)) return obj.data;
    if (Array.isArray(obj.rows)) return obj.rows;
    if (Array.isArray(obj.salesByPeriod)) return obj.salesByPeriod;
  }
  return [];
}

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("weekly");

  const { data: overview, isLoading: overviewLoading } = useAdminOverview();
  const { data: revenueRaw, isLoading: revenueLoading } =
    useAdminRevenue(period);
  const { data: fulfillmentStats, isLoading: fulfillmentLoading } =
    useAdminFulfillmentStats();

  const kpiCards = [
    {
      label: "Total GMV",
      value:
        overview?.totalGmv != null
          ? `₺${(overview.totalGmv / 1_000_000).toFixed(2)}M`
          : "—",
      sub: null as string | null,
    },
    {
      label: "Active Merchants",
      value: overview?.totalMerchants ?? "—",
      sub: null as string | null,
    },
    {
      label: "Total Orders",
      value: overview?.totalOrders ?? "—",
      sub: null as string | null,
    },
    {
      label: "Fulfillment Rate",
      value:
        overview?.fulfillmentSuccessRate != null
          ? `${overview.fulfillmentSuccessRate.toFixed(1)}%`
          : "—",
      sub:
        overview?.averageDeliveryHours != null
          ? `avg ${overview.averageDeliveryHours.toFixed(1)}h delivery`
          : null,
    },
  ];

  // revenueRaw is RevenueReportDto: { period, rows, chartData }
  // chartData has time-series: [{ date, revenue, orderCount, label }]
  const rawChartData =
    (revenueRaw as any)?.chartData ??
    toArray(revenueRaw) ??
    toArray(overview?.revenueChart);

  const chartRevenue = rawChartData.map((d: any) => ({
    gun: d.label ?? d.date?.slice(0, 10) ?? "",
    gelir: d.revenue ?? 0,
  }));

  const chartOrders = rawChartData.map((d: any) => ({
    gun: d.label ?? d.date?.slice(0, 10) ?? "",
    siparis: d.orderCount ?? 0,
  }));

  // Sipariş kaynak dağılımı — AdminOverview'den marketplace/estore siparişleri
  const marketplaceOrders = (overview as any)?.marketplaceOrders ?? 0;
  const eStoreOrders = (overview as any)?.eStoreOrders ?? 0;
  const totalSourceOrders = marketplaceOrders + eStoreOrders;
  const sourceData =
    totalSourceOrders > 0
      ? [
          {
            name: "Marketplace",
            value: Math.round((marketplaceOrders / totalSourceOrders) * 100),
            color: "var(--chart-2)",
          },
          {
            name: "E-Store",
            value: Math.round((eStoreOrders / totalSourceOrders) * 100),
            color: "var(--chart-3)",
          },
        ]
      : [
          { name: "Marketplace", value: 0, color: "var(--chart-2)" },
          { name: "E-Store", value: 0, color: "var(--chart-3)" },
        ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-(--text-primary)">Analytics</h1>
          <p className="text-sm text-(--text-tertiary) mt-1">
            Platform-wide performance overview
          </p>
        </div>

        <div className="flex items-center gap-1 bg-(--off-white-2) rounded-lg p-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                period === opt.value
                  ? "bg-(--bg-surface) text-(--text-primary) shadow-sm"
                  : "text-(--text-tertiary) hover:text-(--text-secondary)"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((s) => (
          <div
            key={s.label}
            className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-5"
          >
            <p className="text-xs text-(--text-tertiary) font-medium uppercase tracking-wider">
              {s.label}
            </p>
            {overviewLoading ? (
              <Skeleton className="h-8 w-24 mt-2" />
            ) : (
              <p className="text-2xl font-bold text-(--text-primary) mt-2">{s.value}</p>
            )}
            {s.sub && !overviewLoading && (
              <p className="text-xs mt-1 font-medium text-(--text-tertiary)">{s.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-5">
          <h2 className="text-sm font-semibold text-(--text-secondary) mb-4">
            Revenue (₺)
          </h2>
          {revenueLoading || overviewLoading ? (
            <ChartSkeleton />
          ) : (
            <RevenueChart key={`revenue-${period}`} data={chartRevenue} />
          )}
        </div>
        <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-5">
          <h2 className="text-sm font-semibold text-(--text-secondary) mb-4">Orders</h2>
          {revenueLoading || overviewLoading ? (
            <ChartSkeleton />
          ) : (
            <OrderChart key={`orders-${period}`} data={chartOrders} />
          )}
        </div>
      </div>

      {/* Source + Summary + Fulfillment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Order Source Pie */}
        <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-5 flex flex-col items-center">
          <h2 className="text-sm font-semibold text-(--text-secondary) mb-4 self-start">
            Order Source
          </h2>
          <SourceChart data={sourceData} />
        </div>

        {/* Platform Summary */}
        <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-5">
          <h2 className="text-sm font-semibold text-(--text-secondary) mb-4">
            Platform Summary
          </h2>
          {overviewLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {[
                {
                  label: "Total Merchants",
                  value: overview?.totalMerchants ?? "—",
                },
                {
                  label: "Total Customers",
                  value: overview?.totalCustomers ?? "—",
                },
                { label: "Total Orders", value: overview?.totalOrders ?? "—" },
                {
                  label: "Total GMV",
                  value:
                    overview?.totalGmv != null
                      ? `₺${(overview.totalGmv / 1_000_000).toFixed(2)}M`
                      : "—",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between items-center border-b border-(--border-subtle) pb-3 last:border-0 last:pb-0"
                >
                  <p className="text-xs text-(--text-tertiary) font-medium">
                    {item.label}
                  </p>
                  <p className="text-sm font-bold text-(--text-primary)">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fulfillment Stats */}
        <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-5">
          <h2 className="text-sm font-semibold text-(--text-secondary) mb-4">
            Fulfillment
          </h2>
          {fulfillmentLoading || overviewLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {[
                {
                  label: "Avg. Delivery Time",
                  value:
                    overview?.averageDeliveryHours != null
                      ? `${overview.averageDeliveryHours.toFixed(1)}h`
                      : (fulfillmentStats as any)?.avgDeliveryHours != null
                        ? `${(fulfillmentStats as any).avgDeliveryHours.toFixed(1)}h`
                        : "—",
                  sub: "from pickup to door",
                },
                {
                  label: "Success Rate",
                  value:
                    overview?.fulfillmentSuccessRate != null
                      ? `${overview.fulfillmentSuccessRate.toFixed(1)}%`
                      : (fulfillmentStats as any)?.successRate != null
                        ? `${(fulfillmentStats as any).successRate.toFixed(1)}%`
                        : "—",
                  sub: "delivered on time",
                },
                {
                  label: "Active Couriers",
                  value: (fulfillmentStats as any)?.activeCourierCount ?? "—",
                  sub: "currently on route",
                },
                {
                  label: "Pending Assign",
                  value: (fulfillmentStats as any)?.pendingAssignCount ?? "—",
                  sub: "awaiting courier",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between items-start"
                >
                  <div>
                    <p className="text-xs text-(--text-tertiary) font-medium">
                      {item.label}
                    </p>
                    <p className="text-xs text-(--charcoal-mist)">{item.sub}</p>
                  </div>
                  <p className="text-lg font-bold text-(--text-primary)">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
