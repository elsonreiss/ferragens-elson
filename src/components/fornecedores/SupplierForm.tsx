"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { Supplier, NewSupplierInput } from "@/domain/entities/Common";

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export function SupplierForm({ supplier }: { supplier?: Supplier }) {
  const router = useRouter();
  const isEdit = Boolean(supplier);

  const [form, setForm] = useState<NewSupplierInput>({
    name: supplier?.name ?? "",
    company: supplier?.company ?? "",
    cnpj: supplier?.cnpj ?? "",
    phone: supplier?.phone ?? "",
    whatsapp: supplier?.whatsapp ?? "",
    email: supplier?.email ?? "",
    address: supplier?.address ?? "",
    city: supplier?.city ?? "",
    state: supplier?.state ?? "",
    notes: supplier?.notes ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof NewSupplierInput>(key: K, value: NewSupplierInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const url = isEdit ? `/api/suppliers/${supplier!.id}` : "/api/suppliers";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao salvar fornecedor.");
      router.push("/fornecedores");
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
        <h3 className="font-display font-semibold text-sm">Dados do fornecedor</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nome do contato" required>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Ex: Carlos Mendes" required />
          </Field>
          <Field label="Empresa / Razão social">
            <Input value={form.company ?? ""} onChange={(e) => update("company", e.target.value)} placeholder="Ex: Cimenteira Norte Distribuidora" />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="CNPJ">
            <Input value={form.cnpj ?? ""} onChange={(e) => update("cnpj", e.target.value)} placeholder="00.000.000/0001-00" />
          </Field>
          <Field label="Telefone">
            <Input value={form.phone ?? ""} onChange={(e) => update("phone", e.target.value)} placeholder="(91) 3000-0000" />
          </Field>
          <Field label="WhatsApp">
            <Input value={form.whatsapp ?? ""} onChange={(e) => update("whatsapp", e.target.value)} placeholder="(91) 90000-0000" />
          </Field>
        </div>
        <Field label="E-mail">
          <Input type="email" value={form.email ?? ""} onChange={(e) => update("email", e.target.value)} placeholder="contato@fornecedor.com.br" />
        </Field>
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
          <Textarea value={form.notes ?? ""} onChange={(e) => update("notes", e.target.value)} placeholder="Condições de pagamento, prazo de entrega..." />
        </Field>
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.push("/fornecedores")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : isEdit ? "Salvar alterações" : "Cadastrar fornecedor"}
        </Button>
      </div>
    </form>
  );
}
