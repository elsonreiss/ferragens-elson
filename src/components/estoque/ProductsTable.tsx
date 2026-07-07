"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Plus, PackagePlus, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Form";
import { StockStatusBadge } from "@/components/estoque/StockStatusBadge";
import { StockMovementModal } from "@/components/estoque/StockMovementModal";
import { formatCurrency } from "@/lib/format";
import { Product, getStockStatus } from "@/domain/entities/Product";
import { Category } from "@/domain/entities/Common";

export function ProductsTable({ initialProducts, categories }: { initialProducts: Product[]; categories: Category[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "falta" | "baixo" | "ok">("todos");
  const [movementProduct, setMovementProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryId) params.set("categoryId", categoryId);
    if (statusFilter === "baixo") params.set("onlyLowStock", "true");
    if (statusFilter === "falta") params.set("onlyOutOfStock", "true");

    fetch(`/api/products?${params.toString()}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => setProducts(json.data))
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [search, categoryId, statusFilter]);

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Excluir o produto "${name}"? Essa ação não pode ser desfeita.`)) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      router.refresh();
    } else {
      const json = await res.json();
      alert(json.error ?? "Erro ao excluir produto.");
    }
  }

  const counts = useMemo(() => {
    return {
      falta: products.filter((p) => getStockStatus(p) === "falta").length,
      baixo: products.filter((p) => getStockStatus(p) === "baixo").length,
    };
  }, [products]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, código ou código de barras..."
            className="pl-9"
          />
        </div>
        <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-auto min-w-[160px]">
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="w-auto min-w-[160px]">
          <option value="todos">Todos os status</option>
          <option value="falta">Em falta ({counts.falta})</option>
          <option value="baixo">Estoque baixo ({counts.baixo})</option>
          <option value="ok">Ok</option>
        </Select>
        <Link href="/estoque/novo">
          <Button>
            <Plus size={16} /> Novo produto
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-bg">
              <tr className="text-left text-xs text-text-muted uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium text-right">Qtd.</th>
                <th className="px-4 py-3 font-medium text-right">Preço Compra</th>
                <th className="px-4 py-3 font-medium text-right">Preço Venda</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!loading && products.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-text-muted">
                    Nenhum produto encontrado com esses filtros.
                  </td>
                </tr>
              )}
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-bg/60 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-text-muted">{p.code}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-text-muted">{p.brand}</p>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{p.categoryName ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {p.quantity} {p.unit}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-text-muted">{formatCurrency(p.purchasePrice)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(p.salePrice)}</td>
                  <td className="px-4 py-3">
                    <StockStatusBadge product={p} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        title="Movimentar estoque"
                        onClick={() => setMovementProduct(p)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:bg-orange-500/10 hover:text-orange-600 transition-colors"
                      >
                        <PackagePlus size={16} />
                      </button>
                      <Link
                        href={`/estoque/${p.id}`}
                        title="Editar"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:bg-navy-700/10 hover:text-navy-700 dark:hover:text-blue-500 transition-colors"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        title="Excluir"
                        onClick={() => handleDelete(p.id, p.name)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:bg-danger-bg hover:text-danger transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {movementProduct && (
        <StockMovementModal product={movementProduct} onClose={() => setMovementProduct(null)} />
      )}
    </div>
  );
}
