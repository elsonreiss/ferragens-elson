"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { formatCurrency, formatMonthLabel } from "@/lib/format";

export function RevenueChart({ data }: { data: Array<{ mes: string; total: number }> }) {
  const chartData = data.map((d) => ({ mes: formatMonthLabel(d.mes), total: d.total }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="mes"
          tick={{ fontSize: 12, fill: "var(--color-text-muted)" }}
          axisLine={{ stroke: "var(--color-border)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
          axisLine={false}
          tickLine={false}
          width={48}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value))}
          contentStyle={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 12,
          }}
          cursor={{ fill: "var(--color-border)", opacity: 0.3 }}
        />
        <Bar dataKey="total" fill="var(--color-orange-500)" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
