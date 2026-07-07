import { NextRequest, NextResponse } from "next/server";
import { container } from "@/container";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const summary = await container.dashboardUseCases.getSummary();

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const currentUser = token ? await container.authUseCases.getUserByToken(token) : null;

  // Funcionário não tem acesso ao faturamento/lucro da empresa: devolve só
  // os campos não-financeiros do resumo.
  if (currentUser?.role === "funcionario") {
    const safeSummary = {
      totalProdutos: summary.totalProdutos,
      produtosEmFalta: summary.produtosEmFalta,
      produtosEstoqueBaixo: summary.produtosEstoqueBaixo,
      orcamentosRealizados: summary.orcamentosRealizados,
      quantidadeVendasHoje: summary.quantidadeVendasHoje,
      produtosMaisVendidos: summary.produtosMaisVendidos,
      clientesQueMaisCompram: summary.clientesQueMaisCompram,
      ultimasVendas: summary.ultimasVendas,
      alertas: summary.alertas,
    };
    return NextResponse.json({ data: safeSummary });
  }

  return NextResponse.json({ data: summary });
}
