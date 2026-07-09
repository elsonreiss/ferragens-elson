"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Client } from "@/domain/entities/Client";

// Busca de cliente por nome/documento/telefone, com sugestões — mesmo
// padrão do ProductPicker usado nos orçamentos/vendas.
export function OpenClientNote({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

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
      ? clients
      : clients.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            (c.document ?? "").toLowerCase().includes(q) ||
            (c.phone ?? "").toLowerCase().includes(q)
        )
  ).slice(0, 50);

  async function openNote() {
    if (!selected) {
      setError("Selecione um cliente.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/client-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: selected.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao abrir nota do cliente.");
      router.push(`/notas-clientes/${json.data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
      <div ref={wrapperRef} className="relative w-full sm:w-80">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={open ? query : selected ? selected.name : ""}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
              if (!open) setOpen(true);
            }}
            onFocus={() => {
              setOpen(true);
              setQuery("");
            }}
            placeholder="Buscar cliente por nome, documento ou telefone..."
            className="w-full rounded-lg border border-border bg-surface pl-8 pr-7 py-2.5 text-sm text-text placeholder:text-text-muted/70 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-colors"
          />
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        </div>

        {open && (
          <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-surface border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto scrollbar-thin">
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-sm text-text-muted text-center">Nenhum cliente encontrado.</p>
            )}
            {filtered.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => {
                  setSelected(c);
                  setQuery("");
                  setOpen(false);
                  setError(null);
                }}
                className="w-full flex flex-col items-start px-3 py-2 text-left text-sm hover:bg-bg transition-colors"
              >
                <span className="font-medium truncate w-full">{c.name}</span>
                <span className="text-xs text-text-muted">
                  {c.phone ?? c.document ?? "Sem contato cadastrado"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Button onClick={openNote} disabled={loading}>
        <NotebookPen size={16} /> {loading ? "Abrindo..." : "Abrir nota"}
      </Button>

      {error && <p className="text-sm text-danger sm:self-center">{error}</p>}
    </div>
  );
}
