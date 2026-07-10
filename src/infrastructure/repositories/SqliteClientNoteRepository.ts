import { ensureDb, query, queryOne } from "../db/connection";
import {
  ClientNote,
  ClientNoteItem,
  ClientNotePayment,
  NewClientNoteItemInput,
  NewClientNotePaymentInput,
  MarkItemsPaidInput,
} from "@/domain/entities/ClientNote";
import { PagedResult } from "@/domain/entities/Common";
import { ClientNoteRepository } from "@/domain/repositories";

interface NoteRow {
  id: number;
  client_id: number;
  client_name: string;
  live_client_name?: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ItemRow {
  id: number;
  note_id: number;
  product_id: number | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  added_at: string;
  paid_at: string | null;
}

interface PaymentRow {
  id: number;
  note_id: number;
  amount: number;
  method: string | null;
  notes: string | null;
  created_at: string;
}

function mapItem(row: ItemRow): ClientNoteItem {
  return {
    id: row.id,
    noteId: row.note_id,
    productId: row.product_id,
    productName: row.product_name,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    subtotal: Number(row.subtotal),
    addedAt: row.added_at,
    paidAt: row.paid_at,
  };
}

function mapPayment(row: PaymentRow): ClientNotePayment {
  return {
    id: row.id,
    noteId: row.note_id,
    amount: Number(row.amount),
    method: row.method,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

// Nome do cliente sempre em dia: em vez de confiar só na coluna
// client_notes.client_name (uma foto do nome no momento em que a nota foi
// aberta), busca o nome atual em clients — assim, se o cliente for renomeado
// depois, a nota (e o WhatsApp/impressão) já mostram o nome novo.
const NOTE_SELECT = `
  SELECT cn.*, COALESCE(c.name, cn.client_name) AS live_client_name
  FROM client_notes cn
  LEFT JOIN clients c ON c.id = cn.client_id
`;

export class SqliteClientNoteRepository implements ClientNoteRepository {
  async findAll(): Promise<ClientNote[]> {
    await ensureDb();
    const rows = await query<NoteRow>(`${NOTE_SELECT} ORDER BY cn.updated_at DESC`);
    const result: ClientNote[] = [];
    for (const row of rows) result.push(await this.mapNote(row));
    return result;
  }

  async findPage(page: number, pageSize: number): Promise<PagedResult<ClientNote>> {
    await ensureDb();
    const offset = (page - 1) * pageSize;
    const rows = await query<NoteRow>(`${NOTE_SELECT} ORDER BY cn.updated_at DESC LIMIT $1 OFFSET $2`, [
      pageSize,
      offset,
    ]);
    const totalRow = await queryOne<{ c: number }>("SELECT COUNT(*)::int as c FROM client_notes");
    const items: ClientNote[] = [];
    for (const row of rows) items.push(await this.mapNote(row));
    return { items, total: totalRow?.c ?? 0, page, pageSize };
  }

  // Totais globais (todas as notas, não só a página atual) para o resumo no
  // topo da listagem — calculado direto em SQL para não precisar carregar
  // todas as notas com seus itens/pagamentos só para somar.
  async getSummary(): Promise<{ totalNotes: number; openCount: number; openBalance: number }> {
    await ensureDb();
    const row = await queryOne<{ total_notes: number; open_count: number; open_balance: number }>(`
      SELECT
        COUNT(*)::int AS total_notes,
        COUNT(*) FILTER (WHERE GREATEST(balance, 0) > 0.005)::int AS open_count,
        COALESCE(SUM(GREATEST(balance, 0)), 0) AS open_balance
      FROM (
        SELECT
          cn.id,
          COALESCE(item_totals.total, 0) - COALESCE(payment_totals.paid, 0) AS balance
        FROM client_notes cn
        LEFT JOIN (
          SELECT note_id, SUM(subtotal) AS total FROM client_note_items GROUP BY note_id
        ) item_totals ON item_totals.note_id = cn.id
        LEFT JOIN (
          SELECT note_id, SUM(amount) AS paid FROM client_note_payments GROUP BY note_id
        ) payment_totals ON payment_totals.note_id = cn.id
      ) sub
    `);
    return {
      totalNotes: row?.total_notes ?? 0,
      openCount: row?.open_count ?? 0,
      openBalance: Number(row?.open_balance ?? 0),
    };
  }

  async findById(id: number): Promise<ClientNote | null> {
    await ensureDb();
    const row = await queryOne<NoteRow>(`${NOTE_SELECT} WHERE cn.id = $1`, [id]);
    return row ? await this.mapNote(row) : null;
  }

  async findByClientId(clientId: number): Promise<ClientNote | null> {
    await ensureDb();
    const row = await queryOne<NoteRow>(`${NOTE_SELECT} WHERE cn.client_id = $1`, [clientId]);
    return row ? await this.mapNote(row) : null;
  }

  private async mapNote(row: NoteRow): Promise<ClientNote> {
    const itemRows = await query<ItemRow>(
      "SELECT * FROM client_note_items WHERE note_id = $1 ORDER BY added_at ASC, id ASC",
      [row.id]
    );
    const paymentRows = await query<PaymentRow>(
      "SELECT * FROM client_note_payments WHERE note_id = $1 ORDER BY created_at ASC, id ASC",
      [row.id]
    );
    const items = itemRows.map(mapItem);
    const payments = paymentRows.map(mapPayment);
    const total = items.reduce((sum, it) => sum + it.subtotal, 0);
    const paidTotal = payments.reduce((sum, p) => sum + p.amount, 0);
    return {
      id: row.id,
      clientId: row.client_id,
      clientName: row.live_client_name ?? row.client_name,
      notes: row.notes,
      items,
      payments,
      total,
      paidTotal,
      balance: Math.max(0, total - paidTotal),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async create(clientId: number, clientName: string): Promise<ClientNote> {
    await ensureDb();
    const inserted = await queryOne<{ id: number }>(
      `INSERT INTO client_notes (client_id, client_name) VALUES ($1, $2) RETURNING id`,
      [clientId, clientName]
    );
    return (await this.findById(inserted!.id))!;
  }

  async addItem(noteId: number, item: NewClientNoteItemInput & { productName: string }): Promise<ClientNote> {
    await ensureDb();
    await query(
      `INSERT INTO client_note_items (note_id, product_id, product_name, quantity, unit_price, subtotal)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [noteId, item.productId ?? null, item.productName, item.quantity, item.unitPrice, item.quantity * item.unitPrice]
    );
    await query("UPDATE client_notes SET updated_at = now() WHERE id = $1", [noteId]);
    return (await this.findById(noteId))!;
  }

  async removeItem(
    noteId: number,
    itemId: number
  ): Promise<{ note: ClientNote; removed: { productId: number | null; quantity: number } }> {
    await ensureDb();
    const itemRow = await queryOne<ItemRow>(
      "SELECT * FROM client_note_items WHERE id = $1 AND note_id = $2",
      [itemId, noteId]
    );
    if (!itemRow) throw new Error("Item não encontrado nesta nota.");
    if (itemRow.paid_at) throw new Error("Este item já foi pago e não pode ser removido.");
    await query("DELETE FROM client_note_items WHERE id = $1", [itemId]);
    await query("UPDATE client_notes SET updated_at = now() WHERE id = $1", [noteId]);
    const note = (await this.findById(noteId))!;
    return { note, removed: { productId: itemRow.product_id, quantity: Number(itemRow.quantity) } };
  }

  async addPayment(noteId: number, payment: NewClientNotePaymentInput): Promise<ClientNote> {
    await ensureDb();
    await query(
      `INSERT INTO client_note_payments (note_id, amount, method, notes) VALUES ($1, $2, $3, $4)`,
      [noteId, payment.amount, payment.method ?? null, payment.notes ?? null]
    );
    await query("UPDATE client_notes SET updated_at = now() WHERE id = $1", [noteId]);
    return (await this.findById(noteId))!;
  }

  async markItemsPaid(noteId: number, input: MarkItemsPaidInput): Promise<ClientNote> {
    await ensureDb();

    // Só considera itens desta nota que ainda não foram marcados como pagos
    // — evita contar o mesmo item duas vezes se o usuário clicar de novo.
    const items = await query<ItemRow>(
      `SELECT * FROM client_note_items WHERE note_id = $1 AND id = ANY($2) AND paid_at IS NULL`,
      [noteId, input.itemIds]
    );
    if (items.length === 0) {
      throw new Error("Selecione ao menos um item ainda não pago para marcar como pago.");
    }

    const amount = items.reduce((sum, it) => sum + Number(it.subtotal), 0);
    const itemIds = items.map((it) => it.id);

    await query(
      `INSERT INTO client_note_payments (note_id, amount, method, notes) VALUES ($1, $2, $3, $4)`,
      [noteId, amount, input.method ?? null, input.notes ?? null]
    );
    await query(`UPDATE client_note_items SET paid_at = now() WHERE id = ANY($1)`, [itemIds]);
    await query("UPDATE client_notes SET updated_at = now() WHERE id = $1", [noteId]);

    return (await this.findById(noteId))!;
  }

  async delete(id: number): Promise<void> {
    await ensureDb();
    // client_note_items e client_note_payments têm ON DELETE CASCADE em note_id.
    await query("DELETE FROM client_notes WHERE id = $1", [id]);
  }
}
