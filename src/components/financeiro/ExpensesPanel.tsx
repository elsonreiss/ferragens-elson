"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatCurrency, formatDate } from "@/lib/format";
import { Expense } from "@/domain/entities/Expense";
import { ExpenseModal } from "@/components/financeiro/ExpenseModal";

export function ExpensesPanel({ expenses }: { expenses: Expense[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(id: number) {
    setDeleting(true);
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    setDeleting(false);
    setConfirmId(null);
  }

  return (
    <Card className="p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-sm">Despesas recentes</h3>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus size={14} /> Nova despesa
        </Button>
      </div>
      <div className="flex flex-col divide-y divide-border">
        {expenses.length === 0 && (
          <p className="text-sm text-text-muted py-6 text-center">Nenhuma despesa registrada.</p>
        )}
        {expenses.map((e) => (
          <div key={e.id} className="flex items-center justify-between py-2.5">
            <div>
              <p className="text-sm font-medium">{e.description}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {e.category && <Badge tone="neutral">{e.category}</Badge>}
                <span className="text-xs text-text-muted">{formatDate(e.createdAt)}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-danger">{formatCurrency(e.amount)}</span>
              <button
                onClick={() => setConfirmId(e.id)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:bg-danger-bg hover:text-danger transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && <ExpenseModal onClose={() => setModalOpen(false)} />}

      {confirmId !== null && (
        <ConfirmDialog
          title="Excluir despesa"
          message="Excluir esta despesa?"
          confirmLabel="Excluir"
          loading={deleting}
          onConfirm={() => handleDelete(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </Card>
  );
}
