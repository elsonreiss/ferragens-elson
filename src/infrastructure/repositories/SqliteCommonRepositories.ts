import { ensureDb, query, queryOne } from "../db/connection";
import { Category, Supplier, NewSupplierInput, SupplierFilters, StockMovement, NewStockMovementInput } from "@/domain/entities/Common";
import { CategoryRepository, SupplierRepository, StockMovementRepository } from "@/domain/repositories";

export class SqliteCategoryRepository implements CategoryRepository {
  async findAll(): Promise<Category[]> {
    await ensureDb();
    const rows = await query<{ id: number; name: string }>("SELECT id, name FROM categories ORDER BY name ASC");
    return rows.map((r) => ({ id: r.id, name: r.name }));
  }

  async create(name: string): Promise<Category> {
    await ensureDb();
    const row = await queryOne<{ id: number }>("INSERT INTO categories (name) VALUES ($1) RETURNING id", [name]);
    return { id: row!.id, name };
  }
}

interface SupplierRow {
  id: number; name: string; company: string | null; cnpj: string | null; phone: string | null;
  whatsapp: string | null; email: string | null; address: string | null; city: string | null; state: string | null; notes: string | null;
}

function mapSupplier(row: SupplierRow): Supplier {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    cnpj: row.cnpj,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    address: row.address,
    city: row.city,
    state: row.state,
    notes: row.notes,
  };
}

export class SqliteSupplierRepository implements SupplierRepository {
  async findAll(filters: SupplierFilters = {}): Promise<Supplier[]> {
    await ensureDb();
    let sql = "SELECT * FROM suppliers";
    const params: string[] = [];
    if (filters.search) {
      const like = `%${filters.search}%`;
      params.push(like, like, like);
      sql += " WHERE (name ILIKE $1 OR company ILIKE $2 OR cnpj ILIKE $3)";
    }
    sql += " ORDER BY name ASC";
    const rows = await query<SupplierRow>(sql, params);
    return rows.map(mapSupplier);
  }

  async findById(id: number): Promise<Supplier | null> {
    await ensureDb();
    const row = await queryOne<SupplierRow>("SELECT * FROM suppliers WHERE id = $1", [id]);
    return row ? mapSupplier(row) : null;
  }

  async create(input: NewSupplierInput): Promise<Supplier> {
    await ensureDb();
    const row = await queryOne<{ id: number }>(
      `INSERT INTO suppliers (name, company, cnpj, phone, whatsapp, email, address, city, state, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        input.name, input.company ?? null, input.cnpj ?? null, input.phone ?? null,
        input.whatsapp ?? null, input.email ?? null, input.address ?? null,
        input.city ?? null, input.state ?? null, input.notes ?? null,
      ]
    );
    return (await this.findById(row!.id))!;
  }

  async update(id: number, input: Partial<NewSupplierInput>): Promise<Supplier> {
    await ensureDb();
    const current = await this.findById(id);
    if (!current) throw new Error("Fornecedor não encontrado.");
    const merged: NewSupplierInput = {
      name: input.name ?? current.name,
      company: input.company ?? current.company ?? undefined,
      cnpj: input.cnpj ?? current.cnpj ?? undefined,
      phone: input.phone ?? current.phone ?? undefined,
      whatsapp: input.whatsapp ?? current.whatsapp ?? undefined,
      email: input.email ?? current.email ?? undefined,
      address: input.address ?? current.address ?? undefined,
      city: input.city ?? current.city ?? undefined,
      state: input.state ?? current.state ?? undefined,
      notes: input.notes ?? current.notes ?? undefined,
    };
    await query(
      `UPDATE suppliers SET name = $1, company = $2, cnpj = $3, phone = $4, whatsapp = $5, email = $6, address = $7, city = $8, state = $9, notes = $10
       WHERE id = $11`,
      [
        merged.name, merged.company ?? null, merged.cnpj ?? null, merged.phone ?? null,
        merged.whatsapp ?? null, merged.email ?? null, merged.address ?? null,
        merged.city ?? null, merged.state ?? null, merged.notes ?? null, id,
      ]
    );
    return (await this.findById(id))!;
  }

  async delete(id: number): Promise<void> {
    await ensureDb();
    await query("DELETE FROM suppliers WHERE id = $1", [id]);
  }

  async count(): Promise<number> {
    await ensureDb();
    const row = await queryOne<{ c: number }>("SELECT COUNT(*)::int as c FROM suppliers");
    return row!.c;
  }
}

interface StockMovementRow {
  id: number; product_id: number; type: "entrada" | "saida" | "ajuste"; quantity: number; reason: string | null; created_at: string;
}

function mapMovement(row: StockMovementRow): StockMovement {
  return {
    id: row.id,
    productId: row.product_id,
    type: row.type,
    quantity: Number(row.quantity),
    reason: row.reason,
    createdAt: row.created_at,
  };
}

export class SqliteStockMovementRepository implements StockMovementRepository {
  async create(input: NewStockMovementInput): Promise<StockMovement> {
    await ensureDb();
    const row = await queryOne<{ id: number }>(
      "INSERT INTO stock_movements (product_id, type, quantity, reason) VALUES ($1, $2, $3, $4) RETURNING id",
      [input.productId, input.type, input.quantity, input.reason ?? null]
    );
    const movement = await queryOne<StockMovementRow>("SELECT * FROM stock_movements WHERE id = $1", [row!.id]);
    return mapMovement(movement!);
  }

  async findByProduct(productId: number): Promise<StockMovement[]> {
    await ensureDb();
    const rows = await query<StockMovementRow>(
      "SELECT * FROM stock_movements WHERE product_id = $1 ORDER BY created_at DESC",
      [productId]
    );
    return rows.map(mapMovement);
  }
}
