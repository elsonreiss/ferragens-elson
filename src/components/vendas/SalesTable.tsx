"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Sale } from "@/domain/entities/Sale";

export function SalesTable({ sales }: { sales: Sale[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Link href="/vendas/novo">
          <Button>
            <Plus size={16} /> Nova venda
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-bg">
              <tr className="text-left text-xs text-text-muted uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Itens</th>
                <th className="px-4 py-3 font-medium">Pagamento</th>
                <th className="px-4 py-3 font-medium text-right">Lucro</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-text-muted">
                    Nenhuma venda registrada ainda.
                  </td>
                </tr>
              )}
              {sales.map((s) => (
                <tr key={s.id} className="hover:bg-bg/60 transition-colors">
                  <td className="px-4 py-3 text-text-muted">{formatDateTime(s.createdAt)}</td>
                  <td className="px-4 py-3 font-medium">{s.clientName ?? "Consumidor não identificado"}</td>
                  <td className="px-4 py-3 text-text-muted">
                    {s.items.length} item(ns)
                    <span className="block text-xs text-text-muted/70">
                      {s.items.slice(0, 2).map((it) => it.productName).join(", ")}
                      {s.items.length > 2 ? "..." : ""}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {s.paymentMethod ? <Badge tone="neutral">{s.paymentMethod}</Badge> : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-success">{formatCurrency(s.profit)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(s.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
