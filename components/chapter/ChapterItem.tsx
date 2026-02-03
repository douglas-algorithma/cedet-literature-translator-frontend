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
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-4 py-3"
      style={style}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-muted text-xs font-semibold text-text-muted">
          {chapter.number}
        </div>
        <div>
          <p className="text-sm font-semibold text-text">{chapter.title}</p>
          <p className="text-xs text-text-muted">
            {translatedParagraphs}/{totalParagraphs} parágrafos
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center gap-4 md:justify-end">
        <div className="min-w-[140px]">
          <ProgressBar value={progress} />
        </div>
        <Badge variant={CHAPTER_STATUS_VARIANTS[chapter.status]}>{statusLabel}</Badge>
        <Link className={buttonStyles({ size: "sm" })} href={`/books/${bookId}/chapters/${chapter.id}`}>
          Abrir
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-border px-3 py-2 text-xs text-text-muted hover:text-text"
            onClick={onEdit}
          >
            Editar
          </button>
          <button
            type="button"
            className="rounded-full border border-border px-3 py-2 text-xs text-danger hover:border-danger"
            onClick={onDelete}
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
