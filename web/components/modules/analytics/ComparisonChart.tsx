"use client";

/**
 * ComparisonChart — Marketplace vs E-Mağaza karşılaştırma görsel bileşeni.
 * Merchant Analytics Dashboard'da kanal bazlı karşılaştırma grafiği olarak kullanılır.
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { ComparisonData } from "@/types/api";
import { formatPrice } from "@/lib/format";

interface ComparisonChartProps {
  data: ComparisonData;
  className?: string;
}

interface ChartDataPoint {
  metric: string;
  Marketplace: number;
  "E-Mağaza": number;
}

const CHART_COLORS = {
  marketplace: "#3b82f6", // blue-500
  estore: "#10b981",      // emerald-500
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: entry.fill }}
          />
          <span className="text-gray-500">{entry.name}:</span>
          <span className="font-semibold text-gray-900">
            {label === "Gelir (₺)"
              ? formatPrice(entry.value)
              : label === "Dönüşüm Oranı (%)"
                ? `%${entry.value.toFixed(1)}`
                : entry.value.toLocaleString("tr-TR")}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ComparisonChart({ data, className }: ComparisonChartProps) {
  const chartData: ChartDataPoint[] = [
    {
      metric: "Gelir (₺)",
      Marketplace: data.marketplace.revenue,
      "E-Mağaza": data.estore.revenue,
    },
    {
      metric: "Sipariş",
      Marketplace: data.marketplace.orders,
      "E-Mağaza": data.estore.orders,
    },
    {
      metric: "Dönüşüm Oranı (%)",
      Marketplace: parseFloat((data.marketplace.conversionRate * 100).toFixed(1)),
      "E-Mağaza": parseFloat((data.estore.conversionRate * 100).toFixed(1)),
    },
  ];

  if (
    data.marketplace.revenue === 0 &&
    data.estore.revenue === 0 &&
    data.marketplace.orders === 0 &&
    data.estore.orders === 0
  ) {
    return (
      <div
        className={`flex items-center justify-center h-40 text-sm text-gray-400 ${className ?? ""}`}
      >
        Henüz karşılaştırma verisi yok
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={chartData}
          barCategoryGap="30%"
          barGap={4}
          margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="metric"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
          />
          <Bar
            dataKey="Marketplace"
            fill={CHART_COLORS.marketplace}
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          />
          <Bar
            dataKey="E-Mağaza"
            fill={CHART_COLORS.estore}
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
