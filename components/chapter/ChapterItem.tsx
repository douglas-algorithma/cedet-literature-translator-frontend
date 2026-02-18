"use client";

import Link from "next/link";
import { CSSProperties } from "react";

import { Badge } from "@/components/common/Badge";
import { buttonStyles } from "@/components/common/Button";
import { ProgressBar } from "@/components/common/ProgressBar";
import { CHAPTER_STATUS_LABELS, CHAPTER_STATUS_VARIANTS } from "@/config/chapters";
import { getChapterProgress } from "@/lib/utils";
import type { Chapter } from "@/types/chapter";

export function ChapterItem({
  chapter,
  bookId,
  style,
  onEdit,
  onDelete,
}: {
  chapter: Chapter;
  bookId: string;
  style?: CSSProperties;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const progress = getChapterProgress(chapter);
  const statusLabel = CHAPTER_STATUS_LABELS[chapter.status];
  const totalParagraphs = chapter.totalParagraphs ?? 0;
  const translatedParagraphs = chapter.translatedParagraphs ?? 0;

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border border-border bg-surface px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
      style={style}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-xs font-semibold text-text-muted">
          {chapter.number}
        </div>
        <div className="min-w-0">
          <p
            className="text-sm font-semibold text-text break-words leading-5 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden"
            title={chapter.title}
          >
            {chapter.title}
          </p>
          <p className="text-xs text-text-muted">
            {translatedParagraphs}/{totalParagraphs} parágrafos
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
        <div className="min-w-[120px] max-w-[220px] flex-1 sm:min-w-[140px] sm:flex-none">
          <ProgressBar value={progress} />
        </div>
        <Badge variant={CHAPTER_STATUS_VARIANTS[chapter.status]}>{statusLabel}</Badge>
        <Link
          className={buttonStyles({ size: "sm", className: "w-full justify-center sm:w-auto" })}
          href={`/books/${bookId}/chapters/${chapter.id}`}
        >
          Abrir
        </Link>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <button
            type="button"
            className="w-full rounded-full border border-border px-3 py-2 text-xs text-text-muted hover:text-text sm:w-auto"
            onClick={onEdit}
          >
            Editar
          </button>
          <button
            type="button"
            className="w-full rounded-full border border-border px-3 py-2 text-xs text-danger hover:border-danger sm:w-auto"
            onClick={onDelete}
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
