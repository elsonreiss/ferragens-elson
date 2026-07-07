import { ensureDb, query, queryOne } from "../db/connection";
import { Session } from "@/domain/entities/User";
import { SessionRepository } from "@/domain/repositories";
import { generateSessionToken, SESSION_MAX_AGE_SECONDS } from "@/lib/auth";

export class SqliteSessionRepository implements SessionRepository {
  async create(userId: number): Promise<Session> {
    await ensureDb();
    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString();
    await query("INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)", [token, userId, expiresAt]);
    return { token, userId, expiresAt };
  }

  async findByToken(token: string): Promise<Session | null> {
    await ensureDb();
    const row = await queryOne<{ token: string; user_id: number; expires_at: string }>(
      "SELECT * FROM sessions WHERE token = $1",
      [token]
    );
    if (!row) return null;
    if (new Date(row.expires_at).getTime() < Date.now()) {
      await query("DELETE FROM sessions WHERE token = $1", [token]);
      return null;
    }
    return { token: row.token, userId: row.user_id, expiresAt: row.expires_at };
  }

  async delete(token: string): Promise<void> {
    await ensureDb();
    await query("DELETE FROM sessions WHERE token = $1", [token]);
  }
}
