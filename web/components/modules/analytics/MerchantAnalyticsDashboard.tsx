"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMerchantStats,
  useMerchantSalesChart,
  useMerchantComparison,
  useMerchantTopProducts,
} from "@/queries/useAnalytics";
import { formatPrice, formatCompactNumber, formatPercent } from "@/lib/format";
import type { AnalyticsPeriod } from "@/types/api";

const PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export default function MerchantAnalyticsDashboard() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("weekly");

  const { data: stats, isLoading: statsLoading } = useMerchantStats();
  const { data: salesData = [], isLoading: salesLoading } =
    useMerchantSalesChart(period);
  const { data: comparison, isLoading: compLoading } = useMerchantComparison();
  const { data: topProducts = [], isLoading: topLoading } =
    useMerchantTopProducts(5);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
          : [
              {
                label: "Toplam Gelir",
                value: stats ? formatPrice(stats.totalRevenue) : "—",
                color: "#2D7A4F",
                icon: "💰",
              },
              {
                label: "Total Orders",
                value: stats?.totalOrders ?? "—",
                color: "#1A4A6B",
                icon: "🛒",
              },
              {
                label: "Product Count",
                value: stats?.totalProducts ?? "—",
                color: "#8B5E1A",
                icon: "📦",
              },
              {
                label: "Avg. Order",
                value: stats ? formatPrice(stats.averageOrderValue) : "—",
                color: "#C84B2F",
                icon: "📊",
              },
            ].map(({ label, value, color, icon }) => (
              <div
                key={label}
                className="bg-white border border-gray-200 rounded-xl p-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{icon}</span>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#7A7060]">
                    {label}
                  </p>
                </div>
                <p className="text-2xl font-bold font-serif" style={{ color }}>
                  {value}
                </p>
              </div>
            ))}
      </div>

      {/* Sales Chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-[#0D0D0D]">Sales Chart</h3>
            <p className="text-xs text-[#7A7060] font-mono">
              Gelir & sipariş trendi
            </p>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {PERIODS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setPeriod(value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  period === value
                    ? "bg-white text-[#0D0D0D] shadow-sm"
                    : "text-[#7A7060] hover:text-[#0D0D0D]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {salesLoading ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={salesData}
              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C84B2F" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#C84B2F" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#7A7060" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#7A7060" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatCompactNumber(v)}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #E5E0D8",
                  fontSize: 12,
                }}
                // val: number yerine val: any kullanarak veya tipi kaldırarak çözebilirsin
                formatter={(val: any) => [formatPrice(val), "Gelir"]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#C84B2F"
                strokeWidth={2}
                fill="url(#revenueGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Marketplace vs E-Store Karşılaştırma */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Comparison stats */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-[#0D0D0D] mb-1">
            Kanal Karşılaştırması
          </h3>
          <p className="text-xs text-[#7A7060] font-mono mb-5">
            Pazaryeri vs E-Store
          </p>

          {compLoading ? (
            <Skeleton className="h-40 w-full rounded-xl" />
          ) : comparison ? (
            <div className="space-y-4">
              {[
                {
                  label: "Pazaryeri",
                  color: "#C84B2F",
                  revenue: comparison.marketplace.revenue,
                  orders: comparison.marketplace.orders,
                  conversion: comparison.marketplace.conversionRate,
                },
                {
                  label: "E-Store",
                  color: "#1A4A6B",
                  revenue: comparison.estore.revenue,
                  orders: comparison.estore.orders,
                  conversion: comparison.estore.conversionRate,
                },
              ].map(({ label, color, revenue, orders, conversion }) => {
                const totalRevenue =
                  comparison.marketplace.revenue + comparison.estore.revenue;
                const pct =
                  totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-[#0D0D0D]">
                        {label}
                      </span>
                      <span
                        className="font-serif font-semibold text-sm"
                        style={{ color }}
                      >
                        {formatPrice(revenue)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                    <div className="flex gap-4 mt-1">
                      <span className="text-xs text-[#7A7060]">
                        {orders} sipariş
                      </span>
                      <span className="text-xs text-[#7A7060]">
                        Dönüşüm: {formatPercent(conversion)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[#7A7060] text-center py-8">Veri yok</p>
          )}
        </div>

        {/* Top products */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-[#0D0D0D] mb-1">
            En Çok Satan Ürünler
          </h3>
          <p className="text-xs text-[#7A7060] font-mono mb-5">Top 5 ürün</p>

          {topLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-lg" />
              ))}
            </div>
          ) : topProducts.length === 0 ? (
            <p className="text-sm text-[#7A7060] text-center py-8">
              Henüz satış yok
            </p>
          ) : (
            <div className="space-y-2">
              {topProducts.map((p, i) => (
                <div
                  key={p.productId}
                  className="flex items-center gap-3 p-2 rounded-lg hover:/60 transition-colors"
                >
                  <span className="font-mono text-xs text-[#7A7060] w-5 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0D0D0D] truncate">
                      {p.productName}
                    </p>
                    <p className="text-xs text-[#7A7060]">
                      {p.totalQuantity} adet satıldı
                    </p>
                  </div>
                  <span className="font-serif font-semibold text-sm text-[#2D7A4F] shrink-0">
                    {formatPrice(p.totalRevenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
