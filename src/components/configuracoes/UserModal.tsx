"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { User, UserRole } from "@/domain/entities/User";

export function UserModal({ user, onClose }: { user?: User; onClose: () => void }) {
  const router = useRouter();
  const isEdit = Boolean(user);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState<UserRole>(user?.role ?? "funcionario");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const url = isEdit ? `/api/users/${user!.id}` : "/api/users";
      const method = isEdit ? "PUT" : "POST";
      const body: Record<string, string> = { name, email, role };
      if (password) body.password = password;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao salvar usuário.");
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title={isEdit ? "Editar usuário" : "Novo usuário"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Nome" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="E-mail" required>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Papel" required>
          <Select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
            <option value="admin">Administrador</option>
            <option value="gerente">Gerente</option>
            <option value="funcionario">Funcionário</option>
          </Select>
        </Field>
        <Field label={isEdit ? "Nova senha" : "Senha"} required={!isEdit} hint={isEdit ? "Deixe em branco para manter a senha atual." : "Mínimo de 6 caracteres."}>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required={!isEdit} />
        </Field>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
        </div>
      </form>
    </Modal>
  );
}
