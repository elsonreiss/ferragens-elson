"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { Product } from "@/domain/entities/Product";
import { MovementType } from "@/domain/entities/Common";

export function StockMovementModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const router = useRouter();
  const [type, setType] = useState<MovementType>("entrada");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}/stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, quantity: Number(quantity), reason: reason || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao registrar movimentação.");
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title={`Movimentar estoque — ${product.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-text-muted -mt-1">
          Estoque atual: <span className="font-mono font-medium text-text">{product.quantity} {product.unit}</span>
        </p>

        <Field label="Tipo de movimentação" required>
          <Select value={type} onChange={(e) => setType(e.target.value as MovementType)}>
            <option value="entrada">Entrada (compra / devolução)</option>
            <option value="saida">Saída (venda / perda)</option>
            <option value="ajuste">Ajuste (definir quantidade exata)</option>
          </Select>
        </Field>

        <Field label={type === "ajuste" ? "Nova quantidade" : "Quantidade"} required>
          <Input
            type="number"
            min={0}
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
            required
          />
        </Field>

        <Field label="Motivo / observação">
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex: Compra NF 1234" />
        </Field>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Confirmar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
