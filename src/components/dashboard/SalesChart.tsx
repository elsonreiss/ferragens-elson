"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { cn, formatCurrency, formatDayLabel, formatMonthLabel, formatWeekLabel } from "@/lib/format";

type Period = "dia" | "semana" | "mes";

const PERIOD_LABELS: Record<Period, string> = {
  dia: "Diário",
  semana: "Semanal",
  mes: "Mensal",
};

export function SalesChart({
  faturamentoPorDia,
  faturamentoPorSemana,
  faturamentoPorMes,
}: {
  faturamentoPorDia: Array<{ dia: string; total: number }>;
  faturamentoPorSemana: Array<{ semana: string; total: number }>;
  faturamentoPorMes: Array<{ mes: string; total: number }>;
}) {
  const [period, setPeriod] = useState<Period>("dia");

  const chartData = useMemo(() => {
    if (period === "dia") {
      return faturamentoPorDia.map((d) => ({ label: formatDayLabel(d.dia), total: d.total }));
    }
    if (period === "semana") {
      return faturamentoPorSemana.map((d) => ({ label: formatWeekLabel(d.semana), total: d.total }));
    }
    return faturamentoPorMes.map((d) => ({ label: formatMonthLabel(d.mes), total: d.total }));
  }, [period, faturamentoPorDia, faturamentoPorSemana, faturamentoPorMes]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-sm">Faturamento</h3>
        <div className="flex items-center gap-1 bg-bg rounded-lg p-1">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                period === p
                  ? "bg-orange-500 text-white"
                  : "text-text-muted hover:text-text"
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
            axisLine={{ stroke: "var(--color-border)" }}
            tickLine={false}
            interval={period === "dia" ? 1 : 0}
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
    </div>
  );
}
