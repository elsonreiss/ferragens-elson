import { ensureDb, query } from "../db/connection";
import { MonthlyFinance, SlowMovingProduct, StockValuationRow } from "@/domain/entities/Report";
import { ReportRepository } from "@/domain/repositories";

export class SqliteReportRepository implements ReportRepository {
  async monthlyFinance(months: number): Promise<MonthlyFinance[]> {
    await ensureDb();
    const receitasRaw = await query<{ mes: string; total: number }>(
      `SELECT to_char(created_at, 'YYYY-MM') as mes, COALESCE(SUM(total), 0) as total
       FROM sales
       WHERE created_at >= CURRENT_DATE - make_interval(months => $1::int)
       GROUP BY mes`,
      [months]
    );
    const despesasRaw = await query<{ mes: string; total: number }>(
      `SELECT to_char(created_at, 'YYYY-MM') as mes, COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE created_at >= CURRENT_DATE - make_interval(months => $1::int)
       GROUP BY mes`,
      [months]
    );

    const receitasMap = new Map(receitasRaw.map((r) => [r.mes, Number(r.total)]));
    const despesasMap = new Map(despesasRaw.map((r) => [r.mes, Number(r.total)]));

    const result: MonthlyFinance[] = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      result.push({ mes: key, receitas: receitasMap.get(key) ?? 0, despesas: despesasMap.get(key) ?? 0 });
    }
    return result;
  }

  async slowMovingProducts(limit: number): Promise<SlowMovingProduct[]> {
    await ensureDb();
    // Postgres não deixa reaproveitar um alias do SELECT (last_movement_at)
    // dentro de uma expressão do ORDER BY — só como item "solto". Por isso o
    // agrupamento vira uma subconsulta: dentro dela o alias já é uma coluna
    // de verdade, então pode ser usado livremente na ordenação externa.
    const rows = await query<{ id: number; code: string; name: string; quantity: number; last_movement_at: string | null }>(
      `SELECT * FROM (
         SELECT p.id, p.code, p.name, p.quantity, MAX(sm.created_at) as last_movement_at
         FROM products p
         LEFT JOIN stock_movements sm ON sm.product_id = p.id AND sm.type = 'saida'
         WHERE p.quantity > 0
         GROUP BY p.id
       ) t
       ORDER BY (last_movement_at IS NULL) DESC, last_movement_at ASC, quantity DESC
       LIMIT $1`,
      [limit]
    );
    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      quantity: Number(r.quantity),
      lastMovementAt: r.last_movement_at,
    }));
  }

  async stockValuation(): Promise<StockValuationRow[]> {
    await ensureDb();
    const rows = await query<{ id: number; code: string; name: string; quantity: number; purchase_price: number }>(
      `SELECT id, code, name, quantity, purchase_price
       FROM products
       WHERE quantity > 0
       ORDER BY (quantity * purchase_price) DESC`
    );
    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      quantity: Number(r.quantity),
      purchasePrice: Number(r.purchase_price),
      total: Number(r.quantity) * Number(r.purchase_price),
    }));
  }
}
