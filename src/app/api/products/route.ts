import { NextRequest, NextResponse } from "next/server";
import { container } from "@/container";
import { NewProductInput } from "@/domain/entities/Product";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? undefined;
  const categoryId = searchParams.get("categoryId");
  const onlyLowStock = searchParams.get("onlyLowStock") === "true";
  const onlyOutOfStock = searchParams.get("onlyOutOfStock") === "true";

  const products = await container.productUseCases.list({
    search,
    categoryId: categoryId ? Number(categoryId) : undefined,
    onlyLowStock,
    onlyOutOfStock,
  });

  return NextResponse.json({ data: products });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as NewProductInput;
    const product = await container.productUseCases.create(body);
    return NextResponse.json({ data: product }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao criar produto.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
