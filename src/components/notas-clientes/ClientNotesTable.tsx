"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, Trash2, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { ClientNote } from "@/domain/entities/ClientNote";

export function ClientNotesTable({ notes: initialNotes }: { notes: ClientNote[] }) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);

  async function handleDelete(id: number, clientName: string) {
    const message = 'Excluir a nota de "' + clientName + '"? Os itens ainda nao pagos voltam para o estoque. Essa acao nao pode ser desfeita.';
    if (!confirm(message)) return;
    const res = await fetch(`/api/client-notes/${id}`, { method: "DELETE" });
    if (res.ok) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      router.refresh();
    } else {
      const json = await res.json();
      alert(json.error ?? "Erro ao excluir nota.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Link href="/notas-clientes/novo">
          <Button>
            <Plus size={16} /> Nova nota
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-bg">
              <tr className="text-left text-xs text-text-muted uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Ultima movimentacao</th>
                <th className="px-4 py-3 font-medium">Itens</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Saldo devedor</th>
                <th className="px-4 py-3 font-medium text-right">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {notes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-text-muted">
                    Nenhuma nota de cliente aberta ainda.
                  </td>
                </tr>
              )}
              {notes.map((n) => {
                const quitada = n.balance <= 0.005;
                return (
                  <tr key={n.id} className="hover:bg-bg/60 transition-colors">
                    <td className="px-4 py-3 font-medium">{n.clientName}</td>
                    <td className="px-4 py-3 text-text-muted">{formatDateTime(n.updatedAt)}</td>
                    <td className="px-4 py-3 text-text-muted">{n.items.length} item(ns)</td>
                    <td className="px-4 py-3">
                      <Badge tone={quitada ? "success" : "warning"}>{quitada ? "Quitada" : "Em aberto"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(n.balance)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/notas-clientes/${n.id}`}
                          title="Ver / editar nota"
                          className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-text-muted hover:bg-navy-700/10 hover:text-navy-700 dark:hover:text-blue-500 transition-colors"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          title="Excluir nota"
                          onClick={() => handleDelete(n.id, n.clientName)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:bg-danger-bg hover:text-danger transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
