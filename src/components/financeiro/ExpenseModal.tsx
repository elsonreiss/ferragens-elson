"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Field, Input } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";

const CATEGORIES = ["Aluguel", "Energia", "Água", "Fornecedores", "Salários", "Marketing", "Manutenção", "Impostos", "Outros"];

export function ExpenseModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, category, amount: Number(amount) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao registrar despesa.");
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Nova despesa" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Descrição" required>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Conta de energia" required />
        </Field>
        <Field label="Categoria">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Valor (R$)" required>
          <Input type="number" step="0.01" min={0.01} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" required />
        </Field>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Registrar"}</Button>
        </div>
      </form>
    </Modal>
  );
}
