"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Form";
import { formatCurrency, formatDate, formatMonthLabel } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { Sale } from "@/domain/entities/Sale";
import { MonthlyFinance, SlowMovingProduct, StockValuationRow } from "@/domain/entities/Report";

type Tab = "vendas" | "estoque" | "parados" | "financeiro";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "vendas", label: "Vendas por período" },
  { id: "estoque", label: "Estoque valorizado" },
  { id: "parados", label: "Produtos parados" },
  { id: "financeiro", label: "Financeiro (6 meses)" },
];

export function RelatoriosClient({
  sales,
  stockValuation,
  slowMoving,
  monthlyFinance,
}: {
  sales: Sale[];
  stockValuation: StockValuationRow[];
  slowMoving: SlowMovingProduct[];
  monthlyFinance: MonthlyFinance[];
}) {
  const [tab, setTab] = useState<Tab>("vendas");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const day = s.createdAt.slice(0, 10);
      if (from && day < from) return false;
      if (to && day > to) return false;
      return true;
    });
  }, [sales, from, to]);

  const salesTotal = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const salesProfit = filteredSales.reduce((sum, s) => sum + s.profit, 0);
  const stockTotal = stockValuation.reduce((sum, r) => sum + r.total, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1 bg-bg rounded-lg p-1 w-fit flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              tab === t.id ? "bg-orange-500 text-white" : "text-text-muted hover:text-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "vendas" && (
        <Card className="p-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex gap-3">
              <div>
                <label className="text-xs text-text-muted">De</label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-text-muted">Até</label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                downloadCsv(
                  "vendas.csv",
                  filteredSales.map((s) => ({
                    Data: formatDate(s.createdAt),
                    Cliente: s.clientName ?? "Consumidor não identificado",
                    Pagamento: s.paymentMethod ?? "",
                    Itens: s.items.length,
                    Lucro: s.profit.toFixed(2),
                    Total: s.total.toFixed(2),
                  }))
                )
              }
            >
              <Download size={14} /> Exportar CSV
            </Button>
          </div>
          <div className="flex gap-6 text-sm">
            <span className="text-text-muted">Vendas: <span className="font-mono font-medium text-text">{filteredSales.length}</span></span>
            <span className="text-text-muted">Total: <span className="font-mono font-medium text-text">{formatCurrency(salesTotal)}</span></span>
            <span className="text-text-muted">Lucro: <span className="font-mono font-medium text-success">{formatCurrency(salesProfit)}</span></span>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-text-muted uppercase tracking-wide border-b border-border">
                  <th className="py-2">Data</th>
                  <th className="py-2">Cliente</th>
                  <th className="py-2">Pagamento</th>
                  <th className="py-2 text-right">Lucro</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSales.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-text-muted">Nenhuma venda no período.</td></tr>
                )}
                {filteredSales.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2 text-text-muted">{formatDate(s.createdAt)}</td>
                    <td className="py-2">{s.clientName ?? "Consumidor não identificado"}</td>
                    <td className="py-2 text-text-muted">{s.paymentMethod ?? "—"}</td>
                    <td className="py-2 text-right font-mono text-success">{formatCurrency(s.profit)}</td>
                    <td className="py-2 text-right font-mono">{formatCurrency(s.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "estoque" && (
        <Card className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-muted">
              Valor total em estoque: <span className="font-mono font-medium text-text">{formatCurrency(stockTotal)}</span>
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                downloadCsv(
                  "estoque_valorizado.csv",
                  stockValuation.map((r) => ({
                    Codigo: r.code,
                    Produto: r.name,
                    Quantidade: r.quantity,
                    PrecoCompra: r.purchasePrice.toFixed(2),
                    ValorTotal: r.total.toFixed(2),
                  }))
                )
              }
            >
              <Download size={14} /> Exportar CSV
            </Button>
          </div>
          <div className="overflow-x-auto scrollbar-thin max-h-[480px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface">
                <tr className="text-left text-xs text-text-muted uppercase tracking-wide border-b border-border">
                  <th className="py-2">Código</th>
                  <th className="py-2">Produto</th>
                  <th className="py-2 text-right">Qtd.</th>
                  <th className="py-2 text-right">Preço compra</th>
                  <th className="py-2 text-right">Valor total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stockValuation.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 font-mono text-xs text-text-muted">{r.code}</td>
                    <td className="py-2">{r.name}</td>
                    <td className="py-2 text-right font-mono">{r.quantity}</td>
                    <td className="py-2 text-right font-mono">{formatCurrency(r.purchasePrice)}</td>
                    <td className="py-2 text-right font-mono">{formatCurrency(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "parados" && (
        <Card className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-muted">Produtos com estoque disponível e pouca ou nenhuma saída recente.</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                downloadCsv(
                  "produtos_parados.csv",
                  slowMoving.map((r) => ({
                    Codigo: r.code,
                    Produto: r.name,
                    Quantidade: r.quantity,
                    UltimaSaida: r.lastMovementAt ? formatDate(r.lastMovementAt) : "Nunca",
                  }))
                )
              }
            >
              <Download size={14} /> Exportar CSV
            </Button>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-text-muted uppercase tracking-wide border-b border-border">
                  <th className="py-2">Código</th>
                  <th className="py-2">Produto</th>
                  <th className="py-2 text-right">Qtd. em estoque</th>
                  <th className="py-2 text-right">Última saída</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {slowMoving.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 font-mono text-xs text-text-muted">{r.code}</td>
                    <td className="py-2">{r.name}</td>
                    <td className="py-2 text-right font-mono">{r.quantity}</td>
                    <td className="py-2 text-right text-text-muted">{r.lastMovementAt ? formatDate(r.lastMovementAt) : "Nunca vendeu"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "financeiro" && (
        <Card className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-sm">Receitas x Despesas — últimos 6 meses</h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                downloadCsv(
                  "financeiro_mensal.csv",
                  monthlyFinance.map((m) => ({
                    Mes: formatMonthLabel(m.mes),
                    Receitas: m.receitas.toFixed(2),
                    Despesas: m.despesas.toFixed(2),
                    Saldo: (m.receitas - m.despesas).toFixed(2),
                  }))
                )
              }
            >
              <Download size={14} /> Exportar CSV
            </Button>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyFinance.map((m) => ({ label: formatMonthLabel(m.mes), Receitas: m.receitas, Despesas: m.despesas }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--color-text-muted)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                cursor={{ fill: "var(--color-border)", opacity: 0.3 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Receitas" fill="var(--color-success)" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="Despesas" fill="var(--color-danger)" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
