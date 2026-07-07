import { container } from "@/container";
import { BudgetsTable } from "@/components/orcamentos/BudgetsTable";

export const dynamic = "force-dynamic";

export default async function OrcamentosPage() {
  const budgets = await container.budgetUseCases.list();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-semibold text-2xl">Orçamentos</h1>
        <p className="text-text-muted text-sm mt-1">
          {budgets.length} orçamento(s) criado(s). Crie, imprima, compartilhe por WhatsApp e converta em vendas.
        </p>
      </div>
      <BudgetsTable budgets={budgets} />
    </div>
  );
}
