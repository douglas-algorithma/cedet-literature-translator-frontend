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
};

export function ParagraphOriginalCard({
  index,
  text,
  highlightedText,
  dataParagraphId,
  isActive,
  onTranslate,
  onFocus,
}: ParagraphOriginalCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface px-4 py-3 shadow-sm transition",
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
      <p className="text-xs font-semibold text-text-muted">Parágrafo {index}</p>
      <p className="mt-2 text-sm text-text">{highlightedText ?? text}</p>
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
