import { ensureDb, query, queryOne } from "../db/connection";
import { Client, NewClientInput, ClientFilters } from "@/domain/entities/Client";
import { ClientRepository } from "@/domain/repositories";

interface ClientRow {
  id: number;
  name: string;
  document: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  notes: string | null;
  created_at: string;
}

function mapRow(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    document: row.document,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    address: row.address,
    city: row.city,
    state: row.state,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export class SqliteClientRepository implements ClientRepository {
  async findAll(filters: ClientFilters = {}): Promise<Client[]> {
    await ensureDb();
    let sql = "SELECT * FROM clients";
    const params: string[] = [];
    if (filters.search) {
      const like = `%${filters.search}%`;
      params.push(like, like, like, like);
      sql += " WHERE (name ILIKE $1 OR document ILIKE $2 OR phone ILIKE $3 OR email ILIKE $4)";
    }
    sql += " ORDER BY name ASC";
    const rows = await query<ClientRow>(sql, params);
    return rows.map(mapRow);
  }

  async findById(id: number): Promise<Client | null> {
    await ensureDb();
    const row = await queryOne<ClientRow>("SELECT * FROM clients WHERE id = $1", [id]);
    return row ? mapRow(row) : null;
  }

  async create(input: NewClientInput): Promise<Client> {
    await ensureDb();
    const row = await queryOne<{ id: number }>(
      `INSERT INTO clients (name, document, phone, whatsapp, email, address, city, state, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        input.name,
        input.document ?? null,
        input.phone ?? null,
        input.whatsapp ?? null,
        input.email ?? null,
        input.address ?? null,
        input.city ?? null,
        input.state ?? null,
        input.notes ?? null,
      ]
    );
    return (await this.findById(row!.id))!;
  }

  async update(id: number, input: Partial<NewClientInput>): Promise<Client> {
    await ensureDb();
    const current = await this.findById(id);
    if (!current) throw new Error("Cliente não encontrado.");
    const merged: NewClientInput = {
      name: input.name ?? current.name,
      document: input.document ?? current.document ?? undefined,
      phone: input.phone ?? current.phone ?? undefined,
      whatsapp: input.whatsapp ?? current.whatsapp ?? undefined,
      email: input.email ?? current.email ?? undefined,
      address: input.address ?? current.address ?? undefined,
      city: input.city ?? current.city ?? undefined,
      state: input.state ?? current.state ?? undefined,
      notes: input.notes ?? current.notes ?? undefined,
    };
    await query(
      `UPDATE clients SET name = $1, document = $2, phone = $3, whatsapp = $4, email = $5, address = $6, city = $7, state = $8, notes = $9
       WHERE id = $10`,
      [
        merged.name, merged.document ?? null, merged.phone ?? null, merged.whatsapp ?? null,
        merged.email ?? null, merged.address ?? null, merged.city ?? null, merged.state ?? null,
        merged.notes ?? null, id,
      ]
    );
    return (await this.findById(id))!;
  }

  async delete(id: number): Promise<void> {
    await ensureDb();
    await query("DELETE FROM clients WHERE id = $1", [id]);
  }

  async count(): Promise<number> {
    await ensureDb();
    const row = await queryOne<{ c: number }>("SELECT COUNT(*)::int as c FROM clients");
    return row!.c;
  }
}
