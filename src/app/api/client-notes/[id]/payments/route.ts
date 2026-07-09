import { NextRequest, NextResponse } from "next/server";
import { container } from "@/container";
import { NewClientNotePaymentInput } from "@/domain/entities/ClientNote";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = (await req.json()) as NewClientNotePaymentInput;
    const note = await container.clientNoteUseCases.addPayment(Number(id), body);
    return NextResponse.json({ data: note }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao registrar pagamento.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
