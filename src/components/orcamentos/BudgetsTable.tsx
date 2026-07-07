"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Eye, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { Budget, BudgetStatus } from "@/domain/entities/Budget";

const STATUS_TONE: Record<BudgetStatus, "neutral" | "success" | "danger" | "orange"> = {
  aberto: "neutral",
  aprovado: "success",
  recusado: "danger",
  convertido: "orange",
};

const STATUS_LABEL: Record<BudgetStatus, string> = {
  aberto: "Aberto",
  aprovado: "Aprovado",
  recusado: "Recusado",
  convertido: "Convertido em venda",
};

export function BudgetsTable({ budgets: initialBudgets }: { budgets: Budget[] }) {
  const router = useRouter();
  const [budgets, setBudgets] = useState(initialBudgets);

  async function handleDelete(id: number) {
    if (!confirm(`Excluir o orçamento #${id}? Essa ação não pode ser desfeita.`)) return;
    const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
    if (res.ok) {
      setBudgets((prev) => prev.filter((b) => b.id !== id));
      router.refresh();
    } else {
      const json = await res.json();
      alert(json.error ?? "Erro ao excluir orçamento.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Link href="/orcamentos/novo">
          <Button>
            <Plus size={16} /> Novo orçamento
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
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {budgets.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-text-muted">
                    Nenhum orçamento criado ainda.
                  </td>
                </tr>
              )}
              {budgets.map((b) => (
                <tr key={b.id} className="hover:bg-bg/60 transition-colors">
                  <td className="px-4 py-3 text-text-muted">{formatDate(b.createdAt)}</td>
                  <td className="px-4 py-3 font-medium">{b.clientName ?? "—"}</td>
                  <td className="px-4 py-3 text-text-muted">{b.items.length} item(ns)</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[b.status]}>{STATUS_LABEL[b.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(b.total)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/orcamentos/${b.id}`}
                        title="Ver / imprimir"
                        className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-text-muted hover:bg-navy-700/10 hover:text-navy-700 dark:hover:text-blue-500 transition-colors"
                      >
                        <Eye size={16} />
                      </Link>
                      <button
                        title="Excluir"
                        onClick={() => handleDelete(b.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:bg-danger-bg hover:text-danger transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
