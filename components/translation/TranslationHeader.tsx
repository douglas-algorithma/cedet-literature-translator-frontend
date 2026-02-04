"use client";

import Link from "next/link";

import { Button } from "@/components/common/Button";
import { ProgressBar } from "@/components/common/ProgressBar";
import { Select, type SelectOption } from "@/components/common/Select";
import { ConnectionBadge } from "@/components/translation/ConnectionBadge";

type TranslationHeaderProps = {
  backHref: string;
  title: string;
  subtitle?: string;
  chapterOptions: SelectOption[];
  selectedChapter: string;
  onChapterChange: (value: string) => void;
  progressLabel: string;
  progressValue: number;
  onTranslateAll: () => void;
  isTranslating?: boolean;
  onGenerateGlossary?: () => void;
  isGeneratingGlossary?: boolean;
  connectionStatus: "connected" | "reconnecting" | "offline" | "disabled";
  reconnectAttempts?: number;
};

export function TranslationHeader({
  backHref,
  title,
  subtitle,
  chapterOptions,
  selectedChapter,
  onChapterChange,
  progressLabel,
  progressValue,
  onTranslateAll,
  isTranslating,
  onGenerateGlossary,
  isGeneratingGlossary,
  connectionStatus,
  reconnectAttempts,
}: TranslationHeaderProps) {
  return (
    <div className="sticky top-6 z-10 space-y-4 rounded-3xl border border-border bg-surface/95 p-5 shadow-[var(--shadow-soft)] backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Link href={backHref} className="text-sm font-semibold text-text-muted hover:text-text">
              ← Voltar
            </Link>
            <ConnectionBadge status={connectionStatus} reconnectAttempts={reconnectAttempts} />
          </div>
          <h1 className="font-display text-2xl font-semibold text-text">{title}</h1>
          {subtitle ? <p className="text-sm text-text-muted">{subtitle}</p> : null}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-[220px]">
            <Select
              label="Capítulo"
              value={selectedChapter}
              options={chapterOptions}
              onChange={(event) => onChapterChange(event.target.value)}
            />
          </div>
          {onGenerateGlossary ? (
            <Button
              type="button"
              variant="outline"
              onClick={onGenerateGlossary}
              loading={isGeneratingGlossary}
            >
              Gerar glossário
            </Button>
          ) : null}
          <Button type="button" onClick={onTranslateAll} loading={isTranslating}>
            Traduzir capítulo
          </Button>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-text-muted">
            <span>Progresso do capítulo</span>
            <span className="text-text">{progressLabel}</span>
          </div>
          <ProgressBar value={progressValue} />
        </div>
      </div>
    </div>
  );
}
