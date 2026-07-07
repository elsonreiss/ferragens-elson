import { NextRequest, NextResponse } from "next/server";
import { container } from "@/container";
import { NewClientInput } from "@/domain/entities/Client";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const client = await container.clientUseCases.getById(Number(id));
  if (!client) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  return NextResponse.json({ data: client });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = (await req.json()) as Partial<NewClientInput>;
    const client = await container.clientUseCases.update(Number(id), body);
    return NextResponse.json({ data: client });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao atualizar cliente.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    await container.clientUseCases.delete(Number(id));
    return NextResponse.json({ data: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao excluir cliente.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
