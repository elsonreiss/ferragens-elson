import { NextRequest, NextResponse } from "next/server";
import { container } from "@/container";

interface Params {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    await container.financeUseCases.deleteExpense(Number(id));
    return NextResponse.json({ data: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao excluir despesa.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
