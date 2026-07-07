import { NextRequest, NextResponse } from "next/server";
import { container } from "@/container";
import { NewBudgetInput } from "@/domain/entities/Budget";

export async function GET() {
  const budgets = await container.budgetUseCases.list();
  return NextResponse.json({ data: budgets });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as NewBudgetInput;
    const budget = await container.budgetUseCases.create(body);
    return NextResponse.json({ data: budget }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao criar orçamento.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
