import { NextRequest, NextResponse } from "next/server";
import { container } from "@/container";

export async function GET() {
  const categories = await container.categoryRepository.findAll();
  return NextResponse.json({ data: categories });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { name: string };
    if (!body.name?.trim()) return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
    const category = await container.categoryRepository.create(body.name.trim());
    return NextResponse.json({ data: category }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao criar categoria.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
