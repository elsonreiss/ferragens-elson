import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/format";
import { StockMovement } from "@/domain/entities/Common";

const typeLabel: Record<StockMovement["type"], string> = {
  entrada: "Entrada",
  saida: "Saída",
  ajuste: "Ajuste",
};

const typeTone: Record<StockMovement["type"], "success" | "danger" | "warning"> = {
  entrada: "success",
  saida: "danger",
  ajuste: "warning",
};

export function StockHistory({ movements }: { movements: StockMovement[] }) {
  return (
    <Card className="p-5">
      <h3 className="font-display font-semibold text-sm mb-4">Histórico de movimentações</h3>
      <div className="flex flex-col divide-y divide-border max-h-96 overflow-y-auto scrollbar-thin">
        {movements.length === 0 && <p className="text-sm text-text-muted">Nenhuma movimentação registrada ainda.</p>}
        {movements.map((m) => (
          <div key={m.id} className="flex items-center justify-between py-2.5 first:pt-0">
            <div className="flex items-center gap-2.5">
              <Badge tone={typeTone[m.type]}>{typeLabel[m.type]}</Badge>
              <span className="text-sm text-text-muted">{m.reason || "—"}</span>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm">{m.quantity}</p>
              <p className="text-xs text-text-muted">{formatDateTime(m.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
