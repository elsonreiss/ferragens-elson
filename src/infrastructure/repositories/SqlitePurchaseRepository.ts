import { ensureDb, query, queryOne } from "../db/connection";
import { Purchase, PurchaseItem, NewPurchaseInput } from "@/domain/entities/Purchase";
import { PurchaseRepository } from "@/domain/repositories";

interface PurchaseRow {
  id: number;
  supplier_id: number | null;
  supplier_name: string | null;
  total: number;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
}

interface PurchaseItemRow {
  id: number;
  purchase_id: number;
  product_id: number | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

function mapItem(row: PurchaseItemRow): PurchaseItem {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    subtotal: Number(row.subtotal),
  };
}

export class SqlitePurchaseRepository implements PurchaseRepository {
  async findAll(): Promise<Purchase[]> {
    await ensureDb();
    const rows = await query<PurchaseRow>("SELECT * FROM purchases ORDER BY created_at DESC");
    const result: Purchase[] = [];
    for (const row of rows) result.push(await this.mapPurchase(row));
    return result;
  }

  async findById(id: number): Promise<Purchase | null> {
    await ensureDb();
    const row = await queryOne<PurchaseRow>("SELECT * FROM purchases WHERE id = $1", [id]);
    return row ? await this.mapPurchase(row) : null;
  }

  private async mapPurchase(row: PurchaseRow): Promise<Purchase> {
    const itemRows = await query<PurchaseItemRow>("SELECT * FROM purchase_items WHERE purchase_id = $1", [row.id]);
    return {
      id: row.id,
      supplierId: row.supplier_id,
      supplierName: row.supplier_name,
      items: itemRows.map(mapItem),
      total: Number(row.total),
      paymentMethod: row.payment_method,
      notes: row.notes,
      createdAt: row.created_at,
    };
  }

  async create(input: NewPurchaseInput): Promise<Purchase> {
    await ensureDb();

    let supplierName: string | null = null;
    if (input.supplierId) {
      const supplier = await queryOne<{ name: string }>("SELECT name FROM suppliers WHERE id = $1", [input.supplierId]);
      supplierName = supplier?.name ?? null;
    }

    const total = input.items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);

    const inserted = await queryOne<{ id: number }>(
      `INSERT INTO purchases (supplier_id, supplier_name, total, payment_method, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [input.supplierId ?? null, supplierName, total, input.paymentMethod ?? null, input.notes ?? null]
    );

    const purchaseId = inserted!.id;

    for (const item of input.items) {
      const product = await queryOne<{ name: string }>("SELECT name FROM products WHERE id = $1", [item.productId]);
      await query(
        `INSERT INTO purchase_items (purchase_id, product_id, product_name, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [purchaseId, item.productId, product?.name ?? "Produto removido", item.quantity, item.unitPrice, item.quantity * item.unitPrice]
      );
    }

    return (await this.findById(purchaseId))!;
  }
}
