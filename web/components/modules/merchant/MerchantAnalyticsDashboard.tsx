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

  // API yanıtını güvenli şekilde diziye çevir (obje veya dizi gelebilir)
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

  // Grafik için API verisini MerchantSalesChart formatına çevir
  // Backend SalesPeriodDto: { label, revenue, orderCount }
  // Backend SalesDataPoint: { date, revenue, orderCount, source }
  const chartData = toArray(salesChart).map((d) => ({
    gun: d.label
      ? d.label
      : d.date
        ? new Date(d.date).toLocaleDateString("tr-TR", { weekday: "short" })
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
        <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">
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
                className="bg-white rounded-xl border border-gray-100 p-5"
              >
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                  {k.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {k.value}
                </p>
                <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
              </div>
            ))}
      </div>

      {/* Sales Chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">
            Marketplace vs E-Store Revenue (₺)
          </h2>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  period === p.value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
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
          <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">
            No sales data for this period
          </div>
        )}

        <div className="flex gap-4 mt-3 justify-end">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
            Marketplace
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            E-Store
          </span>
        </div>
      </div>

      {/* Channel Comparison + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
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
              {/* Görsel karşılaştırma grafiği */}
              <ComparisonChart data={comparison} className="mb-4" />

              {/* Sayısal tablo */}
              <div className="divide-y divide-gray-100">
                <div className="grid grid-cols-3 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
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
                    <span className="text-gray-600">{row.label}</span>
                    <span className="text-center font-semibold text-blue-600">
                      {row.mk}
                    </span>
                    <span className="text-right font-semibold text-emerald-600">
                      {row.es}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">
              No data available
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
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
                  <span className="text-xs font-bold text-gray-300 w-4">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {p.productName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {p.totalQuantity} sold · {formatPrice(p.totalRevenue)}
                    </p>
                  </div>
                  <div className="text-right text-xs shrink-0">
                    <p className="text-blue-500">
                      MKT {formatCompactNumber(p.marketplaceRevenue)}
                    </p>
                    <p className="text-emerald-500">
                      Store {formatCompactNumber(p.estoreRevenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">
              No product data yet
            </p>
          )}
        </div>
      </div>

      {/* Summary Banner */}
      {stats && (
        <div className="bg-gray-900 text-white rounded-xl p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-1">
                Avg. Order Value
              </p>
              <p className="text-2xl font-bold">
                {formatPrice(stats.averageOrderValue)}
              </p>
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-1">
                Active Products
              </p>
              <p className="text-2xl font-bold">{stats.totalProducts}</p>
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-1">
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
