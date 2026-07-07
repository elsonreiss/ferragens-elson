import { container } from "@/container";
import { PurchasesTable } from "@/components/compras/PurchasesTable";

export const dynamic = "force-dynamic";

export default async function ComprasPage() {
  const purchases = await container.purchaseUseCases.list();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-semibold text-2xl">Compras</h1>
        <p className="text-text-muted text-sm mt-1">
          {purchases.length} compra(s) registrada(s). Toda compra dá entrada automática no estoque.
        </p>
      </div>
      <PurchasesTable purchases={purchases} />
    </div>
  );
}
