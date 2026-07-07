"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Field, Select, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { LineItemsEditor, LineItem, emptyLineItem } from "@/components/shared/LineItemsEditor";
import { Product } from "@/domain/entities/Product";
import { Supplier } from "@/domain/entities/Common";
import { NewPurchaseInput } from "@/domain/entities/Purchase";

const PAYMENT_METHODS = ["Pix", "Dinheiro", "Cartão", "Boleto", "Transferência"];

export function PurchaseForm({ products, suppliers }: { products: Product[]; suppliers: Supplier[] }) {
  const router = useRouter();
  const [supplierId, setSupplierId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([emptyLineItem()]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validItems = items.filter((it) => it.productId !== "" && it.quantity > 0);
    if (validItems.length === 0) {
      setError("Adicione ao menos um item válido à compra.");
      return;
    }

    setLoading(true);
    try {
      const input: NewPurchaseInput = {
        supplierId: supplierId ? Number(supplierId) : undefined,
        paymentMethod,
        notes: notes || undefined,
        items: validItems.map((it) => ({
          productId: Number(it.productId),
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })),
      };
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao registrar compra.");
      router.push("/compras");
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
        <h3 className="font-display font-semibold text-sm">Dados da compra</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Fornecedor">
            <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">Sem fornecedor específico</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.company ? `— ${s.company}` : ""}
                </option>
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
        <Field label="Observações">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Nº da nota fiscal, condições, etc." />
        </Field>
      </Card>

      <Card className="p-5 flex flex-col gap-4">
        <h3 className="font-display font-semibold text-sm">Itens da compra</h3>
        <p className="text-xs text-text-muted -mt-2">
          Ao confirmar, o estoque dos produtos selecionados é atualizado automaticamente e o preço de compra é atualizado com o valor pago.
        </p>
        <LineItemsEditor
          products={products}
          items={items}
          onChange={setItems}
          defaultUnitPrice={(p) => p.purchasePrice}
          priceLabel="Preço de compra"
        />
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.push("/compras")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Registrar compra"}
        </Button>
      </div>
    </form>
  );
}
