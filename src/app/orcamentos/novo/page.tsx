import { container } from "@/container";
import { BudgetForm } from "@/components/orcamentos/BudgetForm";

export const dynamic = "force-dynamic";

export default async function NovoOrcamentoPage() {
  const products = await container.productUseCases.list();
  const clients = await container.clientUseCases.list();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-semibold text-2xl">Novo Orçamento</h1>
        <p className="text-text-muted text-sm mt-1">Monte um orçamento para enviar ao cliente.</p>
      </div>
      <BudgetForm products={products} clients={clients} />
    </div>
  );
}
