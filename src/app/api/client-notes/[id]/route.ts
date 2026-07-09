import { NextRequest, NextResponse } from "next/server";
import { container } from "@/container";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const note = await container.clientNoteUseCases.getById(Number(id));
  if (!note) return NextResponse.json({ error: "Nota não encontrada." }, { status: 404 });
  return NextResponse.json({ data: note });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    await container.clientNoteUseCases.delete(Number(id));
    return NextResponse.json({ data: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao excluir nota.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
