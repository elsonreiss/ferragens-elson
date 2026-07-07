import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";

export function TopProductsList({ items }: { items: Array<{ nome: string; quantidade: number }> }) {
  const max = Math.max(...items.map((i) => i.quantidade), 1);
  return (
    <Card className="p-5">
      <h3 className="font-display font-semibold text-sm mb-4">Produtos mais vendidos</h3>
      <div className="flex flex-col gap-3">
        {items.length === 0 && <p className="text-sm text-text-muted">Sem vendas registradas ainda.</p>}
        {items.map((item) => (
          <div key={item.nome}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="truncate pr-2">{item.nome}</span>
              <span className="font-mono text-text-muted shrink-0">{item.quantidade}</span>
            </div>
            <div className="h-1.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-orange-500"
                style={{ width: `${Math.max((item.quantidade / max) * 100, 4)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function TopClientsList({ items }: { items: Array<{ nome: string; totalGasto: number }> }) {
  return (
    <Card className="p-5">
      <h3 className="font-display font-semibold text-sm mb-4">Clientes que mais compram</h3>
      <div className="flex flex-col divide-y divide-border">
        {items.length === 0 && <p className="text-sm text-text-muted">Sem clientes com compras ainda.</p>}
        {items.map((item, i) => (
          <div key={item.nome} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-navy-700/10 text-navy-700 dark:text-blue-500 text-xs font-display font-semibold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="text-sm">{item.nome}</span>
            </div>
            <span className="font-mono text-sm text-text-muted">{formatCurrency(item.totalGasto)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
