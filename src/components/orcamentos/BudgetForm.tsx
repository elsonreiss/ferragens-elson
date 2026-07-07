"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Field, Select, Input, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { LineItemsEditor, LineItem, emptyLineItem } from "@/components/shared/LineItemsEditor";
import { Product } from "@/domain/entities/Product";
import { Client } from "@/domain/entities/Client";
import { NewBudgetInput } from "@/domain/entities/Budget";
import { formatCurrency } from "@/lib/format";

export function BudgetForm({ products, clients }: { products: Product[]; clients: Client[] }) {
  const router = useRouter();
  const [clientId, setClientId] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [discount, setDiscount] = useState("0");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([emptyLineItem()]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  const total = Math.max(0, subtotal - Number(discount || 0));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validItems = items.filter((it) => it.productId !== "" && it.quantity > 0);
    if (validItems.length === 0) {
      setError("Adicione ao menos um item válido ao orçamento.");
      return;
    }

    setLoading(true);
    try {
      const input: NewBudgetInput = {
        clientId: clientId ? Number(clientId) : undefined,
        discount: Number(discount || 0),
        validUntil: validUntil || undefined,
        notes: notes || undefined,
        items: validItems.map((it) => ({
          productId: Number(it.productId),
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })),
      };
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao criar orçamento.");
      router.push(`/orcamentos/${json.data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-4xl">
      <Card className="p-5 flex flex-col gap-4">
        <h3 className="font-display font-semibold text-sm">Dados do orçamento</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Cliente">
            <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">Sem cliente definido</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Válido até">
            <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
          </Field>
          <Field label="Desconto (R$)">
            <Input type="number" min={0} step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          </Field>
        </div>
        <Field label="Observações">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Condições, prazo de entrega, garantia..." />
        </Field>
      </Card>

      <Card className="p-5 flex flex-col gap-4">
        <h3 className="font-display font-semibold text-sm">Itens do orçamento</h3>
        <LineItemsEditor
          products={products}
          items={items}
          onChange={setItems}
          defaultUnitPrice={(p) => p.salePrice}
          priceLabel="Preço unitário"
        />
        {Number(discount) > 0 && (
          <div className="flex justify-end gap-6 text-sm border-t border-border pt-3 -mt-1">
            <span className="text-text-muted">Subtotal: <span className="font-mono">{formatCurrency(subtotal)}</span></span>
            <span className="text-text-muted">Desconto: <span className="font-mono">-{formatCurrency(Number(discount))}</span></span>
            <span className="font-semibold">Total final: <span className="font-mono">{formatCurrency(total)}</span></span>
          </div>
        )}
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.push("/orcamentos")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Criar orçamento"}
        </Button>
      </div>
    </form>
  );
}
