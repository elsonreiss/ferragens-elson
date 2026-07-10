import { container } from "@/container";
import { SalesTable } from "@/components/vendas/SalesTable";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

interface VendasPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function VendasPage({ searchParams }: VendasPageProps) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const { items: sales, total } = await container.saleUseCases.listPage(page, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-semibold text-2xl">Vendas</h1>
        <p className="text-text-muted text-sm mt-1">
          {total} venda(s) registrada(s). Toda venda dá saída automática no estoque e calcula o lucro.
        </p>
      </div>
      <SalesTable sales={sales} page={page} totalPages={totalPages} />
    </div>
  );
}
