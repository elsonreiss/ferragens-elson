import { notFound } from "next/navigation";
import { container } from "@/container";
import { ProductForm } from "@/components/estoque/ProductForm";
import { StockHistory } from "@/components/estoque/StockHistory";

export const dynamic = "force-dynamic";

export default async function EditarProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await container.productUseCases.getById(Number(id));
  if (!product) notFound();

  const categories = await container.categoryRepository.findAll();
  const suppliers = await container.supplierRepository.findAll();
  const movements = await container.stockMovementUseCases.history(product.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-semibold text-2xl">Editar Produto</h1>
        <p className="text-text-muted text-sm mt-1">
          {product.name} <span className="font-mono">({product.code})</span>
        </p>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <ProductForm product={product} categories={categories} suppliers={suppliers} />
        </div>
        <div>
          <StockHistory movements={movements} />
        </div>
      </div>
    </div>
  );
}
