import { NextRequest, NextResponse } from "next/server";
import { container } from "@/container";
import { MarkItemsPaidInput } from "@/domain/entities/ClientNote";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = (await req.json()) as MarkItemsPaidInput;
    const note = await container.clientNoteUseCases.markItemsPaid(Number(id), body);
    return NextResponse.json({ data: note });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao marcar itens como pagos.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
