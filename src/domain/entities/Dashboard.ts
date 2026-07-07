export interface DashboardSummary {
  totalProdutos: number;
  valorTotalEstoque: number;
  produtosEmFalta: number;
  produtosEstoqueBaixo: number;
  totalVendidoHoje: number;
  quantidadeVendasHoje: number;
  totalVendidoMes: number;
  lucroHoje: number;
  lucroMes: number;
  gastosMes: number;
  orcamentosRealizados: number;
  produtosMaisVendidos: Array<{ nome: string; quantidade: number }>;
  clientesQueMaisCompram: Array<{ nome: string; totalGasto: number }>;
  ultimasVendas: Array<{
    id: number;
    cliente: string;
    total: number;
    formaPagamento: string;
    data: string;
  }>;
  alertas: Array<{ tipo: "falta" | "baixo" | "info"; mensagem: string }>;
  faturamentoPorMes: Array<{ mes: string; total: number }>;
  faturamentoPorDia: Array<{ dia: string; total: number }>;
  faturamentoPorSemana: Array<{ semana: string; total: number }>;
}
