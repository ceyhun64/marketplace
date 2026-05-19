"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MerchantSalesChart from "@/components/modules/charts/MerchantSalesChart";
import {
  useMerchantStats,
  useMerchantComparison,
  useMerchantTopProducts,
  useMerchantSalesChart,
} from "@/queries/useAnalytics";
import { formatPrice, formatCompactNumber, formatPercent } from "@/lib/format";
import type { AnalyticsPeriod } from "@/types/api";
import { TrendingUp, ShoppingBag, Store, Package } from "lucide-react";

// ── Lazy-load the radar/bar comparison chart (SSR off — it uses canvas APIs)
const ComparisonChart = dynamic(
  () => import("@/components/modules/analytics/ComparisonChart"),
  { ssr: false },
);

const PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: "daily",   label: "Daily"   },
  { value: "weekly",  label: "Weekly"  },
  { value: "monthly", label: "Monthly" },
];

// ── KPI card skeleton ─────────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-3.5 md:p-5 space-y-3 min-h-[88px]">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-2.5 w-20 rounded" />
        <Skeleton className="h-6 w-6 rounded-lg shrink-0" />
      </div>
      <Skeleton className="h-7 w-24 rounded" />
      <Skeleton className="h-2 w-16 rounded" />
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export default function MerchantAnalyticsDashboard() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("weekly");

  const { data: stats,       isLoading: statsLoading  } = useMerchantStats();
  const { data: comparison,  isLoading: compLoading   } = useMerchantComparison();
  const { data: topProducts, isLoading: topLoading    } = useMerchantTopProducts(5);
  const { data: salesChart,  isLoading: chartLoading  } = useMerchantSalesChart(period);

  function toArray(data: unknown): any[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      if (Array.isArray(obj.items))        return obj.items;
      if (Array.isArray(obj.data))         return obj.data;
      if (Array.isArray(obj.salesChart))   return obj.salesChart;
      if (Array.isArray(obj.salesByPeriod)) return obj.salesByPeriod;
    }
    return [];
  }

  const chartData = toArray(salesChart).map((d) => ({
    gun: d.label
      ? d.label
      : d.date
        ? new Date(d.date).toLocaleDateString("en-US", { weekday: "short" })
        : "—",
    marketplace: d.source === "MARKETPLACE" || !d.source ? (d.revenue ?? 0) : 0,
    estore:      d.source === "ESTORE" ? (d.revenue ?? 0) : 0,
  }));

  // ── KPI definitions ──────────────────────────────────────────────────────────

  const kpis = [
    {
      label:     "Total Revenue",
      value:     stats ? formatPrice(stats.totalRevenue) : "—",
      sub:       "All channels",
      icon:      TrendingUp,
      iconColor: "var(--success)",
      iconBg:    "rgba(13,122,78,0.10)",
    },
    {
      label:     "Total Orders",
      value:     stats?.totalOrders?.toString() ?? "—",
      sub:       "This period",
      icon:      ShoppingBag,
      iconColor: "var(--info)",
      iconBg:    "rgba(27,94,168,0.10)",
    },
    {
      label:     "Marketplace",
      value:     stats ? formatPrice(stats.marketplaceRevenue) : "—",
      sub:       stats && stats.totalRevenue > 0
                   ? `${Math.round((stats.marketplaceRevenue / stats.totalRevenue) * 100)}% of total`
                   : "—",
      icon:      Store,
      iconColor: "var(--info)",
      iconBg:    "rgba(27,94,168,0.10)",
    },
    {
      label:     "E-Store",
      value:     stats ? formatPrice(stats.estoreRevenue) : "—",
      sub:       stats && stats.totalRevenue > 0
                   ? `${Math.round((stats.estoreRevenue / stats.totalRevenue) * 100)}% of total`
                   : "—",
      icon:      Package,
      iconColor: "var(--success)",
      iconBg:    "rgba(13,122,78,0.10)",
    },
  ] as const;

  // ── Comparison table rows (derived once, shared between mobile/desktop renders)

  const comparisonRows = comparison
    ? [
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
          mk: comparison.marketplace.orders > 0
                ? formatPrice(comparison.marketplace.revenue / comparison.marketplace.orders)
                : "—",
          es: comparison.estore.orders > 0
                ? formatPrice(comparison.estore.revenue / comparison.estore.orders)
                : "—",
        },
        {
          label: "Conv. Rate",
          mk: formatPercent(comparison.marketplace.conversionRate),
          es: formatPercent(comparison.estore.conversionRate),
        },
      ]
    : [];

  // ────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 md:space-y-6 lg:space-y-8">

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-(--text-primary)">
          Analytics
        </h1>
        <p className="text-sm text-(--text-secondary) mt-0.5">
          Sales performance by channel
        </p>
      </div>

      {/* ── KPI cards — 2 cols mobile · 2 cols tablet · 4 cols desktop ────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
          : kpis.map((k) => {
              const Icon = k.icon;
              return (
                <div
                  key={k.label}
                  className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-3.5 md:p-5 flex flex-col justify-between min-h-[88px]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[10px] md:text-[11px] text-(--text-tertiary) font-semibold uppercase tracking-wider leading-tight">
                      {k.label}
                    </p>
                    <div
                      className="p-1.5 rounded-lg shrink-0"
                      style={{ background: k.iconBg }}
                    >
                      <Icon size={12} style={{ color: k.iconColor }} />
                    </div>
                  </div>
                  <div className="mt-1">
                    <p className="text-lg md:text-2xl font-bold text-(--text-primary) leading-none">
                      {k.value}
                    </p>
                    <p className="text-[10px] text-(--text-tertiary) mt-1 leading-tight">
                      {k.sub}
                    </p>
                  </div>
                </div>
              );
            })}
      </div>

      {/* ── Sales chart ────────────────────────────────────────────────────── */}
      <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-4 md:p-5">

        {/* Header — stacks on mobile, inline on sm+ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-sm font-semibold text-(--text-secondary)">
            Marketplace vs E-Store Revenue (₺)
          </h2>

          {/* Mobile period selector — full-width shadcn Select, min 44px height */}
          <div className="sm:hidden w-full">
            <Select
              value={period}
              onValueChange={(v) => setPeriod(v as AnalyticsPeriod)}
            >
              <SelectTrigger className="h-11 w-full text-xs font-medium border-(--border-mid)">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => (
                  <SelectItem key={p.value} value={p.value} className="text-xs">
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tablet+ period pills — hidden below sm */}
          <div className="hidden sm:flex gap-1 bg-(--off-white-2) p-1 rounded-lg shrink-0">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-2 rounded-md text-xs font-medium transition-all min-h-[36px] min-w-[56px] ${
                  period === p.value
                    ? "bg-(--bg-surface) text-(--text-primary) shadow-sm"
                    : "text-(--text-secondary) hover:text-(--text-primary)"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart — responsive heights across breakpoints */}
        {chartLoading ? (
          <Skeleton className="h-40 sm:h-48 md:h-[220px] w-full rounded-lg" />
        ) : chartData.length > 0 ? (
          <div className="h-40 sm:h-48 md:h-[220px] w-full">
            <MerchantSalesChart data={chartData} />
          </div>
        ) : (
          <div className="h-40 sm:h-48 md:h-[220px] flex items-center justify-center text-sm text-(--text-tertiary)">
            No sales data for this period
          </div>
        )}

        {/* Legend */}
        <div className="flex gap-4 mt-3 justify-end">
          <span className="flex items-center gap-1.5 text-xs text-(--text-secondary)">
            <span className="w-2.5 h-2.5 rounded-full bg-(--info) inline-block shrink-0" />
            Marketplace
          </span>
          <span className="flex items-center gap-1.5 text-xs text-(--text-secondary)">
            <span className="w-2.5 h-2.5 rounded-full bg-(--success) inline-block shrink-0" />
            E-Store
          </span>
        </div>
      </div>

      {/* ── Channel comparison + Top products ──────────────────────────────── */}
      {/*   1 col mobile · 2 cols tablet · 2 cols desktop                     */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* ── Channel comparison ─────────────────────────────────────────── */}
        <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-4 md:p-5">
          <h2 className="text-sm font-semibold text-(--text-secondary) mb-4">
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
              {/* Visual bar chart */}
              <ComparisonChart data={comparison} className="mb-4" />

              {/* Mobile: stacked metric cards (no cramped 3-col grid on 360px) */}
              <div className="sm:hidden space-y-2">
                {comparisonRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between px-3 py-3 rounded-xl"
                    style={{ background: "var(--bg-sunken)" }}
                  >
                    <span className="text-xs font-medium text-(--text-secondary) w-20 shrink-0">
                      {row.label}
                    </span>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p
                          className="text-[9px] uppercase tracking-wide mb-0.5"
                          style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}
                        >
                          MKT
                        </p>
                        <p className="text-xs font-semibold text-(--info)">{row.mk}</p>
                      </div>
                      <Separator orientation="vertical" className="h-7 opacity-30" />
                      <div className="text-right">
                        <p
                          className="text-[9px] uppercase tracking-wide mb-0.5"
                          style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}
                        >
                          E-STR
                        </p>
                        <p className="text-xs font-semibold text-(--success)">{row.es}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tablet+: 3-column table (hidden on mobile) */}
              <div className="hidden sm:block divide-y divide-(--border-light)">
                <div className="grid grid-cols-3 pb-2 text-[11px] font-semibold text-(--text-tertiary) uppercase tracking-wide">
                  <span>Metric</span>
                  <span className="text-center">Marketplace</span>
                  <span className="text-right">E-Store</span>
                </div>
                {comparisonRows.map((row) => (
                  <div key={row.label} className="grid grid-cols-3 py-3 text-sm">
                    <span className="text-(--text-secondary)">{row.label}</span>
                    <span className="text-center font-semibold text-(--info)">{row.mk}</span>
                    <span className="text-right font-semibold text-(--success)">{row.es}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-(--text-tertiary) text-center py-8">
              No data available
            </p>
          )}
        </div>

        {/* ── Top products ───────────────────────────────────────────────── */}
        <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-4 md:p-5">
          <h2 className="text-sm font-semibold text-(--text-secondary) mb-4">
            Top Products
          </h2>

          {topLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded" />
              ))}
            </div>
          ) : topProducts && topProducts.length > 0 ? (
            <div className="divide-y divide-(--border-light)">
              {topProducts.map((p, i) => {
                const topRevenue = topProducts[0]?.totalRevenue ?? 1;
                const barPct = Math.round((p.totalRevenue / topRevenue) * 100);
                return (
                  <div key={p.productId} className="py-3 first:pt-0 last:pb-0">
                    {/* Rank + name */}
                    <div className="flex items-start gap-2.5">
                      <span
                        className="text-[11px] font-black w-4 shrink-0 pt-0.5 text-center"
                        style={{ color: i === 0 ? "var(--red)" : "var(--text-tertiary)" }}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-(--text-primary) truncate">
                          {p.productName}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                          <span className="text-[11px] text-(--text-secondary)">
                            {p.totalQuantity} sold
                          </span>
                          <span className="text-[11px] font-semibold text-(--text-primary)">
                            {formatPrice(p.totalRevenue)}
                          </span>
                        </div>
                        {/* Revenue progress bar */}
                        <div
                          className="h-1 rounded-full overflow-hidden mt-2"
                          style={{ background: "var(--bg-sunken)" }}
                        >
                          <div
                            className="h-full rounded-full bg-(--info) transition-all duration-500"
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                        {/* Channel split */}
                        <div className="flex gap-3 mt-1">
                          <span className="text-[10px] text-(--info)">
                            MKT {formatCompactNumber(p.marketplaceRevenue)}
                          </span>
                          <span className="text-[10px] text-(--success)">
                            Store {formatCompactNumber(p.estoreRevenue)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-(--text-tertiary) text-center py-8">
              No product data yet
            </p>
          )}
        </div>
      </div>

      {/* ── Summary banner ─────────────────────────────────────────────────── */}
      {stats && (
        <div
          className="rounded-xl p-4 md:p-5 lg:p-6"
          style={{ background: "var(--charcoal)" }}
        >
          {/*
           * Mobile:  1 column stacked, horizontal rule dividers
           * Tablet+: 3 columns side by side, vertical rule dividers
           */}
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
            {[
              {
                label: "Avg. Order Value",
                value: formatPrice(stats.averageOrderValue),
                color: "var(--success)",
              },
              {
                label: "Active Products",
                value: stats.totalProducts.toString(),
                color: "var(--info)",
              },
              {
                label: "Total Orders",
                value: stats.totalOrders.toString(),
                color: "white",
              },
            ].map((item, i) => (
              <div
                key={item.label}
                className="py-4 sm:py-0 sm:px-6 first:pt-0 last:pb-0 sm:first:pl-0 sm:last:pr-0"
              >
                <p
                  className="text-[10px] font-mono uppercase tracking-widest mb-1.5"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  {item.label}
                </p>
                <p
                  className="text-2xl md:text-3xl font-bold"
                  style={{ color: item.color }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
