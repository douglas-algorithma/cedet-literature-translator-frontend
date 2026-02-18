"use client";

import Link from "next/link";

import { Badge } from "@/components/common/Badge";
import { buttonStyles } from "@/components/common/Button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/common/Card";
import { ProgressBar } from "@/components/common/ProgressBar";
import { BookActions } from "@/components/book/BookActions";
import {
  formatBookLanguages,
  formatBookStatus,
  formatDate,
  getBookProgressFromChapters,
  getStatusVariant,
} from "@/lib/utils";
import type { Book } from "@/types/book";

export type BookCardProps = {
  book: Book;
  onDeleted?: () => void;
};

export function BookCard({ book, onDeleted }: BookCardProps) {
  const progress = getBookProgressFromChapters({
    totalChapters: book.totalChapters ?? 0,
    translatedChapters: book.translatedChapters ?? 0,
    totalParagraphs: book.totalParagraphs ?? 0,
    translatedParagraphs: book.translatedParagraphs ?? 0,
  });
  const translatedChapters = book.translatedChapters ?? 0;
  const totalChapters = book.totalChapters ?? 0;
  const chapters = `${translatedChapters}/${totalChapters} capítulos`;
  const statusLabel = formatBookStatus(book.status);
  const statusVariant = getStatusVariant(book.status);
  const genresSummary = book.genre?.slice(0, 3).join(", ");

  return (
    <Card className="flex h-full min-h-[250px] flex-col overflow-hidden md:min-h-[280px]">
      <CardHeader className="flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <CardTitle
            className="min-h-[4.5rem] break-words leading-6 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden"
            title={book.title}
          >
            {book.title}
          </CardTitle>
          <p className="mt-1 truncate text-sm text-text-muted" title={book.author}>
            {book.author}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 self-start">
          <Badge variant={statusVariant}>{statusLabel}</Badge>
          <BookActions bookId={book.id} onDeleted={onDeleted} />
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="flex flex-col gap-1 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <span className="truncate" title={formatBookLanguages(book)}>
            {formatBookLanguages(book)}
          </span>
          <span className="shrink-0">{chapters}</span>
        </div>
        {book.genre?.length ? (
          <p className="line-clamp-2 break-words text-xs text-text-muted" title={genresSummary}>
            Categorias: {genresSummary}
          </p>
        ) : null}
        <div>
          <ProgressBar value={progress} />
          <div className="mt-2 flex flex-col gap-1 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between">
            <span>{progress}% concluído</span>
            <span className="truncate" title={`Atualizado ${formatDate(book.updatedAt)}`}>
              Atualizado {formatDate(book.updatedAt)}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
        <Link
          className={buttonStyles({
            variant: "outline",
            size: "sm",
            className: "w-full justify-center sm:w-auto",
          })}
          href={`/books/${book.id}/edit`}
        >
          Editar
        </Link>
        <Link
          className={buttonStyles({ size: "sm", className: "w-full justify-center sm:w-auto" })}
          href={`/books/${book.id}`}
        >
          Abrir
        </Link>
      </CardFooter>
    </Card>
  );
}
