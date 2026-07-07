import { NextRequest, NextResponse } from "next/server";
import { container } from "@/container";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await container.authUseCases.getUserByToken(token) : null;
  return NextResponse.json({ data: user });
}

// Permite que o próprio usuário logado troque a foto do perfil (qualquer
// papel, não só admin). Ignora de propósito outros campos do corpo da
// requisição (name/email/role) para que ninguém altere seu próprio papel
// por aqui — isso continua restrito ao painel de administrador.
export async function PUT(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const currentUser = token ? await container.authUseCases.getUserByToken(token) : null;
  if (!currentUser) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  try {
    const body = (await req.json()) as { photoUrl?: string | null };
    const user = await container.userUseCases.update(currentUser.id, { photoUrl: body.photoUrl ?? null });
    return NextResponse.json({ data: user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao atualizar perfil.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
