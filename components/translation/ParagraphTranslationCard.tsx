"use client";

import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Spinner } from "@/components/common/Spinner";
import { TRANSLATION_STATUS_BADGES, TRANSLATION_STATUS_CARD_STYLES, TRANSLATION_STATUS_LABELS } from "@/config/translation";
import { cn } from "@/lib/utils";
import type { TranslationProgress, TranslationStatus } from "@/types/translation";

type ParagraphTranslationCardProps = {
  index: number;
  translation?: string;
  status: TranslationStatus;
  progress?: TranslationProgress;
  glossaryStatus?: {
    total: number;
    applied: number;
    missing: number;
    missingTerms?: string[];
  };
  dataParagraphId?: string;
  isActive?: boolean;
  onTranslate?: () => void;
  onApprove?: () => void;
  onOpenReview?: () => void;
  onRefine?: () => void;
  onRetry?: () => void;
};

export function ParagraphTranslationCard({
  index,
  translation,
  status,
  progress,
  glossaryStatus,
  dataParagraphId,
  isActive,
  onTranslate,
  onApprove,
  onOpenReview,
  onRefine,
  onRetry,
}: ParagraphTranslationCardProps) {
  const showActions = status === "review";
  const isInteractive = Boolean(onOpenReview);
  const showGlossaryInfo = glossaryStatus && glossaryStatus.total > 0;

  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 shadow-sm transition",
        TRANSLATION_STATUS_CARD_STYLES[status],
        isActive ? "ring-2 ring-brand/20" : "hover:border-brand/40",
      )}
      data-paragraph-id={dataParagraphId}
      onClick={onOpenReview}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={(event) => {
        if (event.key === "Enter") onOpenReview?.();
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-text-muted">Parágrafo {index}</p>
        <Badge variant={TRANSLATION_STATUS_BADGES[status]}>
          {TRANSLATION_STATUS_LABELS[status]}
        </Badge>
      </div>

      {status === "pending" ? (
        <p className="mt-3 text-sm text-text-muted">Aguardando tradução.</p>
      ) : null}

      {status === "translating" ? (
        <div className="mt-3 flex items-center gap-2 text-sm text-text">
          <Spinner className="h-4 w-4" />
          <span>Traduzindo...</span>
          {progress?.currentAgent ? (
            <span className="text-xs text-text-muted">({progress.currentAgent})</span>
          ) : null}
          {progress?.message ? (
            <span className="text-xs text-text-muted">{progress.message}</span>
          ) : null}
        </div>
      ) : null}

      {status === "error" ? (
        <p className="mt-3 text-sm text-danger">{progress?.error ?? "Erro ao traduzir."}</p>
      ) : null}

      {status !== "pending" && status !== "translating" ? (
        <p
          className={cn(
            "mt-3 break-words whitespace-pre-wrap text-sm",
            status === "approved" ? "text-text" : "text-text",
          )}
        >
          {translation || "Tradução indisponível."}
        </p>
      ) : null}

      {status === "pending" && onTranslate ? (
        <div className="mt-3">
          <Button size="sm" variant="outline" className="min-h-10 w-full sm:w-auto" onClick={onTranslate}>
            Traduzir
          </Button>
        </div>
      ) : null}

      {status === "error" && onRetry ? (
        <div className="mt-3">
          <Button size="sm" variant="outline" className="min-h-10 w-full sm:w-auto" onClick={onRetry}>
            Tentar novamente
          </Button>
        </div>
      ) : null}

      {showActions ? (
        <div className="mt-4 flex flex-wrap items-stretch gap-2">
          <Button size="sm" className="min-h-10 w-full sm:w-auto" onClick={onApprove}>
            Aprovar
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="min-h-10 w-full sm:w-auto"
            onClick={onOpenReview}
          >
            Editar
          </Button>
          <Button size="sm" variant="ghost" className="min-h-10 w-full sm:w-auto" onClick={onRefine}>
            Refinamento
          </Button>
        </div>
      ) : null}

      {status === "approved" && onOpenReview ? (
        <div className="mt-4">
          <Button size="sm" variant="ghost" className="min-h-10 w-full sm:w-auto" onClick={onOpenReview}>
            Editar tradução
          </Button>
        </div>
      ) : null}

      {showGlossaryInfo ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-text-muted">
          <Badge variant={glossaryStatus.missing ? "warning" : "success"}>
            Glossário {glossaryStatus.missing ? "pendente" : "ok"}
          </Badge>
          <span>
            {glossaryStatus.applied}/{glossaryStatus.total} termos aplicados
          </span>
          {glossaryStatus.missingTerms?.length ? (
            <span className="break-words text-warning">
              · Falta: {glossaryStatus.missingTerms.join(", ")}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
