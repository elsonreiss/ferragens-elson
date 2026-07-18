"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { User } from "@/domain/entities/User";
import { ROLE_LABELS } from "@/lib/auth";
import { UserModal } from "@/components/configuracoes/UserModal";

export function UsersPanel({ users, currentUserId }: { users: User[]; currentUserId: number }) {
  const router = useRouter();
  const [modalUser, setModalUser] = useState<User | "new" | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(id: number) {
    setDeleting(true);
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      const json = await res.json();
      alert(json.error ?? "Erro ao excluir usuário.");
    }
    setDeleting(false);
    setConfirmTarget(null);
  }

  return (
    <Card className="p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-sm">Usuários e permissões</h3>
          <p className="text-xs text-text-muted mt-0.5">Controle quem acessa o sistema e com qual papel.</p>
        </div>
        <Button size="sm" onClick={() => setModalUser("new")}>
          <Plus size={14} /> Novo usuário
        </Button>
      </div>

      <div className="flex flex-col divide-y divide-border">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium">{u.name}{u.id === currentUserId && <span className="text-xs text-text-muted"> (você)</span>}</p>
              <p className="text-xs text-text-muted">{u.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={u.role === "admin" ? "orange" : "neutral"}>{ROLE_LABELS[u.role] ?? u.role}</Badge>
              <button
                onClick={() => setModalUser(u)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:bg-navy-700/10 hover:text-navy-700 dark:hover:text-blue-500 transition-colors"
              >
                <Pencil size={15} />
              </button>
              {u.id !== currentUserId && (
                <button
                  onClick={() => setConfirmTarget({ id: u.id, name: u.name })}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:bg-danger-bg hover:text-danger transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {modalUser && (
        <UserModal user={modalUser === "new" ? undefined : modalUser} onClose={() => setModalUser(null)} />
      )}

      {confirmTarget && (
        <ConfirmDialog
          title="Excluir usuário"
          message={`Excluir o usuário "${confirmTarget.name}"?`}
          confirmLabel="Excluir"
          loading={deleting}
          onConfirm={() => handleDelete(confirmTarget.id)}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
    </Card>
  );
}
