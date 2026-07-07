import { ensureDb, query, queryOne } from "../db/connection";
import { NewProductInput, Product } from "@/domain/entities/Product";
import { ProductFilters, ProductRepository } from "@/domain/repositories/ProductRepository";

interface ProductRow {
  id: number;
  code: string;
  barcode: string | null;
  name: string;
  category_id: number | null;
  category_name: string | null;
  brand: string | null;
  unit: string;
  description: string | null;
  photo_url: string | null;
  purchase_price: number;
  sale_price: number;
  min_stock: number;
  quantity: number;
  location: string | null;
  supplier_id: number | null;
  supplier_name: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: ProductRow): Product {
  return {
    id: row.id,
    code: row.code,
    barcode: row.barcode,
    name: row.name,
    categoryId: row.category_id,
    categoryName: row.category_name ?? undefined,
    brand: row.brand,
    unit: row.unit,
    description: row.description,
    photoUrl: row.photo_url,
    purchasePrice: Number(row.purchase_price),
    salePrice: Number(row.sale_price),
    minStock: Number(row.min_stock),
    quantity: Number(row.quantity),
    location: row.location,
    supplierId: row.supplier_id,
    supplierName: row.supplier_name ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const BASE_SELECT = `
  SELECT p.*, c.name as category_name, s.name as supplier_name
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN suppliers s ON s.id = p.supplier_id
`;

export class SqliteProductRepository implements ProductRepository {
  async findAll(filters: ProductFilters = {}): Promise<Product[]> {
    await ensureDb();
    const clauses: string[] = [];
    const params: Array<string | number> = [];

    if (filters.search) {
      const like = `%${filters.search}%`;
      params.push(like, like, like);
      clauses.push(`(p.name ILIKE $${params.length - 2} OR p.code ILIKE $${params.length - 1} OR p.barcode ILIKE $${params.length})`);
    }
    if (filters.categoryId) {
      params.push(filters.categoryId);
      clauses.push(`p.category_id = $${params.length}`);
    }
    if (filters.onlyLowStock) {
      clauses.push("p.quantity > 0 AND p.quantity <= p.min_stock");
    }
    if (filters.onlyOutOfStock) {
      clauses.push("p.quantity <= 0");
    }

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows = await query<ProductRow>(`${BASE_SELECT} ${where} ORDER BY p.name ASC`, params);
    return rows.map(mapRow);
  }

  async findById(id: number): Promise<Product | null> {
    await ensureDb();
    const row = await queryOne<ProductRow>(`${BASE_SELECT} WHERE p.id = $1`, [id]);
    return row ? mapRow(row) : null;
  }

  async findByCode(code: string): Promise<Product | null> {
    await ensureDb();
    const row = await queryOne<ProductRow>(`${BASE_SELECT} WHERE p.code = $1`, [code]);
    return row ? mapRow(row) : null;
  }

  async create(input: NewProductInput): Promise<Product> {
    await ensureDb();
    const row = await queryOne<{ id: number }>(
      `INSERT INTO products
        (code, barcode, name, category_id, brand, unit, description, photo_url,
         purchase_price, sale_price, min_stock, quantity, location, supplier_id, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, now())
       RETURNING id`,
      [
        input.code,
        input.barcode ?? null,
        input.name,
        input.categoryId ?? null,
        input.brand ?? null,
        input.unit,
        input.description ?? null,
        input.photoUrl ?? null,
        input.purchasePrice,
        input.salePrice,
        input.minStock,
        input.quantity,
        input.location ?? null,
        input.supplierId ?? null,
      ]
    );
    return (await this.findById(row!.id))!;
  }

  async update(id: number, input: Partial<NewProductInput>): Promise<Product> {
    await ensureDb();
    const current = await this.findById(id);
    if (!current) throw new Error("Produto não encontrado");

    const merged: NewProductInput = {
      code: input.code ?? current.code,
      barcode: input.barcode ?? current.barcode ?? undefined,
      name: input.name ?? current.name,
      categoryId: input.categoryId ?? current.categoryId,
      brand: input.brand ?? current.brand ?? undefined,
      unit: input.unit ?? current.unit,
      description: input.description ?? current.description ?? undefined,
      photoUrl: input.photoUrl ?? current.photoUrl ?? undefined,
      purchasePrice: input.purchasePrice ?? current.purchasePrice,
      salePrice: input.salePrice ?? current.salePrice,
      minStock: input.minStock ?? current.minStock,
      quantity: input.quantity ?? current.quantity,
      location: input.location ?? current.location ?? undefined,
      supplierId: input.supplierId ?? current.supplierId,
    };

    await query(
      `UPDATE products SET
        code = $1, barcode = $2, name = $3, category_id = $4, brand = $5, unit = $6,
        description = $7, photo_url = $8, purchase_price = $9, sale_price = $10,
        min_stock = $11, quantity = $12, location = $13, supplier_id = $14, updated_at = now()
       WHERE id = $15`,
      [
        merged.code, merged.barcode ?? null, merged.name, merged.categoryId ?? null,
        merged.brand ?? null, merged.unit, merged.description ?? null, merged.photoUrl ?? null,
        merged.purchasePrice, merged.salePrice, merged.minStock, merged.quantity,
        merged.location ?? null, merged.supplierId ?? null, id,
      ]
    );
    return (await this.findById(id))!;
  }

  async delete(id: number): Promise<void> {
    await ensureDb();
    await query("DELETE FROM stock_movements WHERE product_id = $1", [id]);
    await query("DELETE FROM products WHERE id = $1", [id]);
  }

  async adjustQuantity(id: number, delta: number): Promise<Product> {
    await ensureDb();
    await query("UPDATE products SET quantity = quantity + $1, updated_at = now() WHERE id = $2", [delta, id]);
    return (await this.findById(id))!;
  }

  async count(): Promise<number> {
    await ensureDb();
    const row = await queryOne<{ c: number }>("SELECT COUNT(*)::int as c FROM products");
    return row!.c;
  }

  async totalStockValue(): Promise<number> {
    await ensureDb();
    const row = await queryOne<{ total: number }>("SELECT COALESCE(SUM(quantity * purchase_price), 0) as total FROM products");
    return Number(row!.total);
  }

  async countLowStock(): Promise<number> {
    await ensureDb();
    const row = await queryOne<{ c: number }>("SELECT COUNT(*)::int as c FROM products WHERE quantity > 0 AND quantity <= min_stock");
    return row!.c;
  }

  async countOutOfStock(): Promise<number> {
    await ensureDb();
    const row = await queryOne<{ c: number }>("SELECT COUNT(*)::int as c FROM products WHERE quantity <= 0");
    return row!.c;
  }

  async topSelling(limit: number): Promise<Array<{ nome: string; quantidade: number }>> {
    await ensureDb();
    const rows = await query<{ nome: string; quantidade: number }>(
      `SELECT p.name as nome, COALESCE(SUM(CASE WHEN sm.type = 'saida' THEN sm.quantity ELSE 0 END), 0) as quantidade
       FROM products p
       LEFT JOIN stock_movements sm ON sm.product_id = p.id
       GROUP BY p.id
       ORDER BY quantidade DESC
       LIMIT $1`,
      [limit]
    );
    return rows.map((r) => ({ nome: r.nome, quantidade: Number(r.quantidade) }));
  }
}
