"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Purchase } from "@/domain/entities/Purchase";

export function PurchasesTable({ purchases }: { purchases: Purchase[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Link href="/compras/novo">
          <Button>
            <Plus size={16} /> Nova compra
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-bg">
              <tr className="text-left text-xs text-text-muted uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Fornecedor</th>
                <th className="px-4 py-3 font-medium">Itens</th>
                <th className="px-4 py-3 font-medium">Pagamento</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {purchases.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-text-muted">
                    Nenhuma compra registrada ainda.
                  </td>
                </tr>
              )}
              {purchases.map((p) => (
                <tr key={p.id} className="hover:bg-bg/60 transition-colors">
                  <td className="px-4 py-3 text-text-muted">{formatDateTime(p.createdAt)}</td>
                  <td className="px-4 py-3 font-medium">{p.supplierName ?? "—"}</td>
                  <td className="px-4 py-3 text-text-muted">
                    {p.items.length} item(ns)
                    <span className="block text-xs text-text-muted/70">
                      {p.items.slice(0, 2).map((it) => it.productName).join(", ")}
                      {p.items.length > 2 ? "..." : ""}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.paymentMethod ? <Badge tone="neutral">{p.paymentMethod}</Badge> : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(p.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
