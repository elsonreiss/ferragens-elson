import { notFound } from "next/navigation";
import { container } from "@/container";
import { ClientNoteActions } from "@/components/notas-clientes/ClientNoteActions";
import { ClientNoteManage } from "@/components/notas-clientes/ClientNoteManage";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function NotaClienteDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const note = await container.clientNoteUseCases.getById(Number(id));
  if (!note) notFound();

  const [client, products] = await Promise.all([
    container.clientUseCases.getById(note.clientId),
    container.productUseCases.list(),
  ]);

  const quitada = note.balance <= 0.005;

  return (
    <div className="flex flex-col gap-6 print-area">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="font-display font-semibold text-2xl">Nota de {note.clientName}</h1>
          <p className="text-text-muted text-sm mt-1">Última movimentação em {formatDateTime(note.updatedAt)}</p>
        </div>
        <Badge tone={quitada ? "success" : "warning"}>{quitada ? "Quitada" : "Em aberto"}</Badge>
      </div>

      <ClientNoteActions note={note} clientWhatsapp={client?.whatsapp ?? client?.phone} />

      <Card className="p-8 flex flex-col gap-6">
        <div className="flex items-start justify-between border-b border-border pb-6">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Ferragens do Elson" className="w-14 h-14" />
            <div>
              <p className="font-display font-bold text-lg">Ferragens do Elson</p>
              <p className="text-xs text-text-muted">Materiais de construção e ferragens</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-display font-semibold text-lg">Nota do cliente</p>
            <p className="text-xs text-text-muted">Atualizada em {formatDateTime(note.updatedAt)}</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Cliente</p>
          <p className="font-medium">{note.clientName}</p>
          {client?.phone && <p className="text-sm text-text-muted">{client.phone}</p>}
          {client?.address && (
            <p className="text-sm text-text-muted">
              {client.address} — {client.city}/{client.state}
            </p>
          )}
        </div>

        <ClientNoteManage note={note} products={products} />
      </Card>
    </div>
  );
}
