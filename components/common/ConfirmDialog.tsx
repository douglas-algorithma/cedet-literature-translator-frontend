"use client";

import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isDanger,
  onConfirm,
  onClose,
  loading,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} type="button">
            {cancelText}
          </Button>
          <Button
            variant={isDanger ? "destructive" : "primary"}
            onClick={onConfirm}
            type="button"
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      {description ? <p className="text-sm text-text-muted">{description}</p> : null}
    </Modal>
  );
}
