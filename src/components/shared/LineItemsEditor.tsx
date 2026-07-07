"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Form";
import { formatCurrency } from "@/lib/format";
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

  function selectProduct(index: number, productId: string) {
    const product = products.find((p) => p.id === Number(productId));
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
      <div className="overflow-x-auto scrollbar-thin -mx-1">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-left text-xs text-text-muted uppercase tracking-wide">
              <th className="px-1 py-2 font-medium">Produto</th>
              <th className="px-1 py-2 font-medium w-24 text-right">Qtd.</th>
              <th className="px-1 py-2 font-medium w-32 text-right">{priceLabel}</th>
              <th className="px-1 py-2 font-medium w-32 text-right">Subtotal</th>
              <th className="px-1 py-2 font-medium w-10"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-t border-border">
                <td className="px-1 py-2">
                  <Select
                    value={item.productId === "" ? "" : String(item.productId)}
                    onChange={(e) => selectProduct(index, e.target.value)}
                  >
                    <option value="">Selecione um produto...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name} ({p.quantity} {p.unit} em estoque)
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="px-1 py-2">
                  <Input
                    type="number"
                    min={0.01}
                    step="any"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                    className="text-right"
                  />
                </td>
                <td className="px-1 py-2">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, { unitPrice: Number(e.target.value) })}
                    className="text-right"
                  />
                </td>
                <td className="px-1 py-2 text-right font-mono">
                  {formatCurrency(item.quantity * item.unitPrice)}
                </td>
                <td className="px-1 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:bg-danger-bg hover:text-danger transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
