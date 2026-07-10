import { NextRequest, NextResponse } from "next/server";
import { container } from "@/container";

export async function GET(req: NextRequest) {
  const page = Number(req.nextUrl.searchParams.get("page")) || 1;
  const pageSize = Number(req.nextUrl.searchParams.get("pageSize")) || 20;
  const { items, total } = await container.clientNoteUseCases.listPage(page, pageSize);
  return NextResponse.json({ data: items, total, page, pageSize });
}

// Abre (ou retorna, se já existir) a nota fiado de um cliente.
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { clientId: number };
    if (!body.clientId) throw new Error("Selecione um cliente.");
    const note = await container.clientNoteUseCases.getOrCreateForClient(Number(body.clientId));
    return NextResponse.json({ data: note }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao abrir nota do cliente.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
