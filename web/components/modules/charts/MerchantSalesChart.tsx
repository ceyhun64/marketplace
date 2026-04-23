"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type SalesData = { gun: string; marketplace: number; estore: number };

export default function MerchantSalesChart({ data }: { data: SalesData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="mktGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="storeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="gun" tick={{ fontSize: 12 }} />
        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}K`}
        />
        <Tooltip
          formatter={(v, n) => [
            `₺${Number(v).toLocaleString("tr-TR")}`,
            n === "marketplace" ? "Marketplace" : "E-Mağaza",
          ]}
        />
        <Area
          type="monotone"
          dataKey="marketplace"
          stroke="#3b82f6"
          fill="url(#mktGrad)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="estore"
          stroke="#10b981"
          fill="url(#storeGrad)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
