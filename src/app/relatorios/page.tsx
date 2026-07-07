import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { container } from "@/container";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { RelatoriosClient } from "@/components/relatorios/RelatoriosClient";

export const dynamic = "force-dynamic";

export default async function RelatoriosPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const currentUser = token ? await container.authUseCases.getUserByToken(token) : null;
  // Funcionário não tem acesso ao módulo Relatórios.
  if (currentUser?.role === "funcionario") {
    redirect("/dashboard");
  }

  const sales = await container.reportUseCases.allSales();
  const stockValuation = await container.reportUseCases.stockValuation();
  const slowMoving = await container.reportUseCases.slowMovingProducts(10);
  const monthlyFinance = await container.reportUseCases.monthlyFinance(6);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-semibold text-2xl">Relatórios</h1>
        <p className="text-text-muted text-sm mt-1">Relatórios gerenciais com exportação em CSV (compatível com Excel).</p>
      </div>
      <RelatoriosClient
        sales={sales}
        stockValuation={stockValuation}
        slowMoving={slowMoving}
        monthlyFinance={monthlyFinance}
      />
    </div>
  );
}
