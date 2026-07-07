import { ensureDb, query, queryOne } from "../db/connection";
import { Sale, SaleItem, NewSaleInput } from "@/domain/entities/Sale";
import { SaleRepository } from "@/domain/repositories";

interface SaleRow {
  id: number;
  client_id: number | null;
  client_name: string | null;
  total: number;
  profit: number;
  payment_method: string | null;
  created_at: string;
}

interface SaleItemRow {
  id: number;
  sale_id: number;
  product_id: number | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  purchase_price: number;
  subtotal: number;
}

function mapItem(row: SaleItemRow): SaleItem {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    purchasePrice: Number(row.purchase_price),
    subtotal: Number(row.subtotal),
  };
}

export interface ResolvedSaleItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  purchasePrice: number;
  subtotal: number;
}

export class SqliteSaleRepository implements SaleRepository {
  async findAll(): Promise<Sale[]> {
    await ensureDb();
    const rows = await query<SaleRow>("SELECT * FROM sales ORDER BY created_at DESC");
    const result: Sale[] = [];
    for (const row of rows) result.push(await this.mapSale(row));
    return result;
  }

  async findById(id: number): Promise<Sale | null> {
    await ensureDb();
    const row = await queryOne<SaleRow>("SELECT * FROM sales WHERE id = $1", [id]);
    return row ? await this.mapSale(row) : null;
  }

  private async mapSale(row: SaleRow): Promise<Sale> {
    const itemRows = await query<SaleItemRow>("SELECT * FROM sale_items WHERE sale_id = $1", [row.id]);
    return {
      id: row.id,
      clientId: row.client_id,
      clientName: row.client_name,
      items: itemRows.map(mapItem),
      total: Number(row.total),
      profit: Number(row.profit),
      paymentMethod: row.payment_method,
      createdAt: row.created_at,
    };
  }

  async create(input: NewSaleInput, resolvedItems: ResolvedSaleItem[], total: number, profit: number): Promise<Sale> {
    await ensureDb();

    let clientName = input.clientName ?? null;
    if (input.clientId) {
      const client = await queryOne<{ name: string }>("SELECT name FROM clients WHERE id = $1", [input.clientId]);
      clientName = client?.name ?? clientName;
    }

    const inserted = await queryOne<{ id: number }>(
      `INSERT INTO sales (client_id, client_name, total, profit, payment_method)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [input.clientId ?? null, clientName, total, profit, input.paymentMethod ?? null]
    );

    const saleId = inserted!.id;

    for (const item of resolvedItems) {
      await query(
        `INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, purchase_price, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [saleId, item.productId, item.productName, item.quantity, item.unitPrice, item.purchasePrice, item.subtotal]
      );
    }

    return (await this.findById(saleId))!;
  }
}
