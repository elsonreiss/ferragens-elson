"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Printer, MessageCircle, CheckCircle2, XCircle, ArrowRightLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Budget, BudgetStatus } from "@/domain/entities/Budget";
import { formatCurrency } from "@/lib/format";

function buildWhatsAppText(budget: Budget): string {
  const lines = [
    `*Orçamento #${budget.id} — Ferragens do Elson*`,
    "",
    ...budget.items.map((it) => `• ${it.quantity}x ${it.productName} — ${formatCurrency(it.subtotal)}`),
    "",
  ];
  if (budget.discount > 0) lines.push(`Desconto: -${formatCurrency(budget.discount)}`);
  lines.push(`*Total: ${formatCurrency(budget.total)}*`);
  if (budget.validUntil) lines.push(`Válido até: ${budget.validUntil.split("-").reverse().join("/")}`);
  return lines.join("\n");
}

export function BudgetActions({ budget, clientWhatsapp }: { budget: Budget; clientWhatsapp?: string | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAct = budget.status !== "convertido";

  async function updateStatus(status: BudgetStatus) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/budgets/${budget.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao atualizar status.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  async function convertToSale() {
    if (!confirm("Converter este orçamento em venda? O estoque dos produtos será baixado.")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/budgets/${budget.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao converter em venda.");
      router.push("/vendas");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Excluir o orçamento #${budget.id}? Essa ação não pode ser desfeita.`)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/budgets/${budget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao excluir orçamento.");
      router.push("/orcamentos");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
      setLoading(false);
    }
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(buildWhatsAppText(budget));
    const phone = clientWhatsapp?.replace(/\D/g, "");
    const url = phone ? `https://wa.me/55${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, "_blank");
  }

  return (
    <div className="flex flex-col gap-3 no-print">
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer size={16} /> Imprimir / Salvar PDF
        </Button>
        <Button variant="secondary" onClick={shareWhatsApp}>
          <MessageCircle size={16} /> Enviar por WhatsApp
        </Button>
      </div>

      {canAct && (
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" disabled={loading} onClick={() => updateStatus("aprovado")}>
            <CheckCircle2 size={16} /> Marcar como aprovado
          </Button>
          <Button variant="ghost" disabled={loading} onClick={() => updateStatus("recusado")}>
            <XCircle size={16} /> Marcar como recusado
          </Button>
          <Button disabled={loading} onClick={convertToSale}>
            <ArrowRightLeft size={16} /> Converter em venda
          </Button>
        </div>
      )}

      <div>
        <Button variant="danger" disabled={loading} onClick={handleDelete}>
          <Trash2 size={16} /> Excluir orçamento
        </Button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
