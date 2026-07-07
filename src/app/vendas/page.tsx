import { container } from "@/container";
import { SalesTable } from "@/components/vendas/SalesTable";

export const dynamic = "force-dynamic";

export default async function VendasPage() {
  const sales = await container.saleUseCases.list();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-semibold text-2xl">Vendas</h1>
        <p className="text-text-muted text-sm mt-1">
          {sales.length} venda(s) registrada(s). Toda venda dá saída automática no estoque e calcula o lucro.
        </p>
      </div>
      <SalesTable sales={sales} />
    </div>
  );
}
