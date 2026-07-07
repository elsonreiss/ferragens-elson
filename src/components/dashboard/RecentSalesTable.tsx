import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { DashboardSummary } from "@/domain/entities/Dashboard";

const paymentTone: Record<string, "success" | "orange" | "neutral"> = {
  Pix: "success",
  Cartão: "orange",
  Dinheiro: "neutral",
  Boleto: "neutral",
};

export function RecentSalesTable({ vendas }: { vendas: DashboardSummary["ultimasVendas"] }) {
  return (
    <Card className="p-5">
      <h3 className="font-display font-semibold text-sm mb-4">Últimas vendas</h3>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-text-muted uppercase tracking-wide">
              <th className="pb-2 font-medium">Cliente</th>
              <th className="pb-2 font-medium">Pagamento</th>
              <th className="pb-2 font-medium">Data</th>
              <th className="pb-2 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {vendas.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-text-muted">
                  Nenhuma venda registrada ainda.
                </td>
              </tr>
            )}
            {vendas.map((v) => (
              <tr key={v.id}>
                <td className="py-2.5">{v.cliente || "Cliente avulso"}</td>
                <td className="py-2.5">
                  <Badge tone={paymentTone[v.formaPagamento] ?? "neutral"}>{v.formaPagamento}</Badge>
                </td>
                <td className="py-2.5 text-text-muted">{formatDateTime(v.data)}</td>
                <td className="py-2.5 text-right font-mono">{formatCurrency(v.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
