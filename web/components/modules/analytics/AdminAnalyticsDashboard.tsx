"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminOverview,
  useAdminRevenue,
  useAdminFulfillmentStats,
} from "@/queries/useAnalytics";
import { formatPrice, formatCompactNumber, formatPercent } from "@/lib/format";
import type { AnalyticsPeriod } from "@/types/api";

export default function AdminAnalyticsDashboard() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("monthly");

  const { data: overview, isLoading: overviewLoading } = useAdminOverview();
  const { data: revenue, isLoading: revenueLoading } = useAdminRevenue(period);
  const { data: fulfillment, isLoading: fulfillmentLoading } =
    useAdminFulfillmentStats();

  return (
    <div className="space-y-6">
      {/* Platform KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {overviewLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
          : [
              {
                label: "Toplam GMV",
                value: overview ? formatPrice(overview.totalGmv) : "—",
                icon: "💰",
                color: "var(--chart-3)",
              },
              {
                label: "Total Orders",
                value: overview?.totalOrders ?? "—",
                icon: "🛒",
                color: "var(--charcoal-mid)",
              },
              {
                label: "Merchant Count",
                value: overview?.totalMerchants ?? "—",
                icon: "🏪",
                color: "var(--red)",
              },
              {
                label: "Customer Count",
                value: overview?.totalCustomers ?? "—",
                icon: "👥",
                color: "var(--chart-4)",
              },
              {
                label: "Ort. Teslimat",
                value: overview
                  ? `${Math.round(overview.averageDeliveryHours)}s`
                  : "—",
                icon: "🚚",
                color: "var(--charcoal-mid)",
              },
              {
                label: "Fulfillment Başarı",
                value: overview
                  ? formatPercent(overview.fulfillmentSuccessRate)
                  : "—",
                icon: "✅",
                color: "var(--chart-3)",
              },
            ].map(({ label, value, icon, color }) => (
              <div
                key={label}
                className="bg-white border border-gray-200 rounded-xl p-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{icon}</span>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--charcoal-soft)]">
                    {label}
                  </p>
                </div>
                <p className="text-2xl font-bold font-heading" style={{ color }}>
                  {value}
                </p>
              </div>
            ))}
      </div>

      {/* Gelir Grafiği */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-[var(--charcoal)]">Platform Geliri</h3>
            <p className="text-xs text-[var(--charcoal-soft)] font-mono">
              Tüm mağazalar geneli
            </p>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(["daily", "weekly", "monthly"] as AnalyticsPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  period === p
                    ? "bg-white text-[var(--charcoal)] shadow-sm"
                    : "text-[var(--charcoal-soft)] hover:text-[var(--charcoal)]"
                }`}
              >
                {p === "daily"
                  ? "Günlük"
                  : p === "weekly"
                    ? "Haftalık"
                    : "Aylık"}
              </button>
            ))}
          </div>
        </div>

        {revenueLoading ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={revenue?.salesChart ?? []}
              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "var(--charcoal-soft)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--charcoal-soft)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatCompactNumber(v)}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid var(--border-light)",
                  fontSize: 12,
                }}
                formatter={(val: any) => [formatPrice(val), "Gelir"]}
              />

              <Bar dataKey="revenue" fill="var(--charcoal-mid)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Fulfillment Stats */}
      {!fulfillmentLoading && fulfillment && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-[var(--charcoal)] mb-1">
            Fulfillment Performansı
          </h3>
          <p className="text-xs text-[var(--charcoal-soft)] font-mono mb-5">
            Ortalama teslimat, başarı oranı
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: "Ort. Teslimat Süresi",
                value: `${fulfillment.averageDeliveryHours ?? 0}s`,
                icon: "⏱️",
              },
              {
                label: "Başarı Oranı",
                value: formatPercent(fulfillment.successRate ?? 0),
                icon: "✅",
              },
              {
                label: "Toplam Teslimat",
                value: fulfillment.totalDeliveries ?? "—",
                icon: "📦",
              },
            ].map(({ label, value, icon }) => (
              <div key={label} className="text-center p-4  rounded-xl">
                <div className="text-2xl mb-1">{icon}</div>
                <p className="text-xl font-bold font-heading text-[var(--charcoal)]">
                  {value}
                </p>
                <p className="text-xs text-[var(--charcoal-soft)] mt-0.5 font-mono">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
