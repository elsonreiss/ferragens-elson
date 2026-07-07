import { NextRequest, NextResponse } from "next/server";
import { container } from "@/container";
import { NewClientInput } from "@/domain/entities/Client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? undefined;
  const clients = await container.clientUseCases.list({ search });
  return NextResponse.json({ data: clients });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as NewClientInput;
    const client = await container.clientUseCases.create(body);
    return NextResponse.json({ data: client }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao criar cliente.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
