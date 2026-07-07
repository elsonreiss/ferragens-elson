import { NextRequest, NextResponse } from "next/server";
import { container } from "@/container";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ data: { produtos: [], clientes: [], fornecedores: [] } });
  }

  const [produtosRaw, clientesRaw, fornecedoresRaw] = await Promise.all([
    container.productUseCases.list({ search: q }),
    container.clientUseCases.list({ search: q }),
    container.supplierUseCases.list({ search: q }),
  ]);

  const produtos = produtosRaw.slice(0, 6).map((p) => ({
    id: p.id,
    label: `${p.name} (${p.code})`,
    href: `/estoque/${p.id}`,
  }));

  const clientes = clientesRaw.slice(0, 6).map((c) => ({
    id: c.id,
    label: c.name,
    href: `/clientes/${c.id}`,
  }));

  const fornecedores = fornecedoresRaw.slice(0, 6).map((s) => ({
    id: s.id,
    label: s.company ? `${s.name} — ${s.company}` : s.name,
    href: `/fornecedores/${s.id}`,
  }));

  return NextResponse.json({ data: { produtos, clientes, fornecedores } });
}
