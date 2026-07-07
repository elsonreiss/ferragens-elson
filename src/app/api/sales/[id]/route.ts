import { NextRequest, NextResponse } from "next/server";
import { container } from "@/container";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const sale = await container.saleUseCases.getById(Number(id));
  if (!sale) return NextResponse.json({ error: "Venda não encontrada." }, { status: 404 });
  return NextResponse.json({ data: sale });
}
