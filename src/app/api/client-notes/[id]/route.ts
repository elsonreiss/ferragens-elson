import { NextRequest, NextResponse } from "next/server";
import { container } from "@/container";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const note = await container.clientNoteUseCases.getById(Number(id));
  if (!note) return NextResponse.json({ error: "Nota não encontrada." }, { status: 404 });
  return NextResponse.json({ data: note });
}

// Excluir a nota inteira (com o histórico de fiado do cliente) é restrito a
// administrador/gerente — funcionário pode gerenciar itens e pagamentos, mas
// não apagar a nota.
export async function DELETE(req: NextRequest, { params }: Params) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const currentUser = token ? await container.authUseCases.getUserByToken(token) : null;
  if (currentUser?.role === "funcionario") {
    return NextResponse.json({ error: "Apenas administradores ou gerentes podem excluir uma nota." }, { status: 403 });
  }

  const { id } = await params;
  try {
    await container.clientNoteUseCases.delete(Number(id));
    return NextResponse.json({ data: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao excluir nota.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
