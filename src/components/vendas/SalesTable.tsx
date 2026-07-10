"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Sale } from "@/domain/entities/Sale";
import { User } from "@/domain/entities/User";

interface SalesTableProps {
  sales: Sale[];
  page?: number;
  totalPages?: number;
}

export function SalesTable({ sales, page = 1, totalPages = 1 }: SalesTableProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => setUser(json.data))
      .catch(() => {});
  }, []);

  const isAdmin = user?.role === "admin";

  async function handleDelete(sale: Sale) {
    if (
      !confirm(
        `Excluir a venda de "${sale.clientName ?? "Consumidor não identificado"}"? Os itens vinculados a produtos cadastrados voltam para o estoque. Essa ação não pode ser desfeita.`
      )
    )
      return;
    setError(null);
    setDeletingId(sale.id);
    try {
      const res = await fetch(`/api/sales/${sale.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao excluir venda.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Link href="/vendas/novo">
          <Button>
            <Plus size={16} /> Nova venda
          </Button>
        </Link>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

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
                {isAdmin && <th className="px-4 py-3 font-medium text-right"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sales.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-4 py-10 text-center text-text-muted">
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
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        title="Excluir venda"
                        disabled={deletingId === s.id}
                        onClick={() => handleDelete(s)}
                        className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-text-muted hover:bg-danger-bg hover:text-danger transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} basePath="/vendas" />
      </Card>
    </div>
  );
}
