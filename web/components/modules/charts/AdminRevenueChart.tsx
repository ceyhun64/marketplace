"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface Props {
  data: { gun: string; gelir: number }[];
}

const chartConfig = {
  gelir: {
    label: "Gelir",
    color: "#3b82f6",
  },
} satisfies ChartConfig;

export default function RevenueChart({ data }: Props) {
  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="gun" tick={{ fontSize: 12 }} />
        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}K`}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => [
                `₺${Number(value).toLocaleString("tr-TR")}`,
                "Gelir",
              ]}
            />
          }
        />
        <Line
          type="monotone"
          dataKey="gelir"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
