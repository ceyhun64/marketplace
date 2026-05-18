"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import MerchantSalesChart from "@/components/modules/charts/MerchantSalesChart";
import {
  useMerchantStats,
  useMerchantComparison,
  useMerchantTopProducts,
  useMerchantSalesChart,
} from "@/queries/useAnalytics";
import { formatPrice, formatCompactNumber, formatPercent } from "@/lib/format";
import type { AnalyticsPeriod } from "@/types/api";

const ComparisonChart = dynamic(
  () => import("@/components/modules/analytics/ComparisonChart"),
  { ssr: false },
);

const PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export default function MerchantAnalyticsDashboard() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("weekly");

  const { data: stats, isLoading: statsLoading } = useMerchantStats();
  const { data: comparison, isLoading: compLoading } = useMerchantComparison();
  const { data: topProducts, isLoading: topLoading } =
    useMerchantTopProducts(5);
  const { data: salesChart, isLoading: chartLoading } =
    useMerchantSalesChart(period);

  // Safely convert API response to array (can be object or array)
  function toArray(data: unknown): any[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      if (Array.isArray(obj.items)) return obj.items;
      if (Array.isArray(obj.data)) return obj.data;
      if (Array.isArray(obj.salesChart)) return obj.salesChart;
      if (Array.isArray(obj.salesByPeriod)) return obj.salesByPeriod;
    }
    return [];
  }

  // Convert API data to MerchantSalesChart format
  // Backend SalesPeriodDto: { label, revenue, orderCount }
  // Backend SalesDataPoint: { date, revenue, orderCount, source }
  const chartData = toArray(salesChart).map((d) => ({
    gun: d.label
      ? d.label
      : d.date
        ? new Date(d.date).toLocaleDateString("en-US", { weekday: "short" })
        : "—",
    marketplace: d.source === "MARKETPLACE" || !d.source ? (d.revenue ?? 0) : 0,
    estore: d.source === "ESTORE" ? (d.revenue ?? 0) : 0,
  }));

  const kpis = [
    {
      label: "Total Revenue",
      value: stats ? formatPrice(stats.totalRevenue) : "—",
      sub: "All channels",
    },
    {
      label: "Total Orders",
      value: stats?.totalOrders?.toString() ?? "—",
      sub: "This period",
    },
    {
      label: "Marketplace",
      value: stats ? formatPrice(stats.marketplaceRevenue) : "—",
      sub:
        stats && stats.totalRevenue > 0
          ? `${Math.round((stats.marketplaceRevenue / stats.totalRevenue) * 100)}% of total`
          : "—",
    },
    {
      label: "E-Store",
      value: stats ? formatPrice(stats.estoreRevenue) : "—",
      sub:
        stats && stats.totalRevenue > 0
          ? `${Math.round((stats.estoreRevenue / stats.totalRevenue) * 100)}% of total`
          : "—",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-(--text-primary)]">Analytics</h1>
        <p className="text-sm text-(--text-secondary)] mt-1">
          Sales performance by channel
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
          : kpis.map((k) => (
              <div
                key={k.label}
                className="bg-(--bg-surface)] rounded-xl border border-(--border-light)] p-5"
              >
                <p className="text-xs text-(--text-tertiary)] font-medium uppercase tracking-wider">
                  {k.label}
                </p>
                <p className="text-2xl font-bold text-(--text-primary)] mt-2">
                  {k.value}
                </p>
                <p className="text-xs text-(--text-tertiary)] mt-1">{k.sub}</p>
              </div>
            ))}
      </div>

      {/* Sales Chart */}
      <div className="bg-(--bg-surface)] rounded-xl border border-(--border-light)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-(--text-secondary)]">
            Marketplace vs E-Store Revenue (₺)
          </h2>
          <div className="flex gap-1 bg-(--off-white-2)] p-1 rounded-lg">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  period === p.value
                    ? "bg-(--bg-surface)] text-(--text-primary)] shadow-sm"
                    : "text-(--text-secondary)] hover:text-(--text-secondary)]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {chartLoading ? (
          <Skeleton className="h-[220px] w-full rounded-lg" />
        ) : chartData.length > 0 ? (
          <MerchantSalesChart data={chartData} />
        ) : (
          <div className="h-[220px] flex items-center justify-center text-sm text-(--text-tertiary)]">
            No sales data for this period
          </div>
        )}

        <div className="flex gap-4 mt-3 justify-end">
          <span className="flex items-center gap-1.5 text-xs text-(--text-secondary)]">
            <span className="w-2.5 h-2.5 rounded-full bg-(--info)] inline-block" />
            Marketplace
          </span>
          <span className="flex items-center gap-1.5 text-xs text-(--text-secondary)]">
            <span className="w-2.5 h-2.5 rounded-full bg-(--success)] inline-block" />
            E-Store
          </span>
        </div>
      </div>

      {/* Channel Comparison + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-(--bg-surface)] rounded-xl border border-(--border-light)] p-5">
          <h2 className="text-sm font-semibold text-(--text-secondary)] mb-4">
            Channel Comparison
          </h2>
          {compLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded" />
              ))}
            </div>
          ) : comparison ? (
            <>
{/* Visual comparison chart */}
              <ComparisonChart data={comparison} className="mb-4" />

