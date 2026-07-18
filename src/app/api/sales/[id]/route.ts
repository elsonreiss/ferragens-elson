import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { container } from "@/container";
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

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const sale = await container.saleUseCases.getById(Number(id));
  if (!sale) return NextResponse.json({ error: "Venda não encontrada." }, { status: 404 });
  return NextResponse.json({ data: sale });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });
  const { id } = await params;
  try {
    const body = (await req.json()) as { createdAt?: string };
    if (!body.createdAt) throw new Error("Informe a data da venda.");
    const sale = await container.saleUseCases.updateDate(Number(id), body.createdAt);
    return NextResponse.json({ data: sale });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao atualizar a data da venda.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });
  const { id } = await params;
  try {
    await container.saleUseCases.delete(Number(id));
    return NextResponse.json({ data: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao excluir venda.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
