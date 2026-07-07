import { NextRequest, NextResponse } from "next/server";
import { container } from "@/container";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const purchase = await container.purchaseUseCases.getById(Number(id));
  if (!purchase) return NextResponse.json({ error: "Compra não encontrada." }, { status: 404 });
  return NextResponse.json({ data: purchase });
}
