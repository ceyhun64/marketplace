"use client";

import { PieChart, Pie, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface Props {
  data: { name: string; value: number; color: string }[];
}

export default function SourceChart({ data }: Props) {
  // ChartConfig dinamik renk girişlerinden oluşturuluyor
  const chartConfig = Object.fromEntries(
    data.map((d) => [d.name, { label: d.name, color: d.color }]),
  ) satisfies ChartConfig;

  return (
    <>
      <ChartContainer
        config={chartConfig}
        className="mx-auto h-[180px] w-[180px]"
      >
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            dataKey="value"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => [`%${Number(value)}`, ""]}
              />
            }
          />
        </PieChart>
      </ChartContainer>

      <div className="flex gap-4 mt-2 justify-center">
        {data.map((s) => (
          <div
            key={s.name}
            className="flex items-center gap-1.5 text-xs text-gray-600"
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: s.color }}
            />
            {s.name}
          </div>
        ))}
      </div>
    </>
  );
}
