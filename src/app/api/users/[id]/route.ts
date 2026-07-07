import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { container } from "@/container";
import { NewUserInput } from "@/domain/entities/User";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string }>;
}

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await container.authUseCases.getUserByToken(token) : null;
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function PUT(req: NextRequest, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });
  const { id } = await params;
  try {
    const body = (await req.json()) as Partial<Omit<NewUserInput, "password">> & { password?: string };
    const user = await container.userUseCases.update(Number(id), body);
    return NextResponse.json({ data: user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao atualizar usuário.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });
  const { id } = await params;
  if (Number(id) === admin.id) {
    return NextResponse.json({ error: "Você não pode excluir seu próprio usuário." }, { status: 400 });
  }
  try {
    await container.userUseCases.delete(Number(id));
    return NextResponse.json({ data: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao excluir usuário.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
