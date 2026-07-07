import { notFound } from "next/navigation";
import { container } from "@/container";
import { SupplierForm } from "@/components/fornecedores/SupplierForm";

export const dynamic = "force-dynamic";

export default async function EditarFornecedorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supplier = await container.supplierUseCases.getById(Number(id));
  if (!supplier) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-semibold text-2xl">Editar Fornecedor</h1>
        <p className="text-text-muted text-sm mt-1">{supplier.name}</p>
      </div>
      <SupplierForm supplier={supplier} />
    </div>
  );
}
