import { NextRequest, NextResponse } from "next/server";
import { container } from "@/container";
import { NewProductInput } from "@/domain/entities/Product";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const product = await container.productUseCases.getById(Number(id));
  if (!product) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  return NextResponse.json({ data: product });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = (await req.json()) as Partial<NewProductInput>;
    const product = await container.productUseCases.update(Number(id), body);
    return NextResponse.json({ data: product });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao atualizar produto.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    await container.productUseCases.delete(Number(id));
    return NextResponse.json({ data: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao excluir produto.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
