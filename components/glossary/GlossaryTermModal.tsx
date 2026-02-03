"use client";

import { useState } from "react";

import { Button } from "@/components/common/Button";
import { ComboBox } from "@/components/common/ComboBox";
import { Input } from "@/components/common/Input";
import { Modal } from "@/components/common/Modal";
import { Textarea } from "@/components/common/Textarea";
import { Toggle } from "@/components/common/Toggle";
import type { GlossaryTerm } from "@/types/glossary";

export type GlossaryTermFormValues = {
  sourceTerm: string;
  targetTerm: string;
  category?: string;
  context: string;
  caseSensitive: boolean;
  wholeWord: boolean;
};

type GlossaryTermModalProps = {
  open: boolean;
  title: string;
  categories: string[];
  initialValues: GlossaryTermFormValues;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: GlossaryTermFormValues) => void;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
};

export function GlossaryTermModal({
  open,
  title,
  categories,
  initialValues,
  loading,
  onClose,
  onSubmit,
  secondaryAction,
}: GlossaryTermModalProps) {
  const [values, setValues] = useState<GlossaryTermFormValues>(initialValues);

  const isValid = values.sourceTerm.trim().length > 0 && values.targetTerm.trim().length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex justify-end gap-2">
          {secondaryAction ? (
            <Button variant="ghost" type="button" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          ) : null}
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" loading={loading} disabled={!isValid} onClick={() => onSubmit(values)}>
            Salvar
          </Button>
        </div>
      }
      size="lg"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Termo original"
          value={values.sourceTerm}
          onChange={(event) => setValues((state) => ({ ...state, sourceTerm: event.target.value }))}
        />
        <Input
          label="Tradução"
          value={values.targetTerm}
          onChange={(event) => setValues((state) => ({ ...state, targetTerm: event.target.value }))}
        />
        <ComboBox
          label="Categoria"
          placeholder="Digite ou selecione"
          value={values.category ?? ""}
          options={categories.map((category) => ({ label: category, value: category }))}
          onChange={(event) => setValues((state) => ({ ...state, category: event.target.value }))}
        />
        <div className="flex flex-col gap-3 text-sm text-text">
          <span className="font-medium">Opções</span>
          <Toggle
            checked={values.caseSensitive}
            onChange={(checked) => setValues((state) => ({ ...state, caseSensitive: checked }))}
            label="Case-sensitive"
          />
          <Toggle
            checked={values.wholeWord}
            onChange={(checked) => setValues((state) => ({ ...state, wholeWord: checked }))}
            label="Palavra completa"
          />
        </div>
      </div>
      <div className="mt-4">
        <Textarea
          label="Contexto / notas"
          rows={4}
          value={values.context}
          onChange={(event) => setValues((state) => ({ ...state, context: event.target.value }))}
        />
      </div>
    </Modal>
  );
}

export const toFormValues = (term?: GlossaryTerm): GlossaryTermFormValues => ({
  sourceTerm: term?.sourceTerm ?? "",
  targetTerm: term?.targetTerm ?? "",
  category: term?.category ?? "",
  context: term?.context ?? "",
  caseSensitive: term?.caseSensitive ?? false,
  wholeWord: term?.wholeWord ?? false,
});
