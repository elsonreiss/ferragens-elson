import { container } from "@/container";
import { SaleForm } from "@/components/vendas/SaleForm";

export const dynamic = "force-dynamic";

export default async function NovaVendaPage() {
  const products = await container.productUseCases.list();
  const clients = await container.clientUseCases.list();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-semibold text-2xl">Nova Venda</h1>
        <p className="text-text-muted text-sm mt-1">Registre uma venda para um cliente.</p>
      </div>
      <SaleForm products={products} clients={clients} />
    </div>
  );
}
