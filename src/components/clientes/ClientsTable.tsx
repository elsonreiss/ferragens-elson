"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Plus, Pencil, Trash2, Phone, Mail } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Form";
import { Client } from "@/domain/entities/Client";

export function ClientsTable({ initialClients }: { initialClients: Client[] }) {
  const router = useRouter();
  const [clients, setClients] = useState(initialClients);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setClients(initialClients);
  }, [initialClients]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    fetch(`/api/clients?${params.toString()}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => setClients(json.data))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [search]);

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Excluir o cliente "${name}"? Essa ação não pode ser desfeita.`)) return;
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    if (res.ok) {
      setClients((prev) => prev.filter((c) => c.id !== id));
      router.refresh();
    } else {
      const json = await res.json();
      alert(json.error ?? "Erro ao excluir cliente.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, documento, telefone ou e-mail..."
            className="pl-9"
          />
        </div>
        <Link href="/clientes/novo">
          <Button>
            <Plus size={16} /> Novo cliente
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-bg">
              <tr className="text-left text-xs text-text-muted uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Documento</th>
                <th className="px-4 py-3 font-medium">Contato</th>
                <th className="px-4 py-3 font-medium">Cidade/UF</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!loading && clients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-text-muted">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-bg/60 transition-colors">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-text-muted font-mono text-xs">{c.document ?? "—"}</td>
                  <td className="px-4 py-3 text-text-muted">
                    <div className="flex flex-col gap-0.5">
                      {c.phone && (
                        <span className="flex items-center gap-1.5 text-xs">
                          <Phone size={12} /> {c.phone}
                        </span>
                      )}
                      {c.email && (
                        <span className="flex items-center gap-1.5 text-xs">
                          <Mail size={12} /> {c.email}
                        </span>
                      )}
                      {!c.phone && !c.email && "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {c.city ? `${c.city}${c.state ? "/" + c.state : ""}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/clientes/${c.id}`}
                        title="Editar"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:bg-navy-700/10 hover:text-navy-700 dark:hover:text-blue-500 transition-colors"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        title="Excluir"
                        onClick={() => handleDelete(c.id, c.name)}
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
    </div>
  );
}
