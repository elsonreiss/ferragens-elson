import { NextRequest, NextResponse } from "next/server";
import { container } from "@/container";
import { MovementType } from "@/domain/entities/Common";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = (await req.json()) as { type: MovementType; quantity: number; reason?: string };
    const product = await container.stockMovementUseCases.register({
      productId: Number(id),
      type: body.type,
      quantity: body.quantity,
      reason: body.reason,
    });
    return NextResponse.json({ data: product });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao registrar movimentação.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const history = await container.stockMovementUseCases.history(Number(id));
  return NextResponse.json({ data: history });
}
