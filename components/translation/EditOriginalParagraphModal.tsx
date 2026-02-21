"use client";

import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { Textarea } from "@/components/common/Textarea";

type EditOriginalParagraphModalProps = {
  open: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  loading?: boolean;
  error?: string;
  maxLength?: number;
};

export function EditOriginalParagraphModal({
  open,
  value,
  onChange,
  onClose,
  onSave,
  loading,
  error,
  maxLength = 100000,
}: EditOriginalParagraphModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar parágrafo original"
      size="xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="button" onClick={onSave} loading={loading} disabled={!value.trim()}>
            Salvar
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <Textarea
          label="Texto original"
          placeholder="Edite o conteúdo do parágrafo original"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={10}
          maxLength={maxLength}
          showCount
          error={error}
        />
        <p className="text-xs text-text-muted">
          Se este parágrafo já possuir tradução, ao salvar a edição o texto traduzido será limpo.
        </p>
      </div>
    </Modal>
  );
}
