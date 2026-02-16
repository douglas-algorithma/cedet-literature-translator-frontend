"use client";

import { Button } from "@/components/common/Button";

type TranslationFooterBarProps = {
  pendingReviewCount: number;
  onOpenReview?: () => void;
  onApprove?: () => void;
  onSkip?: () => void;
};

export function TranslationFooterBar({
  pendingReviewCount,
  onOpenReview,
  onApprove,
  onSkip,
}: TranslationFooterBarProps) {
  if (pendingReviewCount === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-20 mx-4 rounded-3xl border border-border bg-surface/95 p-4 shadow-[var(--shadow-strong)] backdrop-blur sm:bottom-6 sm:mx-auto sm:w-[min(960px,calc(100%-2rem))]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text">
            {pendingReviewCount} parágrafo{pendingReviewCount > 1 ? "s" : ""} aguardando revisão
          </p>
          <p className="text-xs text-text-muted">Aprove ou refine para continuar o fluxo.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={onOpenReview}>
            Ver detalhes
          </Button>
          <Button size="sm" onClick={onApprove}>
            Aprovar
          </Button>
          <Button size="sm" variant="ghost" onClick={onSkip}>
            Pular para próximo
          </Button>
        </div>
      </div>
    </div>
  );
}
