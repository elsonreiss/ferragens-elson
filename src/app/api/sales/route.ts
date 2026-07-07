import { NextRequest, NextResponse } from "next/server";
import { container } from "@/container";
import { NewSaleInput } from "@/domain/entities/Sale";

export async function GET() {
  const sales = await container.saleUseCases.list();
  return NextResponse.json({ data: sales });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as NewSaleInput;
    const sale = await container.saleUseCases.create(body);
    return NextResponse.json({ data: sale }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao registrar venda.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
