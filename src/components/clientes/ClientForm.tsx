"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { Client, NewClientInput } from "@/domain/entities/Client";

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export function ClientForm({ client }: { client?: Client }) {
  const router = useRouter();
  const isEdit = Boolean(client);

  const [form, setForm] = useState<NewClientInput>({
    name: client?.name ?? "",
    document: client?.document ?? "",
    phone: client?.phone ?? "",
    whatsapp: client?.whatsapp ?? "",
    email: client?.email ?? "",
    address: client?.address ?? "",
    city: client?.city ?? "",
    state: client?.state ?? "",
    notes: client?.notes ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof NewClientInput>(key: K, value: NewClientInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const url = isEdit ? `/api/clients/${client!.id}` : "/api/clients";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao salvar cliente.");
      router.push("/clientes");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-3xl">
      <Card className="p-5 flex flex-col gap-4">
        <h3 className="font-display font-semibold text-sm">Dados do cliente</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nome completo / Razão social" required>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Ex: José da Silva" required />
          </Field>
          <Field label="CPF / CNPJ">
            <Input value={form.document ?? ""} onChange={(e) => update("document", e.target.value)} placeholder="000.000.000-00" />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Telefone">
            <Input value={form.phone ?? ""} onChange={(e) => update("phone", e.target.value)} placeholder="(91) 90000-0000" />
          </Field>
          <Field label="WhatsApp">
            <Input value={form.whatsapp ?? ""} onChange={(e) => update("whatsapp", e.target.value)} placeholder="(91) 90000-0000" />
          </Field>
          <Field label="E-mail">
            <Input type="email" value={form.email ?? ""} onChange={(e) => update("email", e.target.value)} placeholder="cliente@email.com" />
          </Field>
        </div>
      </Card>

      <Card className="p-5 flex flex-col gap-4">
        <h3 className="font-display font-semibold text-sm">Endereço</h3>
        <Field label="Endereço completo">
          <Input value={form.address ?? ""} onChange={(e) => update("address", e.target.value)} placeholder="Rua, número, bairro" />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Cidade">
            <Input value={form.city ?? ""} onChange={(e) => update("city", e.target.value)} placeholder="Belém" />
          </Field>
          <Field label="Estado">
            <select
              value={form.state ?? ""}
              onChange={(e) => update("state", e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500"
            >
              <option value="">Selecione...</option>
              {UFS.map((uf) => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Observações">
          <Textarea value={form.notes ?? ""} onChange={(e) => update("notes", e.target.value)} placeholder="Observações internas sobre o cliente..." />
        </Field>
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.push("/clientes")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : isEdit ? "Salvar alterações" : "Cadastrar cliente"}
        </Button>
      </div>
    </form>
  );
}
