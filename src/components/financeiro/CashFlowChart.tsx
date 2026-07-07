"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { formatCurrency, formatDayLabel } from "@/lib/format";

export function CashFlowChart({ data }: { data: Array<{ dia: string; receitas: number; despesas: number }> }) {
  const chartData = data.map((d) => ({ label: formatDayLabel(d.dia), Receitas: d.receitas, Despesas: d.despesas }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
          axisLine={{ stroke: "var(--color-border)" }}
          tickLine={false}
          interval={1}
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
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Receitas" fill="var(--color-success)" radius={[4, 4, 0, 0]} maxBarSize={18} />
        <Bar dataKey="Despesas" fill="var(--color-danger)" radius={[4, 4, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
