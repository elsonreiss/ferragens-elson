import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE_NAME = "ferragens_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 dias

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  gerente: "Gerente",
  funcionario: "Funcionário",
};
