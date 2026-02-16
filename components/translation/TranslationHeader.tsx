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
    <div className="sticky top-3 z-10 space-y-4 rounded-3xl border border-border bg-surface/95 p-4 shadow-[var(--shadow-soft)] backdrop-blur sm:top-6 sm:p-5">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start xl:gap-6">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link href={backHref} className="text-sm font-semibold text-text-muted hover:text-text">
              ← Voltar
            </Link>
            <ConnectionBadge status={connectionStatus} reconnectAttempts={reconnectAttempts} />
          </div>
          <h1
            className="font-display text-lg font-semibold leading-snug text-text sm:text-xl xl:text-2xl [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden"
            title={title}
          >
            {title}
          </h1>
          {subtitle ? (
            <p className="text-xs text-text-muted break-words sm:text-sm" title={subtitle}>
              {subtitle}
            </p>
          ) : null}
        </div>
        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 xl:w-auto xl:grid-cols-[minmax(220px,280px)_auto_auto] xl:items-end xl:justify-end">
          <div className="w-full sm:col-span-2 xl:col-span-1">
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
              className="w-full sm:w-auto"
              onClick={onGenerateGlossary}
              loading={isGeneratingGlossary}
            >
              Gerar glossário
            </Button>
          ) : null}
          <Button type="button" className="w-full sm:w-auto" onClick={onTranslateAll} loading={isTranslating}>
            Traduzir capítulo
          </Button>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="space-y-2">
          <div className="flex flex-col gap-1 text-xs font-semibold text-text-muted sm:flex-row sm:items-center sm:justify-between">
            <span>Progresso do capítulo</span>
            <span className="text-text">{progressLabel}</span>
          </div>
          <ProgressBar value={progressValue} />
        </div>
      </div>
    </div>
  );
}
