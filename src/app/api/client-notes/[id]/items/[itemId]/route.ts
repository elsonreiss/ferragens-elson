import { NextRequest, NextResponse } from "next/server";
import { container } from "@/container";

interface Params {
  params: Promise<{ id: string; itemId: string }>;
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id, itemId } = await params;
  try {
    const note = await container.clientNoteUseCases.removeItem(Number(id), Number(itemId));
    return NextResponse.json({ data: note });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao remover item da nota.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
