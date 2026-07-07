import { NextRequest, NextResponse } from "next/server";
import { container } from "@/container";
import { NewSupplierInput } from "@/domain/entities/Common";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supplier = await container.supplierUseCases.getById(Number(id));
  if (!supplier) return NextResponse.json({ error: "Fornecedor não encontrado." }, { status: 404 });
  return NextResponse.json({ data: supplier });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = (await req.json()) as Partial<NewSupplierInput>;
    const supplier = await container.supplierUseCases.update(Number(id), body);
    return NextResponse.json({ data: supplier });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao atualizar fornecedor.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    await container.supplierUseCases.delete(Number(id));
    return NextResponse.json({ data: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao excluir fornecedor.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
