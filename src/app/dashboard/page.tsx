import { cookies } from "next/headers";
import { Boxes, DollarSign, PackageX, AlertTriangle, TrendingUp, Wallet, FileSpreadsheet, Coins } from "lucide-react";
import { container } from "@/container";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { TopProductsList, TopClientsList } from "@/components/dashboard/TopLists";
import { RecentSalesTable } from "@/components/dashboard/RecentSalesTable";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const summary = await container.dashboardUseCases.getSummary();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const currentUser = token ? await container.authUseCases.getUserByToken(token) : null;
  // Funcionário não tem acesso ao faturamento/lucro da empresa.
  const canSeeFinance = currentUser?.role !== "funcionario";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-semibold text-2xl">Dashboard</h1>
        <p className="text-text-muted text-sm mt-1">Visão geral da loja em tempo real.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <KpiCard label="Total de Produtos" value={String(summary.totalProdutos)} icon={Boxes} tone="navy" />
        {canSeeFinance && (
          <KpiCard
            label="Valor em Estoque"
            value={formatCurrency(summary.valorTotalEstoque)}
            icon={DollarSign}
            tone="navy"
          />
        )}
        <KpiCard
          label="Produtos em Falta"
          value={String(summary.produtosEmFalta)}
          icon={PackageX}
          tone="danger"
        />
        <KpiCard
          label="Estoque Baixo"
          value={String(summary.produtosEstoqueBaixo)}
          icon={AlertTriangle}
          tone="warning"
        />
        <KpiCard
          label="Orçamentos Realizados"
          value={String(summary.orcamentosRealizados)}
          icon={FileSpreadsheet}
          tone="orange"
        />
        <KpiCard
          label="Vendas Hoje"
          value={String(summary.quantidadeVendasHoje)}
          icon={TrendingUp}
          tone="success"
        />
        {canSeeFinance && (
          <>
            <KpiCard
              label="Vendido Hoje"
              value={formatCurrency(summary.totalVendidoHoje)}
              icon={TrendingUp}
              tone="success"
            />
            <KpiCard
              label="Vendido no Mês"
              value={formatCurrency(summary.totalVendidoMes)}
              icon={TrendingUp}
              tone="success"
            />
            <KpiCard label="Lucro do Dia" value={formatCurrency(summary.lucroHoje)} icon={Coins} tone="orange" />
            <KpiCard label="Lucro do Mês" value={formatCurrency(summary.lucroMes)} icon={Coins} tone="orange" />
            <KpiCard label="Gastos do Mês" value={formatCurrency(summary.gastosMes)} icon={Wallet} tone="danger" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {canSeeFinance && (
          <Card className="p-5 xl:col-span-2">
            <SalesChart
              faturamentoPorDia={summary.faturamentoPorDia}
              faturamentoPorSemana={summary.faturamentoPorSemana}
              faturamentoPorMes={summary.faturamentoPorMes}
            />
          </Card>
        )}
        <AlertsPanel alertas={summary.alertas} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <RecentSalesTable vendas={summary.ultimasVendas} />
        <TopProductsList items={summary.produtosMaisVendidos} />
        <TopClientsList items={summary.clientesQueMaisCompram} />
      </div>
    </div>
  );
}
