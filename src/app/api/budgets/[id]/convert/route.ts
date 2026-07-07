import { NextRequest, NextResponse } from "next/server";
import { container } from "@/container";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = (await req.json().catch(() => ({}))) as { paymentMethod?: string };
    const sale = await container.budgetUseCases.convertToSale(Number(id), body.paymentMethod);
    return NextResponse.json({ data: sale });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao converter orçamento em venda.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
