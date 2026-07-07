import { SupplierForm } from "@/components/fornecedores/SupplierForm";

export default function NovoFornecedorPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-semibold text-2xl">Novo Fornecedor</h1>
        <p className="text-text-muted text-sm mt-1">Preencha os dados para cadastrar um novo fornecedor.</p>
      </div>
      <SupplierForm />
    </div>
  );
}
