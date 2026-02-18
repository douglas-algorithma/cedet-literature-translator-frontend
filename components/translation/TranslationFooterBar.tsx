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
    <div className="fixed inset-x-0 bottom-3 z-20 mx-3 rounded-2xl border border-border bg-surface/95 p-3 shadow-[var(--shadow-strong)] backdrop-blur sm:bottom-5 sm:mx-auto sm:w-[min(960px,calc(100%-2rem))] sm:rounded-3xl sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text">
            {pendingReviewCount} parágrafo{pendingReviewCount > 1 ? "s" : ""} aguardando revisão
          </p>
          <p className="text-xs text-text-muted">Aprove ou refine para continuar o fluxo.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <Button size="sm" variant="secondary" className="w-full sm:w-auto" onClick={onOpenReview}>
            Ver detalhes
          </Button>
          <Button size="sm" className="w-full sm:w-auto" onClick={onApprove}>
            Aprovar
          </Button>
          <Button size="sm" variant="ghost" className="w-full sm:w-auto" onClick={onSkip}>
            Pular para próximo
          </Button>
        </div>
      </div>
    </div>
  );
}
