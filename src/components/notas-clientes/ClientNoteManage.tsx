"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Search, ChevronDown, HandCoins } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Field } from "@/components/ui/Form";
import { formatCurrency, formatDateTime, cn } from "@/lib/format";
import { ClientNote } from "@/domain/entities/ClientNote";
import { Product } from "@/domain/entities/Product";

const PAYMENT_METHODS = ["Dinheiro", "PIX", "Cartão", "Outro"];

// Busca de produto por nome, código ou categoria. O texto digitado fica
// sempre no campo (nunca some) — clicar numa sugestão vincula ao produto do
// estoque; se não clicar em nada, o texto digitado é usado como item avulso
// (fora do estoque), sem precisar de nenhum passo extra.
function ProductPicker({
  products,
  productId,
  productName,
  onSelectProduct,
  onNameChange,
}: {
  products: Product[];
  productId: number | "";
  productName: string;
  onSelectProduct: (product: Product) => void;
  onNameChange: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, []);

  const q = productName.trim().toLowerCase();
  const filtered = (
    q.length === 0
      ? products
      : products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.code.toLowerCase().includes(q) ||
            (p.categoryName ?? "").toLowerCase().includes(q)
        )
  ).slice(0, 50);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          type="text"
          value={productName}
          onChange={(e) => {
            onNameChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar produto ou digitar item avulso..."
          className="w-full rounded-lg border border-border bg-surface pl-8 pr-7 py-2 text-sm text-text placeholder:text-text-muted/70 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-colors"
        />
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-surface border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto scrollbar-thin">
          {filtered.length === 0 && (
            <p className="px-3 py-3 text-sm text-text-muted text-center">
              {productName.trim()
                ? `Nenhum produto encontrado no estoque. "${productName.trim()}" será usado como item avulso.`
                : "Nenhum produto encontrado."}
            </p>
          )}
          {filtered.map((p) => (
            <button
              type="button"
              key={p.id}
              onClick={() => {
                onSelectProduct(p);
                setOpen(false);
              }}
              className="w-full flex flex-col items-start px-3 py-2 text-left text-sm hover:bg-bg transition-colors"
            >
              <span className="font-medium truncate w-full">
                {p.code} — {p.name}
              </span>
              <span className="text-xs text-text-muted">
                {p.categoryName ? `${p.categoryName} · ` : ""}
                {p.quantity} {p.unit} em estoque
              </span>
            </button>
          ))}
        </div>
      )}

      {!open && productId === "" && productName.trim() !== "" && (
        <p className="text-[11px] text-orange-600 mt-1">Item avulso (fora do estoque)</p>
      )}
    </div>
  );
}