{/* Numeric comparison table */}
              <div className="divide-y divide-(--border-light)">
                <div className="grid grid-cols-3 pb-2 text-xs font-semibold text-(--text-tertiary)] uppercase tracking-wide">
                  <span>Metric</span>
                  <span className="text-center">Marketplace</span>
                  <span className="text-right">E-Store</span>
                </div>
                {[
                  {
                    label: "Revenue",
                    mk: formatPrice(comparison.marketplace.revenue),
                    es: formatPrice(comparison.estore.revenue),
                  },
                  {
                    label: "Orders",
                    mk: comparison.marketplace.orders.toString(),
                    es: comparison.estore.orders.toString(),
                  },
                  {
                    label: "Avg. Order",
                    mk:
                      comparison.marketplace.orders > 0
                        ? formatPrice(
                            comparison.marketplace.revenue /
                              comparison.marketplace.orders,
                          )
                        : "—",
                    es:
                      comparison.estore.orders > 0
                        ? formatPrice(
                            comparison.estore.revenue / comparison.estore.orders,
                          )
                        : "—",
                  },
                  {
                    label: "Conv. Rate",
                    mk: formatPercent(comparison.marketplace.conversionRate),
                    es: formatPercent(comparison.estore.conversionRate),
                  },
                ].map((row) => (
                  <div key={row.label} className="grid grid-cols-3 py-3 text-sm">
                    <span className="text-(--text-secondary)]">{row.label}</span>
                    <span className="text-center font-semibold text-(--info)]">
                      {row.mk}
                    </span>
                    <span className="text-right font-semibold text-(--success)]">
                      {row.es}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-(--text-tertiary)] text-center py-8">
              No data available
            </p>
          )}
        </div>

        <div className="bg-(--bg-surface)] rounded-xl border border-(--border-light)] p-5">
          <h2 className="text-sm font-semibold text-(--text-secondary)] mb-4">
            Top Products
          </h2>
          {topLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded" />
              ))}
            </div>
          ) : topProducts && topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.productId} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-(--text-tertiary)] w-4">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-(--text-primary)] truncate">
                      {p.productName}
                    </p>
                    <p className="text-xs text-(--text-secondary)]">
                      {p.totalQuantity} sold · {formatPrice(p.totalRevenue)}
                    </p>
                  </div>
                  <div className="text-right text-xs shrink-0">
                    <p className="text-(--info)]">
                      MKT {formatCompactNumber(p.marketplaceRevenue)}
                    </p>
                    <p className="text-(--success)]">
                      Store {formatCompactNumber(p.estoreRevenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-(--text-tertiary)] text-center py-8">
              No product data yet
            </p>
          )}
        </div>
      </div>

      {/* Summary Banner */}
      {stats && (
        <div className="bg-(--charcoal)] text-white rounded-xl p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-(--text-tertiary)] mb-1">
                Avg. Order Value
              </p>
              <p className="text-2xl font-bold">
                {formatPrice(stats.averageOrderValue)}
              </p>
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-(--text-tertiary)] mb-1">
                Active Products
              </p>
              <p className="text-2xl font-bold">{stats.totalProducts}</p>
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-(--text-tertiary)] mb-1">
                Total Orders
              </p>
              <p className="text-2xl font-bold">{stats.totalOrders}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
