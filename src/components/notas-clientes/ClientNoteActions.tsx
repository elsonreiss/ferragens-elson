"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Printer, MessageCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ClientNote } from "@/domain/entities/ClientNote";
import { formatCurrency, formatDateTime } from "@/lib/format";

function buildWhatsAppText(note: ClientNote): string {
  const lines = [
    `*Nota fiado — Ferragens do Elson*`,
    `Cliente: ${note.clientName}`,
    "",
    "Itens:",
    ...note.items.map(
      (it) =>
        `• ${formatDateTime(it.addedAt)} — ${it.quantity}x ${it.productName} — ${formatCurrency(it.subtotal)}${
          it.paidAt ? " (pago)" : ""
        }`
    ),
    "",
    `Total em compras: ${formatCurrency(note.total)}`,
  ];
  if (note.paidTotal > 0) lines.push(`Pago até agora: ${formatCurrency(note.paidTotal)}`);
  lines.push(`*Saldo devedor: ${formatCurrency(note.balance)}*`);
  return lines.join("\n");
}

export function ClientNoteActions({ note, clientWhatsapp }: { note: ClientNote; clientWhatsapp?: string | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (
      !confirm(
        `Excluir a nota de "${note.clientName}"? Os itens ainda não pagos voltam para o estoque. Essa ação não pode ser desfeita.`
      )
    )
      return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/client-notes/${note.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao excluir nota.");
      router.push("/notas-clientes");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
      setLoading(false);
    }
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(buildWhatsAppText(note));
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
        <Button variant="danger" disabled={loading} onClick={handleDelete}>
          <Trash2 size={16} /> Excluir nota
        </Button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
