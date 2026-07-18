"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Plus, Pencil, Trash2, Phone, Mail } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Form";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Supplier } from "@/domain/entities/Common";

export function SuppliersTable({ initialSuppliers }: { initialSuppliers: Supplier[] }) {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setSuppliers(initialSuppliers);
  }, [initialSuppliers]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    fetch(`/api/suppliers?${params.toString()}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => setSuppliers(json.data))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [search]);

  async function handleDelete(id: number) {
    setDeleting(true);
    const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      router.refresh();
    } else {
      const json = await res.json();
      alert(json.error ?? "Erro ao excluir fornecedor.");
    }
    setDeleting(false);
    setConfirmTarget(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, empresa ou CNPJ..."
            className="pl-9"
          />
        </div>
        <Link href="/fornecedores/novo">
          <Button>
            <Plus size={16} /> Novo fornecedor
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-bg">
              <tr className="text-left text-xs text-text-muted uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Contato</th>
                <th className="px-4 py-3 font-medium">Empresa</th>
                <th className="px-4 py-3 font-medium">Contato</th>
                <th className="px-4 py-3 font-medium">Cidade/UF</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!loading && suppliers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-text-muted">
                    Nenhum fornecedor encontrado.
                  </td>
                </tr>
              )}
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-bg/60 transition-colors">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-text-muted">{s.company ?? "—"}</td>
                  <td className="px-4 py-3 text-text-muted">
                    <div className="flex flex-col gap-0.5">
                      {s.phone && (
                        <span className="flex items-center gap-1.5 text-xs">
                          <Phone size={12} /> {s.phone}
                        </span>
                      )}
                      {s.email && (
                        <span className="flex items-center gap-1.5 text-xs">
                          <Mail size={12} /> {s.email}
                        </span>
                      )}
                      {!s.phone && !s.email && "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {s.city ? `${s.city}${s.state ? "/" + s.state : ""}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/fornecedores/${s.id}`}
                        title="Editar"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:bg-navy-700/10 hover:text-navy-700 dark:hover:text-blue-500 transition-colors"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        title="Excluir"
                        onClick={() => setConfirmTarget({ id: s.id, name: s.name })}
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

      {confirmTarget && (
        <ConfirmDialog
          title="Excluir fornecedor"
          message={`Excluir o fornecedor "${confirmTarget.name}"? Essa ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          loading={deleting}
          onConfirm={() => handleDelete(confirmTarget.id)}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
    </div>
  );
}
