import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { container } from "@/container";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { CashFlowChart } from "@/components/financeiro/CashFlowChart";
import { ExpensesPanel } from "@/components/financeiro/ExpensesPanel";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FinanceiroPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const currentUser = token ? await container.authUseCases.getUserByToken(token) : null;
  // Funcionário não tem acesso ao módulo Financeiro.
  if (currentUser?.role === "funcionario") {
    redirect("/dashboard");
  }

  const summary = await container.financeUseCases.getSummary();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-semibold text-2xl">Financeiro</h1>
        <p className="text-text-muted text-sm mt-1">Fluxo de caixa, receitas e despesas do mês.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Receitas do mês" value={formatCurrency(summary.receitasMes)} icon={TrendingUp} tone="success" />
        <KpiCard label="Despesas do mês" value={formatCurrency(summary.despesasMes)} icon={TrendingDown} tone="danger" />
        <KpiCard label="Saldo do mês" value={formatCurrency(summary.saldoMes)} icon={Wallet} tone={summary.saldoMes >= 0 ? "success" : "danger"} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="p-5 xl:col-span-2">
          <h3 className="font-display font-semibold text-sm mb-4">Fluxo de caixa (últimos 14 dias)</h3>
          <CashFlowChart data={summary.fluxoPorDia} />
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-semibold text-sm mb-4">Despesas por categoria (mês)</h3>
          <div className="flex flex-col gap-3">
            {summary.despesasPorCategoria.length === 0 && (
              <p className="text-sm text-text-muted">Nenhuma despesa este mês.</p>
            )}
            {summary.despesasPorCategoria.map((d) => {
              const pct = summary.despesasMes > 0 ? (d.total / summary.despesasMes) * 100 : 0;
              return (
                <div key={d.categoria}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-muted">{d.categoria}</span>
                    <span className="font-mono">{formatCurrency(d.total)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-bg overflow-hidden">
                    <div className="h-full bg-orange-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <ExpensesPanel expenses={summary.despesasRecentes} />
    </div>
  );
}
