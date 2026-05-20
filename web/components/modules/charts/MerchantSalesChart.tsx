"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

type SalesData = { gun: string; marketplace: number; estore: number };

const chartConfig = {
  marketplace: {
    label: "Marketplace",
    color: "var(--chart-2)",
  },
  estore: {
    label: "E-Store",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export default function MerchantSalesChart({ data }: { data: SalesData[] }) {
  return (
    <ChartContainer config={chartConfig} className="h-55 w-full">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="mktGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.15} />
            <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="storeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.15} />
            <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="gun" tick={{ fontSize: 12 }} />
        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => [
                `$${Number(value).toLocaleString("en-US")}`,
                name === "marketplace" ? "Marketplace" : "E-Store",
              ]}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="marketplace"
          stroke="var(--chart-2)"
          fill="url(#mktGrad)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="estore"
          stroke="var(--chart-3)"
          fill="url(#storeGrad)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