export function ClientNoteManage({ note, products }: { note: ClientNote; products: Product[] }) {
  const router = useRouter();

  const [productId, setProductId] = useState<number | "">("");
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("0");
  const [itemLoading, setItemLoading] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  function selectProduct(product: Product) {
    setProductId(product.id);
    setProductName(product.name);
    setUnitPrice(String(product.salePrice));
  }

  function updateProductName(name: string) {
    // Digitar sempre desvincula de um produto já selecionado — o texto
    // digitado passa a valer como item avulso até que uma sugestão seja
    // clicada.
    setProductId("");
    setProductName(name);
  }

  async function addItem() {
    setItemError(null);
    const qty = Number(quantity);
    const price = Number(unitPrice);
    if (qty <= 0) {
      setItemError("A quantidade deve ser maior que zero.");
      return;
    }

    let body: Record<string, unknown>;
    if (productId !== "") {
      body = { productId, quantity: qty, unitPrice: price };
    } else {
      const name = productName.trim();
      if (!name) {
        setItemError("Selecione um produto ou digite o nome do item.");
        return;
      }
      body = { productName: name, quantity: qty, unitPrice: price };
    }

    setItemLoading(true);
    try {
      const res = await fetch(`/api/client-notes/${note.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao adicionar item.");
      setProductId("");
      setProductName("");
      setQuantity("1");
      setUnitPrice("0");
      router.refresh();
    } catch (err) {
      setItemError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setItemLoading(false);
    }
  }

  async function removeItem(itemId: number, name: string, itemProductId: number | null) {
    const stockNote = itemProductId ? " O item volta para o estoque." : "";
    if (!confirm(`Remover "${name}" desta nota?${stockNote}`)) return;
    const res = await fetch(`/api/client-notes/${note.id}/items/${itemId}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      const json = await res.json();
      alert(json.error ?? "Erro ao remover item.");
    }
  }

  async function addPayment() {
    setPaymentError(null);
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      setPaymentError("Informe um valor válido.");
      return;
    }
    setPaymentLoading(true);
    try {
      const res = await fetch(`/api/client-notes/${note.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, method: paymentMethod, notes: paymentNotes || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao registrar pagamento.");
      setPaymentAmount("");
      setPaymentNotes("");
      router.refresh();
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setPaymentLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="font-display font-semibold text-sm mb-3">Itens comprados fiado</h3>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-text-muted uppercase tracking-wide border-b border-border">
                <th className="py-2">Data / hora</th>
                <th className="py-2">Produto</th>
                <th className="py-2 text-right">Qtd.</th>
                <th className="py-2 text-right">Preço unit.</th>
                <th className="py-2 text-right">Subtotal</th>
                <th className="py-2 text-right no-print">Ações</th>
              </tr>
            </thead>
            <tbody>
              {note.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-text-muted">
                    Nenhum item registrado ainda.
                  </td>
                </tr>
              )}
              {note.items.map((item) => (
                <tr key={item.id} className="border-b border-border/60">
                  <td className="py-2 text-text-muted whitespace-nowrap">{formatDateTime(item.addedAt)}</td>
                  <td className="py-2">{item.productName}</td>
                  <td className="py-2 text-right font-mono">{item.quantity}</td>
                  <td className="py-2 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-2 text-right font-mono">{formatCurrency(item.subtotal)}</td>
                  <td className="py-2 text-right no-print">
                    <button
                      type="button"
                      title="Remover item"
                      onClick={() => removeItem(item.id, item.productName, item.productId)}
                      className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-text-muted hover:bg-danger-bg hover:text-danger transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="no-print mt-3 rounded-lg border border-border p-3 flex flex-col gap-3 bg-bg/40">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-text-muted uppercase tracking-wide">Produto</span>
              <ProductPicker
                products={products}
                productId={productId}
                productName={productName}
                onSelectProduct={selectProduct}
                onNameChange={updateProductName}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-text-muted uppercase tracking-wide">Qtd.</span>
              <Input
                type="number"
                min={0.01}
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-24 text-right"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-text-muted uppercase tracking-wide">Preço unit.</span>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="w-28 text-right"
              />
            </div>
            <Button type="button" onClick={addItem} disabled={itemLoading}>
              <Plus size={16} /> {itemLoading ? "Adicionando..." : "Adicionar item"}
            </Button>
          </div>
          {itemError && <p className="text-sm text-danger">{itemError}</p>}
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="font-display font-semibold text-sm mb-3">Pagamentos</h3>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-text-muted uppercase tracking-wide border-b border-border">
                <th className="py-2">Data / hora</th>
                <th className="py-2">Forma</th>
                <th className="py-2">Observação</th>
                <th className="py-2 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {note.payments.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-text-muted">
                    Nenhum pagamento registrado ainda.
                  </td>
                </tr>
              )}
              {note.payments.map((p) => (
                <tr key={p.id} className="border-b border-border/60">
                  <td className="py-2 text-text-muted whitespace-nowrap">{formatDateTime(p.createdAt)}</td>
                  <td className="py-2">{p.method ?? "—"}</td>
                  <td className="py-2 text-text-muted">{p.notes ?? "—"}</td>
                  <td className="py-2 text-right font-mono">{formatCurrency(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {note.balance > 0.005 && (
          <div className="no-print mt-3 rounded-lg border border-border p-3 flex flex-col gap-3 bg-bg/40">
            <div className="grid grid-cols-1 sm:grid-cols-[auto_auto_1fr_auto] gap-2 items-end">
              <Field label="Valor pago">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={formatCurrency(note.balance)}
                  className="w-32 text-right"
                />
              </Field>
              <Field label="Forma">
                <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-36">
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Observação (opcional)">
                <Input value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} placeholder="Ex: pagamento parcial" />
              </Field>
              <Button type="button" onClick={addPayment} disabled={paymentLoading}>
                <HandCoins size={16} /> {paymentLoading ? "Registrando..." : "Registrar pagamento"}
              </Button>
            </div>
            {paymentError && <p className="text-sm text-danger">{paymentError}</p>}
          </div>
        )}
      </div>

      <div className={cn("flex justify-end border-t border-border pt-4")}>
        <div className="w-64 flex flex-col gap-1">
          <div className="flex justify-between text-sm text-text-muted">
            <span>Total em compras</span>
            <span className="font-mono">{formatCurrency(note.total)}</span>
          </div>
          {note.paidTotal > 0 && (
            <div className="flex justify-between text-sm text-text-muted">
              <span>Pago</span>
              <span className="font-mono">-{formatCurrency(note.paidTotal)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-display font-semibold pt-1 border-t border-border">
            <span>Saldo devedor</span>
            <span className="font-mono">{formatCurrency(note.balance)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
