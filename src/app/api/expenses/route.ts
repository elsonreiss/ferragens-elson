import { NextRequest, NextResponse } from "next/server";
import { container } from "@/container";
import { NewExpenseInput } from "@/domain/entities/Expense";

export async function GET() {
  const expenses = await container.financeUseCases.listExpenses();
  return NextResponse.json({ data: expenses });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as NewExpenseInput;
    const expense = await container.financeUseCases.createExpense(body);
    return NextResponse.json({ data: expense }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao registrar despesa.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
