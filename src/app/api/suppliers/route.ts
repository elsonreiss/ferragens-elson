import { NextRequest, NextResponse } from "next/server";
import { container } from "@/container";
import { NewSupplierInput } from "@/domain/entities/Common";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? undefined;
  const suppliers = await container.supplierUseCases.list({ search });
  return NextResponse.json({ data: suppliers });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as NewSupplierInput;
    const supplier = await container.supplierUseCases.create(body);
    return NextResponse.json({ data: supplier }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao criar fornecedor.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
