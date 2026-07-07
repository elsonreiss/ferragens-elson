import { ensureDb, query, queryOne } from "../db/connection";
import { Budget, BudgetItem, NewBudgetInput, BudgetStatus } from "@/domain/entities/Budget";
import { BudgetRepository } from "@/domain/repositories";

interface BudgetRow {
  id: number;
  client_id: number | null;
  client_name: string | null;
  total: number;
  status: BudgetStatus;
  discount: number;
  valid_until: string | null;
  notes: string | null;
  created_at: string;
}

interface BudgetItemRow {
  id: number;
  budget_id: number;
  product_id: number | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

function mapItem(row: BudgetItemRow): BudgetItem {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    subtotal: Number(row.subtotal),
  };
}

export class SqliteBudgetRepository implements BudgetRepository {
  async findAll(): Promise<Budget[]> {
    await ensureDb();
    const rows = await query<BudgetRow>("SELECT * FROM budgets ORDER BY created_at DESC");
    const result: Budget[] = [];
    for (const row of rows) result.push(await this.mapBudget(row));
    return result;
  }

  async findById(id: number): Promise<Budget | null> {
    await ensureDb();
    const row = await queryOne<BudgetRow>("SELECT * FROM budgets WHERE id = $1", [id]);
    return row ? await this.mapBudget(row) : null;
  }

  private async mapBudget(row: BudgetRow): Promise<Budget> {
    const itemRows = await query<BudgetItemRow>("SELECT * FROM budget_items WHERE budget_id = $1", [row.id]);
    return {
      id: row.id,
      clientId: row.client_id,
      clientName: row.client_name,
      items: itemRows.map(mapItem),
      discount: Number(row.discount),
      total: Number(row.total),
      status: row.status,
      validUntil: row.valid_until,
      notes: row.notes,
      createdAt: row.created_at,
    };
  }

  async create(input: NewBudgetInput): Promise<Budget> {
    await ensureDb();

    let clientName = input.clientName ?? null;
    if (input.clientId) {
      const client = await queryOne<{ name: string }>("SELECT name FROM clients WHERE id = $1", [input.clientId]);
      clientName = client?.name ?? clientName;
    }

    const subtotal = input.items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
    const discount = input.discount ?? 0;
    const total = Math.max(0, subtotal - discount);

    const inserted = await queryOne<{ id: number }>(
      `INSERT INTO budgets (client_id, client_name, total, status, discount, valid_until, notes)
       VALUES ($1, $2, $3, 'aberto', $4, $5, $6)
       RETURNING id`,
      [input.clientId ?? null, clientName, total, discount, input.validUntil ?? null, input.notes ?? null]
    );

    const budgetId = inserted!.id;

    for (const item of input.items) {
      const product = await queryOne<{ name: string }>("SELECT name FROM products WHERE id = $1", [item.productId]);
      await query(
        `INSERT INTO budget_items (budget_id, product_id, product_name, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [budgetId, item.productId, product?.name ?? "Produto removido", item.quantity, item.unitPrice, item.quantity * item.unitPrice]
      );
    }

    return (await this.findById(budgetId))!;
  }

  async updateStatus(id: number, status: BudgetStatus): Promise<Budget> {
    await ensureDb();
    await query("UPDATE budgets SET status = $1 WHERE id = $2", [status, id]);
    const budget = await this.findById(id);
    if (!budget) throw new Error("Orçamento não encontrado.");
    return budget;
  }

  async delete(id: number): Promise<void> {
    await ensureDb();
    // budget_items tem ON DELETE CASCADE em budget_id, então é removido junto.
    await query("DELETE FROM budgets WHERE id = $1", [id]);
  }
}
