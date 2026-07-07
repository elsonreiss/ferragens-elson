"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { NewProductInput, Product } from "@/domain/entities/Product";
import { Category, Supplier } from "@/domain/entities/Common";

const UNITS = ["un", "sc", "kg", "m", "m²", "m³", "l", "barra", "milheiro", "folha", "cx", "rolo", "balde"];

export function ProductForm({
  product,
  categories,
  suppliers,
}: {
  product?: Product;
  categories: Category[];
  suppliers: Supplier[];
}) {
  const router = useRouter();
  const isEdit = Boolean(product);

  const [form, setForm] = useState<NewProductInput>({
    code: product?.code ?? "",
    barcode: product?.barcode ?? "",
    name: product?.name ?? "",
    categoryId: product?.categoryId ?? null,
    brand: product?.brand ?? "",
    unit: product?.unit ?? "un",
    description: product?.description ?? "",
    purchasePrice: product?.purchasePrice ?? 0,
    salePrice: product?.salePrice ?? 0,
    minStock: product?.minStock ?? 0,
    quantity: product?.quantity ?? 0,
    location: product?.location ?? "",
    supplierId: product?.supplierId ?? null,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof NewProductInput>(key: K, value: NewProductInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const margin = form.salePrice > 0 ? ((form.salePrice - form.purchasePrice) / form.salePrice) * 100 : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const url = isEdit ? `/api/products/${product!.id}` : "/api/products";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao salvar produto.");
      router.push("/estoque");
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
        <h3 className="font-display font-semibold text-sm">Identificação</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Código do produto" required>
            <Input value={form.code} onChange={(e) => update("code", e.target.value)} placeholder="Ex: CIM001" required />
          </Field>
          <Field label="Código de barras">
            <Input value={form.barcode ?? ""} onChange={(e) => update("barcode", e.target.value)} placeholder="EAN-13" />
          </Field>
        </div>
        <Field label="Nome do produto" required>
          <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Ex: Cimento CP-II 50kg" required />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Categoria">
            <Select
              value={form.categoryId ?? ""}
              onChange={(e) => update("categoryId", e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Selecione...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Marca">
            <Input value={form.brand ?? ""} onChange={(e) => update("brand", e.target.value)} placeholder="Ex: Votoran" />
          </Field>
          <Field label="Unidade de medida" required>
            <Select value={form.unit} onChange={(e) => update("unit", e.target.value)}>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Descrição">
          <Textarea value={form.description ?? ""} onChange={(e) => update("description", e.target.value)} placeholder="Detalhes do produto..." />
        </Field>
      </Card>

      <Card className="p-5 flex flex-col gap-4">
        <h3 className="font-display font-semibold text-sm">Preços e margem</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Preço de compra (R$)" required>
            <Input
              type="number"
              step="0.01"
              min={0}
              value={form.purchasePrice}
              onChange={(e) => update("purchasePrice", Number(e.target.value))}
              required
            />
          </Field>
          <Field label="Preço de venda (R$)" required>
            <Input
              type="number"
              step="0.01"
              min={0}
              value={form.salePrice}
              onChange={(e) => update("salePrice", Number(e.target.value))}
              required
            />
          </Field>
          <Field label="Margem de lucro">
            <div className="h-[42px] flex items-center px-3 rounded-lg bg-bg border border-border font-mono text-sm">
              {margin.toFixed(1)}%
            </div>
          </Field>
        </div>
      </Card>

      <Card className="p-5 flex flex-col gap-4">
        <h3 className="font-display font-semibold text-sm">Estoque</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Quantidade atual" required hint={isEdit ? "Para ajustar, use 'Movimentar estoque' na listagem." : undefined}>
            <Input
              type="number"
              step="any"
              min={0}
              value={form.quantity}
              onChange={(e) => update("quantity", Number(e.target.value))}
              disabled={isEdit}
              required
            />
          </Field>
          <Field label="Estoque mínimo" required hint="Dispara alerta de estoque baixo">
            <Input
              type="number"
              step="any"
              min={0}
              value={form.minStock}
              onChange={(e) => update("minStock", Number(e.target.value))}
              required
            />
          </Field>
          <Field label="Localização no depósito">
            <Input value={form.location ?? ""} onChange={(e) => update("location", e.target.value)} placeholder="Ex: Galpão A - Corredor 2" />
          </Field>
        </div>
        <Field label="Fornecedor">
          <Select
            value={form.supplierId ?? ""}
            onChange={(e) => update("supplierId", e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Selecione...</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.company ? `— ${s.company}` : ""}
              </option>
            ))}
          </Select>
        </Field>
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.push("/estoque")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : isEdit ? "Salvar alterações" : "Cadastrar produto"}
        </Button>
      </div>
    </form>
  );
}
