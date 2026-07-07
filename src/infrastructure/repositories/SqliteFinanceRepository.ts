import { ensureDb, query, queryOne } from "../db/connection";
import { FinanceSummary } from "@/domain/entities/Expense";
import { FinanceRepository } from "@/domain/repositories";

export class SqliteFinanceRepository implements FinanceRepository {
  async getSummary(): Promise<FinanceSummary> {
    await ensureDb();

    const receitasMesRow = await queryOne<{ total: number }>(`
      SELECT COALESCE(SUM(total), 0) as total FROM sales WHERE to_char(created_at, 'YYYY-MM') = to_char(CURRENT_DATE, 'YYYY-MM')
    `);

    const despesasMesRow = await queryOne<{ total: number }>(`
      SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE to_char(created_at, 'YYYY-MM') = to_char(CURRENT_DATE, 'YYYY-MM')
    `);

    const despesasPorCategoriaRaw = await query<{ categoria: string; total: number }>(`
      SELECT COALESCE(category, 'Sem categoria') as categoria, COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE to_char(created_at, 'YYYY-MM') = to_char(CURRENT_DATE, 'YYYY-MM')
      GROUP BY categoria
      ORDER BY total DESC
    `);

    const receitasPorDiaRaw = await query<{ dia: string; total: number }>(`
      SELECT created_at::date as dia, COALESCE(SUM(total), 0) as total
      FROM sales WHERE created_at::date >= CURRENT_DATE - INTERVAL '13 days'
      GROUP BY dia
    `);
    const despesasPorDiaRaw = await query<{ dia: string; total: number }>(`
      SELECT created_at::date as dia, COALESCE(SUM(amount), 0) as total
      FROM expenses WHERE created_at::date >= CURRENT_DATE - INTERVAL '13 days'
      GROUP BY dia
    `);
    const receitasMap = new Map(receitasPorDiaRaw.map((r) => [String(r.dia), Number(r.total)]));
    const despesasMap = new Map(despesasPorDiaRaw.map((r) => [String(r.dia), Number(r.total)]));

    const fluxoPorDia: FinanceSummary["fluxoPorDia"] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      fluxoPorDia.push({ dia: key, receitas: receitasMap.get(key) ?? 0, despesas: despesasMap.get(key) ?? 0 });
    }

    const despesasRecentesRaw = await query<{ id: number; description: string; category: string | null; amount: number; created_at: string }>(`
      SELECT * FROM expenses ORDER BY created_at DESC LIMIT 10
    `);
    const despesasRecentes = despesasRecentesRaw.map((r) => ({
      id: r.id,
      description: r.description,
      category: r.category,
      amount: Number(r.amount),
      createdAt: r.created_at,
    }));

    return {
      receitasMes: Number(receitasMesRow!.total),
      despesasMes: Number(despesasMesRow!.total),
      saldoMes: Number(receitasMesRow!.total) - Number(despesasMesRow!.total),
      despesasPorCategoria: despesasPorCategoriaRaw.map((r) => ({ categoria: r.categoria, total: Number(r.total) })),
      fluxoPorDia,
      despesasRecentes,
    };
  }
}
