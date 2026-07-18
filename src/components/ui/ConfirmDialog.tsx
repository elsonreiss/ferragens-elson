"use client";

import { Modal } from "./Modal";
import { Button } from "./Button";

export interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Modal de confirmação estilizado, para substituir o window.confirm() nativo
// do navegador (que aparece como um pop-up feio no topo da página) em todas
// as ações de exclusão/confirmação do sistema.
export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="flex flex-col gap-5">
        <p className="text-sm text-text-muted">{message}</p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button type="button" variant={danger ? "danger" : "primary"} onClick={onConfirm} disabled={loading}>
            {loading ? "Aguarde..." : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
