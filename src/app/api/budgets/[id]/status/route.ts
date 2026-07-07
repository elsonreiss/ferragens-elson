import { NextRequest, NextResponse } from "next/server";
import { container } from "@/container";
import { BudgetStatus } from "@/domain/entities/Budget";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = (await req.json()) as { status: BudgetStatus };
    const budget = await container.budgetUseCases.updateStatus(Number(id), body.status);
    return NextResponse.json({ data: budget });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao atualizar status.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
