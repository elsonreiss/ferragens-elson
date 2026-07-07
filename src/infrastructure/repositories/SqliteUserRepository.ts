import { ensureDb, query, queryOne } from "../db/connection";
import { User, UserWithHash, NewUserInput, UserRole } from "@/domain/entities/User";
import { UserRepository } from "@/domain/repositories";
import { hashPassword } from "@/lib/auth";

interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  active: boolean;
  photo_url: string | null;
  created_at: string;
}

function mapRow(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    active: Boolean(row.active),
    photoUrl: row.photo_url,
    createdAt: row.created_at,
  };
}

export class SqliteUserRepository implements UserRepository {
  async findAll(): Promise<User[]> {
    await ensureDb();
    const rows = await query<UserRow>("SELECT * FROM users ORDER BY name ASC");
    return rows.map(mapRow);
  }

  async findById(id: number): Promise<User | null> {
    await ensureDb();
    const row = await queryOne<UserRow>("SELECT * FROM users WHERE id = $1", [id]);
    return row ? mapRow(row) : null;
  }

  async findByEmailWithHash(email: string): Promise<UserWithHash | null> {
    await ensureDb();
    const row = await queryOne<UserRow>("SELECT * FROM users WHERE email = $1", [email]);
    if (!row) return null;
    return { ...mapRow(row), passwordHash: row.password_hash };
  }

  async create(input: NewUserInput): Promise<User> {
    await ensureDb();
    const passwordHash = hashPassword(input.password);
    const inserted = await queryOne<{ id: number }>(
      "INSERT INTO users (name, email, password_hash, role, photo_url) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [input.name, input.email, passwordHash, input.role, input.photoUrl ?? null]
    );
    return (await this.findById(inserted!.id))!;
  }

  async update(id: number, input: Partial<Omit<NewUserInput, "password">> & { password?: string }): Promise<User> {
    await ensureDb();
    const current = await this.findById(id);
    if (!current) throw new Error("Usuário não encontrado.");
    const name = input.name ?? current.name;
    const email = input.email ?? current.email;
    const role = input.role ?? current.role;
    const photoUrl = input.photoUrl !== undefined ? input.photoUrl : current.photoUrl;
    if (input.password) {
      const passwordHash = hashPassword(input.password);
      await query(
        "UPDATE users SET name = $1, email = $2, role = $3, photo_url = $4, password_hash = $5 WHERE id = $6",
        [name, email, role, photoUrl, passwordHash, id]
      );
    } else {
      await query(
        "UPDATE users SET name = $1, email = $2, role = $3, photo_url = $4 WHERE id = $5",
        [name, email, role, photoUrl, id]
      );
    }
    return (await this.findById(id))!;
  }

  async delete(id: number): Promise<void> {
    await ensureDb();
    await query("DELETE FROM users WHERE id = $1", [id]);
  }

  async count(): Promise<number> {
    await ensureDb();
    const row = await queryOne<{ c: number }>("SELECT COUNT(*)::int as c FROM users");
    return row!.c;
  }
}
