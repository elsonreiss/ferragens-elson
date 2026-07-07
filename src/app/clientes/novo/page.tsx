import { ClientForm } from "@/components/clientes/ClientForm";

export default function NovoClientePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-semibold text-2xl">Novo Cliente</h1>
        <p className="text-text-muted text-sm mt-1">Preencha os dados para cadastrar um novo cliente.</p>
      </div>
      <ClientForm />
    </div>
  );
}
