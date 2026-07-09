import { container } from "@/container";
import { ClientNotesTable } from "@/components/notas-clientes/ClientNotesTable";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function NotasClientesPage() {
  const notes = await container.clientNoteUseCases.list();

  const openBalance = notes.reduce((sum, n) => sum + n.balance, 0);
  const openCount = notes.filter((n) => n.balance > 0.005).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-semibold text-2xl">Notas de Clientes</h1>
        <p className="text-text-muted text-sm mt-1">
          {openCount} nota(s) em aberto de {notes.length} registrada(s) - Total devido: {formatCurrency(openBalance)}
        </p>
      </div>

      <ClientNotesTable notes={notes} />
    </div>
  );
}
