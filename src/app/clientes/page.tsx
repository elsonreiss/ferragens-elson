import { container } from "@/container";
import { ClientsTable } from "@/components/clientes/ClientsTable";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const clients = await container.clientUseCases.list();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-semibold text-2xl">Clientes</h1>
        <p className="text-text-muted text-sm mt-1">
          {clients.length} cliente(s) cadastrado(s). Gerencie contatos e histórico dos seus clientes.
        </p>
      </div>
      <ClientsTable initialClients={clients} />
    </div>
  );
}
