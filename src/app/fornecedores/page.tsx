import { container } from "@/container";
import { SuppliersTable } from "@/components/fornecedores/SuppliersTable";

export const dynamic = "force-dynamic";

export default async function FornecedoresPage() {
  const suppliers = await container.supplierUseCases.list();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-semibold text-2xl">Fornecedores</h1>
        <p className="text-text-muted text-sm mt-1">
          {suppliers.length} fornecedor(es) cadastrado(s). Gerencie seus parceiros comerciais.
        </p>
      </div>
      <SuppliersTable initialSuppliers={suppliers} />
    </div>
  );
}
