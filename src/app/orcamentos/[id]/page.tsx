import { notFound } from "next/navigation";
import { container } from "@/container";
import { BudgetActions } from "@/components/orcamentos/BudgetActions";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { BudgetStatus } from "@/domain/entities/Budget";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<BudgetStatus, string> = {
  aberto: "Aberto",
  aprovado: "Aprovado",
  recusado: "Recusado",
  convertido: "Convertido em venda",
};

export default async function OrcamentoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const budget = await container.budgetUseCases.getById(Number(id));
  if (!budget) notFound();

  const client = budget.clientId ? await container.clientUseCases.getById(budget.clientId) : null;

  return (
    <div className="flex flex-col gap-6 print-area">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="font-display font-semibold text-2xl">Orçamento #{budget.id}</h1>
          <p className="text-text-muted text-sm mt-1">Criado em {formatDate(budget.createdAt)}</p>
        </div>
        <Badge tone={budget.status === "convertido" ? "orange" : budget.status === "aprovado" ? "success" : budget.status === "recusado" ? "danger" : "neutral"}>
          {STATUS_LABEL[budget.status]}
        </Badge>
      </div>

      <BudgetActions budget={budget} clientWhatsapp={client?.whatsapp ?? client?.phone} />

      <Card className="p-8 flex flex-col gap-6">
        <div className="flex items-start justify-between border-b border-border pb-6">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Ferragens do Elson" className="w-14 h-14" />
            <div>
              <p className="font-display font-bold text-lg">Ferragens do Elson</p>
              <p className="text-xs text-text-muted">Materiais de construção e ferragens</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-display font-semibold text-lg">Orçamento #{budget.id}</p>
            <p className="text-xs text-text-muted">Data: {formatDate(budget.createdAt)}</p>
            {budget.validUntil && (
              <p className="text-xs text-text-muted">Válido até: {formatDate(budget.validUntil)}</p>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Cliente</p>
          <p className="font-medium">{budget.clientName ?? "Não informado"}</p>
          {client?.phone && <p className="text-sm text-text-muted">{client.phone}</p>}
          {client?.address && <p className="text-sm text-text-muted">{client.address} — {client.city}/{client.state}</p>}
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-text-muted uppercase tracking-wide border-b border-border">
              <th className="py-2">Produto</th>
              <th className="py-2 text-right">Qtd.</th>
              <th className="py-2 text-right">Preço unit.</th>
              <th className="py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {budget.items.map((item) => (
              <tr key={item.id} className="border-b border-border/60">
                <td className="py-2">{item.productName}</td>
                <td className="py-2 text-right font-mono">{item.quantity}</td>
                <td className="py-2 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                <td className="py-2 text-right font-mono">{formatCurrency(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64 flex flex-col gap-1">
            {budget.discount > 0 && (
              <div className="flex justify-between text-sm text-text-muted">
                <span>Desconto</span>
                <span className="font-mono">-{formatCurrency(budget.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-display font-semibold pt-1 border-t border-border">
              <span>Total</span>
              <span className="font-mono">{formatCurrency(budget.total)}</span>
            </div>
          </div>
        </div>

        {budget.notes && (
          <div className="border-t border-border pt-4">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Observações</p>
            <p className="text-sm whitespace-pre-line">{budget.notes}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
