"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface Props {
  data: { gun: string; siparis: number }[];
}

const chartConfig = {
  siparis: {
    label: "Sipariş",
    color: "#6366f1",
  },
} satisfies ChartConfig;

export default function OrderChart({ data }: Props) {
  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="gun" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => [Number(value), "Sipariş"]}
            />
          }
        />
        <Bar dataKey="siparis" fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
