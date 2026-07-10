import { ensureDb, query, queryOne } from "../db/connection";
import { LoginAttemptRepository } from "@/domain/repositories";

export class SqliteLoginAttemptRepository implements LoginAttemptRepository {
  async record(email: string, success: boolean): Promise<void> {
    await ensureDb();
    await query("INSERT INTO login_attempts (email, success) VALUES ($1, $2)", [email, success]);
  }

  async countRecentFailures(email: string, sinceMinutesAgo: number): Promise<number> {
    await ensureDb();
    const row = await queryOne<{ c: number }>(
      `SELECT COUNT(*)::int as c FROM login_attempts
       WHERE email = $1 AND success = false AND created_at >= now() - ($2 || ' minutes')::interval`,
      [email, sinceMinutesAgo]
    );
    return row?.c ?? 0;
  }
}
