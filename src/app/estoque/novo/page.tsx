import { container } from "@/container";
import { ProductForm } from "@/components/estoque/ProductForm";

export const dynamic = "force-dynamic";

export default async function NovoProdutoPage() {
  const categories = await container.categoryRepository.findAll();
  const suppliers = await container.supplierRepository.findAll();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-semibold text-2xl">Novo Produto</h1>
        <p className="text-text-muted text-sm mt-1">Preencha os dados para cadastrar um novo item no estoque.</p>
      </div>
      <ProductForm categories={categories} suppliers={suppliers} />
    </div>
  );
}
