import { notFound } from "next/navigation";
import { container } from "@/container";
import { ClientForm } from "@/components/clientes/ClientForm";

export const dynamic = "force-dynamic";

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await container.clientUseCases.getById(Number(id));
  if (!client) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-semibold text-2xl">Editar Cliente</h1>
        <p className="text-text-muted text-sm mt-1">{client.name}</p>
      </div>
      <ClientForm client={client} />
    </div>
  );
}
