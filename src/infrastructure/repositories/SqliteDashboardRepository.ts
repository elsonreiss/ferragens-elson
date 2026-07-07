import { ensureDb, query, queryOne } from "../db/connection";
import { DashboardRepository } from "@/domain/repositories";
import { DashboardSummary } from "@/domain/entities/Dashboard";
import { SqliteProductRepository } from "./SqliteProductRepository";

export class SqliteDashboardRepository implements DashboardRepository {
  async getSummary(): Promise<DashboardSummary> {
    await ensureDb();
    const productRepo = new SqliteProductRepository();

    const totalProdutos = await productRepo.count();
    const valorTotalEstoque = await productRepo.totalStockValue();
    const produtosEmFalta = await productRepo.countOutOfStock();
    const produtosEstoqueBaixo = await productRepo.countLowStock();

    const vendidoHoje = await queryOne<{ total: number; lucro: number; qtd: number }>(`
      SELECT COALESCE(SUM(total), 0) as total, COALESCE(SUM(profit), 0) as lucro, COUNT(*)::int as qtd
      FROM sales WHERE created_at::date = CURRENT_DATE
    `);

    const vendidoMes = await queryOne<{ total: number; lucro: number }>(`
      SELECT COALESCE(SUM(total), 0) as total, COALESCE(SUM(profit), 0) as lucro
      FROM sales WHERE to_char(created_at, 'YYYY-MM') = to_char(CURRENT_DATE, 'YYYY-MM')
    `);

    const gastosMes = await queryOne<{ total: number }>(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses WHERE to_char(created_at, 'YYYY-MM') = to_char(CURRENT_DATE, 'YYYY-MM')
    `);

    const orcamentosRealizados = await queryOne<{ c: number }>(`SELECT COUNT(*)::int as c FROM budgets`);

    const produtosMaisVendidos = await productRepo.topSelling(5);

    const clientesQueMaisCompramRaw = await query<{ nome: string; totalGasto: number }>(`
      SELECT client_name as nome, COALESCE(SUM(total), 0) as "totalGasto"
      FROM sales
      WHERE client_name IS NOT NULL
      GROUP BY client_name
      ORDER BY "totalGasto" DESC
      LIMIT 5
    `);
    const clientesQueMaisCompram = clientesQueMaisCompramRaw.map((r) => ({ nome: r.nome, totalGasto: Number(r.totalGasto) }));

    const ultimasVendasRaw = await query<{ id: number; cliente: string; total: number; formaPagamento: string; data: string }>(`
      SELECT id, client_name as cliente, total, payment_method as "formaPagamento", created_at as data
      FROM sales
      ORDER BY created_at DESC
      LIMIT 8
    `);
    const ultimasVendas = ultimasVendasRaw.map((r) => ({
      id: r.id,
      cliente: r.cliente,
      total: Number(r.total),
      formaPagamento: r.formaPagamento,
      data: r.data,
    }));

    const faturamentoPorMesRaw = await query<{ mes: string; total: number }>(`
      SELECT to_char(created_at, 'YYYY-MM') as mes, COALESCE(SUM(total), 0) as total
      FROM sales
      GROUP BY mes
      ORDER BY mes ASC
    `);
    const faturamentoPorMes = faturamentoPorMesRaw.map((r) => ({ mes: r.mes, total: Number(r.total) }));

    // Faturamento por dia (últimos 14 dias, incluindo dias sem venda)
    const diarioRaw = await query<{ dia: string; total: number }>(`
      SELECT created_at::date as dia, COALESCE(SUM(total), 0) as total
      FROM sales
      WHERE created_at::date >= CURRENT_DATE - INTERVAL '13 days'
      GROUP BY dia
    `);
    const diarioMap = new Map(diarioRaw.map((r) => [String(r.dia), Number(r.total)]));
    const faturamentoPorDia: DashboardSummary["faturamentoPorDia"] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      faturamentoPorDia.push({ dia: key, total: diarioMap.get(key) ?? 0 });
    }

    // Faturamento por semana (últimas 8 semanas, semana começando na segunda-feira)
    const mondayOf = (date: Date): Date => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      return d;
    };
    const vendasRecentesRaw = await query<{ dia: string; total: number }>(`
      SELECT created_at::date as dia, total
      FROM sales
      WHERE created_at::date >= CURRENT_DATE - INTERVAL '69 days'
    `);
    const semanaMap = new Map<string, number>();
    for (const r of vendasRecentesRaw) {
      const key = mondayOf(new Date(`${r.dia}T00:00:00`)).toISOString().slice(0, 10);
      semanaMap.set(key, (semanaMap.get(key) ?? 0) + Number(r.total));
    }
    const faturamentoPorSemana: DashboardSummary["faturamentoPorSemana"] = [];
    for (let i = 7; i >= 0; i--) {
      const monday = mondayOf(new Date());
      monday.setDate(monday.getDate() - i * 7);
      const key = monday.toISOString().slice(0, 10);
      faturamentoPorSemana.push({ semana: key, total: semanaMap.get(key) ?? 0 });
    }

    const alertas: DashboardSummary["alertas"] = [];
    if (produtosEmFalta > 0) {
      alertas.push({ tipo: "falta", mensagem: `${produtosEmFalta} produto(s) sem estoque disponível.` });
    }
    if (produtosEstoqueBaixo > 0) {
      alertas.push({ tipo: "baixo", mensagem: `${produtosEstoqueBaixo} produto(s) com estoque abaixo do mínimo.` });
    }
    if (alertas.length === 0) {
      alertas.push({ tipo: "info", mensagem: "Estoque sob controle — nenhum alerta no momento." });
    }

    return {
      totalProdutos,
      valorTotalEstoque,
      produtosEmFalta,
      produtosEstoqueBaixo,
      totalVendidoHoje: Number(vendidoHoje!.total),
      quantidadeVendasHoje: Number(vendidoHoje!.qtd),
      totalVendidoMes: Number(vendidoMes!.total),
      lucroHoje: Number(vendidoHoje!.lucro),
      lucroMes: Number(vendidoMes!.lucro),
      gastosMes: Number(gastosMes!.total),
      orcamentosRealizados: orcamentosRealizados!.c,
      produtosMaisVendidos,
      clientesQueMaisCompram,
      ultimasVendas,
      alertas,
      faturamentoPorMes,
      faturamentoPorDia,
      faturamentoPorSemana,
    };
  }
}
