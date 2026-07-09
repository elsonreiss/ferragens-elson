import { container } from "@/container";
import { Card } from "@/components/ui/Card";
import { OpenClientNote } from "@/components/notas-clientes/OpenClientNote";

export const dynamic = "force-dynamic";

export default async function NovaNotaClientePage() {
  const clients = await container.clientUseCases.list();

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <h1 className="font-display font-semibold text-2xl">Nova nota de cliente</h1>
        <p className="text-text-muted text-sm mt-1">
          Selecione o cliente para começar a registrar as compras fiado. Se o cliente já tiver uma nota em aberto,
          você será direcionado para ela.
        </p>
      </div>

      <Card className="p-5">
        <OpenClientNote clients={clients} />
      </Card>
    </div>
  );
}
