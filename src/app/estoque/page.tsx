import { container } from "@/container";
import { ProductsTable } from "@/components/estoque/ProductsTable";

export const dynamic = "force-dynamic";

export default async function EstoquePage() {
  const products = await container.productUseCases.list();
  const categories = await container.categoryRepository.findAll();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-semibold text-2xl">Controle de Estoque</h1>
        <p className="text-text-muted text-sm mt-1">
          {products.length} produto(s) cadastrado(s). Gerencie cadastro, quantidades e alertas de reposição.
        </p>
      </div>
      <ProductsTable initialProducts={products} categories={categories} />
    </div>
  );
}
