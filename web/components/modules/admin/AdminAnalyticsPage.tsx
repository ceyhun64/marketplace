"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminOverview,
  useAdminRevenue,
  useAdminFulfillmentStats,
} from "@/queries/useAnalytics";
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
    <div className="w-full h-[200px] bg-gray-100 rounded-lg animate-pulse" />
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
    // { items: [...] } veya { data: [...] } şeklinde gelebilir
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items;
    if (Array.isArray(obj.data)) return obj.data;
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

  // revenueRaw'ı güvenli diziye çevir, sonra chart formatına map'le
  const revenuePoints = toArray(revenueRaw).length
    ? toArray(revenueRaw)
    : toArray(overview?.revenueChart);

  const chartRevenue = revenuePoints.map((d: any) => ({
    gun: d.date ?? d.label ?? "",
    gelir: d.revenue ?? 0,
  }));

  const chartOrders = revenuePoints.map((d: any) => ({
    gun: d.date ?? d.label ?? "",
    siparis: d.orderCount ?? 0,
  }));

  const sourceData = [
    { name: "Marketplace", value: 68, color: "var(--chart-2)" },
    { name: "E-Store", value: 32, color: "var(--chart-3)" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Platform-wide performance overview
          </p>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                period === opt.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
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
            className="bg-white rounded-xl border border-gray-100 p-5"
          >
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
              {s.label}
            </p>
            {overviewLoading ? (
              <Skeleton className="h-8 w-24 mt-2" />
            ) : (
              <p className="text-2xl font-bold text-gray-900 mt-2">{s.value}</p>
            )}
            {s.sub && !overviewLoading && (
              <p className="text-xs mt-1 font-medium text-gray-400">{s.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Revenue (₺)
          </h2>
          {revenueLoading || overviewLoading ? (
            <ChartSkeleton />
          ) : (
            <RevenueChart key={`revenue-${period}`} data={chartRevenue} />
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Orders</h2>
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
        <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col items-center">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 self-start">
            Order Source
          </h2>
          <SourceChart data={sourceData} />
        </div>

        {/* Platform Summary */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
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
                  className="flex justify-between items-center border-b border-gray-50 pb-3 last:border-0 last:pb-0"
                >
                  <p className="text-xs text-gray-400 font-medium">
                    {item.label}
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fulfillment Stats */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
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
                    <p className="text-xs text-gray-400 font-medium">
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-300">{item.sub}</p>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
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
