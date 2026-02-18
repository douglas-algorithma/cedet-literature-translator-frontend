"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/common/Button";
import { cn } from "@/lib/utils";

type ParagraphOriginalCardProps = {
  index: number;
  text: string;
  highlightedText?: ReactNode;
  dataParagraphId?: string;
  isActive?: boolean;
  onTranslate?: () => void;
  onFocus?: () => void;
  onEditOriginal?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
};

export function ParagraphOriginalCard({
  index,
  text,
  highlightedText,
  dataParagraphId,
  isActive,
  onTranslate,
  onFocus,
  onEditOriginal,
  onDelete,
  onMoveUp,
  onMoveDown,
}: ParagraphOriginalCardProps) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-2xl border border-border bg-surface px-4 py-3 shadow-sm transition",
        isActive ? "border-brand/60 ring-2 ring-brand/20" : "hover:border-brand/40",
      )}
      data-paragraph-id={dataParagraphId}
      onClick={onFocus}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter") onFocus?.();
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 sm:items-center">
        <p className="text-xs font-semibold text-text-muted">Parágrafo {index}</p>
        <div className="flex flex-wrap items-center gap-2">
          {onMoveUp ? (
            <button
              type="button"
              className="inline-flex min-h-8 items-center rounded border border-border px-2.5 py-1 text-xs text-text-muted"
              onClick={(event) => {
                event.stopPropagation();
                onMoveUp();
              }}
            >
              ↑
            </button>
          ) : null}
          {onMoveDown ? (
            <button
              type="button"
              className="inline-flex min-h-8 items-center rounded border border-border px-2.5 py-1 text-xs text-text-muted"
              onClick={(event) => {
                event.stopPropagation();
                onMoveDown();
              }}
            >
              ↓
            </button>
          ) : null}
          {onEditOriginal ? (
            <button
              type="button"
              className="inline-flex min-h-8 items-center rounded border border-border px-2.5 py-1 text-xs text-brand"
              onClick={(event) => {
                event.stopPropagation();
                onEditOriginal();
              }}
            >
              Editar
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              className="inline-flex min-h-8 items-center rounded border border-border px-2.5 py-1 text-xs text-danger"
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
            >
              Excluir
            </button>
          ) : null}
        </div>
      </div>
      <p className="mt-2 break-words whitespace-pre-wrap text-sm text-text">
        {highlightedText ?? text}
      </p>
      {onTranslate ? (
        <div className="mt-3">
          <Button size="sm" variant="ghost" onClick={onTranslate}>
            Traduzir
          </Button>
        </div>
      ) : null}
    </div>
  );
}
