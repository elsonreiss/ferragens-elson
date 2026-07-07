import { ensureDb, query, queryOne } from "../db/connection";
import { Expense, NewExpenseInput } from "@/domain/entities/Expense";
import { ExpenseRepository } from "@/domain/repositories";

interface ExpenseRow {
  id: number;
  description: string;
  category: string | null;
  amount: number;
  created_at: string;
}

function mapRow(row: ExpenseRow): Expense {
  return {
    id: row.id,
    description: row.description,
    category: row.category,
    amount: Number(row.amount),
    createdAt: row.created_at,
  };
}

export class SqliteExpenseRepository implements ExpenseRepository {
  async findAll(): Promise<Expense[]> {
    await ensureDb();
    const rows = await query<ExpenseRow>("SELECT * FROM expenses ORDER BY created_at DESC");
    return rows.map(mapRow);
  }

  async create(input: NewExpenseInput): Promise<Expense> {
    await ensureDb();
    const inserted = input.createdAt
      ? await queryOne<{ id: number }>(
          "INSERT INTO expenses (description, category, amount, created_at) VALUES ($1, $2, $3, $4) RETURNING id",
          [input.description, input.category ?? null, input.amount, input.createdAt]
        )
      : await queryOne<{ id: number }>(
          "INSERT INTO expenses (description, category, amount) VALUES ($1, $2, $3) RETURNING id",
          [input.description, input.category ?? null, input.amount]
        );
    const row = await queryOne<ExpenseRow>("SELECT * FROM expenses WHERE id = $1", [inserted!.id]);
    return mapRow(row!);
  }

  async delete(id: number): Promise<void> {
    await ensureDb();
    await query("DELETE FROM expenses WHERE id = $1", [id]);
  }
}
