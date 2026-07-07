import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { container } from "@/container";
import { NewUserInput } from "@/domain/entities/User";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await container.authUseCases.getUserByToken(token) : null;
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });
  return NextResponse.json({ data: await container.userUseCases.list() });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });
  try {
    const body = (await req.json()) as NewUserInput;
    const user = await container.userUseCases.create(body);
    return NextResponse.json({ data: user }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao criar usuário.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
