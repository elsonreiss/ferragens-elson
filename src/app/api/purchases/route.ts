import { NextRequest, NextResponse } from "next/server";
import { container } from "@/container";
import { NewPurchaseInput } from "@/domain/entities/Purchase";

export async function GET() {
  const purchases = await container.purchaseUseCases.list();
  return NextResponse.json({ data: purchases });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as NewPurchaseInput;
    const purchase = await container.purchaseUseCases.create(body);
    return NextResponse.json({ data: purchase }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao registrar compra.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
