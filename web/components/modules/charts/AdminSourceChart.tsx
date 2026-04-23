"use client";

import { PieChart, Pie, Cell, Tooltip } from "recharts";

interface Props {
  data: { name: string; value: number; color: string }[];
}

export default function SourceChart({ data }: Props) {
  return (
    <>
      <PieChart width={180} height={180}>
        <Pie
          data={data}
          cx={90}
          cy={90}
          innerRadius={50}
          outerRadius={80}
          dataKey="value"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => [`%${Number(v)}`, ""]} />
      </PieChart>
      <div className="flex gap-4 mt-2">
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
