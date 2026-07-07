import { NextRequest, NextResponse } from "next/server";
import { container } from "@/container";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const budget = await container.budgetUseCases.getById(Number(id));
  if (!budget) return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 });
  return NextResponse.json({ data: budget });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    await container.budgetUseCases.delete(Number(id));
    return NextResponse.json({ data: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao excluir orçamento.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
