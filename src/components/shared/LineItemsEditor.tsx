"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Form";
import { formatCurrency, cn } from "@/lib/format";
import { Product } from "@/domain/entities/Product";

export interface LineItem {
  productId: number | "";
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

export function emptyLineItem(): LineItem {
  return { productId: "", productName: "", unit: "un", quantity: 1, unitPrice: 0 };
}

// Campo de busca de produto por nome, código ou categoria, com lista de
// sugestões (autocomplete) — substitui o antigo <select> com todos os
// produtos, que era inviável de navegar com o estoque grande.
function ProductPicker({
  products,
  value,
  onSelect,
}: {
  products: Product[];
  value: number | "";
  onSelect: (productId: number | "") => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selected = value === "" ? null : products.find((p) => p.id === value) ?? null;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, []);

  const q = query.trim().toLowerCase();
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
          value={open ? query : selected ? `${selected.code} — ${selected.name}` : ""}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          placeholder="Buscar por nome, código ou categoria..."
          className="w-full rounded-lg border border-border bg-surface pl-8 pr-7 py-2 text-sm text-text placeholder:text-text-muted/70 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-colors"
        />
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-surface border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto scrollbar-thin">
          {filtered.length === 0 && (
            <p className="px-3 py-3 text-sm text-text-muted text-center">Nenhum produto encontrado.</p>
          )}
          {filtered.map((p) => (
            <button
              type="button"
              key={p.id}
              onClick={() => {
                onSelect(p.id);
                setQuery("");
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
    </div>
  );
}

export function LineItemsEditor({
  products,
  items,
  onChange,
  defaultUnitPrice,
  priceLabel = "Preço unitário",
}: {
  products: Product[];
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  defaultUnitPrice: (product: Product) => number;
  priceLabel?: string;
}) {
  function updateItem(index: number, patch: Partial<LineItem>) {
    const next = items.map((it, i) => (i === index ? { ...it, ...patch } : it));
    onChange(next);
  }

  function selectProduct(index: number, productId: number | "") {
    const product = productId === "" ? undefined : products.find((p) => p.id === productId);
    if (!product) {
      updateItem(index, { productId: "", productName: "", unit: "un", unitPrice: 0 });
      return;
    }
    updateItem(index, {
      productId: product.id,
      productName: product.name,
      unit: product.unit,
      unitPrice: defaultUnitPrice(product),
    });
  }

  function addItem() {
    onChange([...items, emptyLineItem()]);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  const total = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {items.map((item, index) => (
          <div
            key={index}
            className={cn(
              "rounded-lg border border-border p-3 flex flex-col gap-3",
              index % 2 === 1 && "bg-bg/50"
            )}
          >
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <ProductPicker
                  products={products}
                  value={item.productId}
                  onSelect={(id) => selectProduct(index, id)}
                />
              </div>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-text-muted hover:bg-danger-bg hover:text-danger transition-colors"
                aria-label="Remover item"
              >
                <Trash2 size={15} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-text-muted uppercase tracking-wide">Qtd.</span>
                <Input
                  type="number"
                  min={0.01}
                  step="any"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                  className="text-right"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-text-muted uppercase tracking-wide">{priceLabel}</span>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(index, { unitPrice: Number(e.target.value) })}
                  className="text-right"
                />
              </label>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-text-muted uppercase tracking-wide">Subtotal</span>
                <p className="font-mono text-sm py-2 text-right">{formatCurrency(item.quantity * item.unitPrice)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="ghost" size="sm" onClick={addItem} className="self-start">
        <Plus size={14} /> Adicionar item
      </Button>

      <div className="flex justify-end pt-2 border-t border-border">
        <div className="text-right">
          <p className="text-xs text-text-muted">Total</p>
          <p className="font-display font-semibold text-xl">{formatCurrency(total)}</p>
        </div>
      </div>
    </div>
  );
}
