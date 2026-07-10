import { container } from "@/container";
import { ClientNotesTable } from "@/components/notas-clientes/ClientNotesTable";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

interface NotasClientesPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function NotasClientesPage({ searchParams }: NotasClientesPageProps) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [{ items: notes, total }, summary] = await Promise.all([
    container.clientNoteUseCases.listPage(page, PAGE_SIZE),
    container.clientNoteUseCases.getSummary(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-semibold text-2xl">Notas de Clientes</h1>
        <p className="text-text-muted text-sm mt-1">
          {summary.openCount} nota(s) em aberto de {summary.totalNotes} registrada(s) - Total devido:{" "}
          {formatCurrency(summary.openBalance)}
        </p>
      </div>

      {/* key força remontagem ao trocar de página — o componente guarda as notas
          em estado local (para atualização otimista ao excluir), então sem isso
          o useState não pegaria a nova lista vinda do servidor. */}
      <ClientNotesTable key={page} notes={notes} page={page} totalPages={totalPages} />
    </div>
  );
}
