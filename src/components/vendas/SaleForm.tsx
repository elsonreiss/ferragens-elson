"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Field, Select, Input } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { LineItemsEditor, LineItem, emptyLineItem } from "@/components/shared/LineItemsEditor";
import { Product } from "@/domain/entities/Product";
import { Client } from "@/domain/entities/Client";
import { NewSaleInput } from "@/domain/entities/Sale";
import { saoPauloDateKey } from "@/lib/brDate";

const PAYMENT_METHODS = ["Pix", "Dinheiro", "Cartão", "Boleto", "Transferência"];
const BR_TZ = "America/Sao_Paulo";

// Monta um ISO 8601 combinando a data escolhida (YYYY-MM-DD) com a hora atual
// em Brasília, e o offset fixo -03:00 (Brasília não observa horário de
// verão desde 2019). Assim a venda cai certinho no dia escolhido nos
// relatórios/dashboard, mesmo que o navegador esteja em outro fuso.
function buildCreatedAt(dateStr: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BR_TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${dateStr}T${get("hour")}:${get("minute")}:${get("second")}-03:00`;
}

export function SaleForm({ products, clients }: { products: Product[]; clients: Client[] }) {
  const router = useRouter();
  const [clientId, setClientId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [saleDate, setSaleDate] = useState(() => saoPauloDateKey(new Date()));
  const [items, setItems] = useState<LineItem[]>([emptyLineItem()]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validItems = items.filter(
      (it) => it.quantity > 0 && (it.productId !== "" || it.productName.trim() !== "")
    );
    if (validItems.length === 0) {
      setError("Adicione ao menos um item válido à venda.");
      return;
    }
    if (!saleDate) {
      setError("Informe a data da venda.");
      return;
    }

    setLoading(true);
    try {
      const input: NewSaleInput = {
        clientId: clientId ? Number(clientId) : undefined,
        paymentMethod,
        createdAt: buildCreatedAt(saleDate),
        items: validItems.map((it) =>
          it.productId !== ""
            ? { productId: Number(it.productId), quantity: it.quantity, unitPrice: it.unitPrice }
            : { productName: it.productName.trim(), quantity: it.quantity, unitPrice: it.unitPrice }
        ),
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          <Field label="Data da venda" hint="Mude aqui para lançar uma venda de outro dia.">
            <Input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card className="p-5 flex flex-col gap-4">
        <h3 className="font-display font-semibold text-sm">Itens da venda</h3>
        <p className="text-xs text-text-muted -mt-2">
          O preço de venda de cada produto é sugerido automaticamente, mas pode ser ajustado. O estoque é atualizado ao confirmar.
          Não achou o produto? É só digitar o nome — o item entra na venda como avulso, sem mexer no estoque.
        </p>
        <LineItemsEditor
          products={products}
          items={items}
          onChange={setItems}
          defaultUnitPrice={(p) => p.salePrice}
          priceLabel="Preço de venda"
          allowManualEntry
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
