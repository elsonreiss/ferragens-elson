"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Field, Select } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { LineItemsEditor, LineItem, emptyLineItem } from "@/components/shared/LineItemsEditor";
import { Product } from "@/domain/entities/Product";
import { Client } from "@/domain/entities/Client";
import { NewSaleInput } from "@/domain/entities/Sale";

const PAYMENT_METHODS = ["Pix", "Dinheiro", "Cartão", "Boleto", "Transferência"];

export function SaleForm({ products, clients }: { products: Product[]; clients: Client[] }) {
  const router = useRouter();
  const [clientId, setClientId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [items, setItems] = useState<LineItem[]>([emptyLineItem()]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validItems = items.filter((it) => it.productId !== "" && it.quantity > 0);
    if (validItems.length === 0) {
      setError("Adicione ao menos um item válido à venda.");
      return;
    }

    setLoading(true);
    try {
      const input: NewSaleInput = {
        clientId: clientId ? Number(clientId) : undefined,
        paymentMethod,
        items: validItems.map((it) => ({
          productId: Number(it.productId),
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })),
      };
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao registrar venda.");
      router.push("/vendas");
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
        <h3 className="font-display font-semibold text-sm">Dados da venda</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Cliente">
            <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">Consumidor não identificado</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Forma de pagamento">
            <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      <Card className="p-5 flex flex-col gap-4">
        <h3 className="font-display font-semibold text-sm">Itens da venda</h3>
        <p className="text-xs text-text-muted -mt-2">
          O preço de venda de cada produto é sugerido automaticamente, mas pode ser ajustado. O estoque é atualizado ao confirmar.
        </p>
        <LineItemsEditor
          products={products}
          items={items}
          onChange={setItems}
          defaultUnitPrice={(p) => p.salePrice}
          priceLabel="Preço de venda"
        />
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.push("/vendas")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Confirmar venda"}
        </Button>
      </div>
    </form>
  );
}
