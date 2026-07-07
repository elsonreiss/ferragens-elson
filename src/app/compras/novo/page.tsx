import { container } from "@/container";
import { PurchaseForm } from "@/components/compras/PurchaseForm";

export const dynamic = "force-dynamic";

export default async function NovaCompraPage() {
  const products = await container.productUseCases.list();
  const suppliers = await container.supplierUseCases.list();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-semibold text-2xl">Nova Compra</h1>
        <p className="text-text-muted text-sm mt-1">Registre uma compra de mercadorias e atualize o estoque.</p>
      </div>
      <PurchaseForm products={products} suppliers={suppliers} />
    </div>
  );
}
