"use client";

import Link from "next/link";

import { Badge } from "@/components/common/Badge";
import { buttonStyles } from "@/components/common/Button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/common/Card";
import { ProgressBar } from "@/components/common/ProgressBar";
import { BookActions } from "@/components/book/BookActions";
import { formatBookLanguages, formatBookStatus, formatDate, getBookProgress, getStatusVariant } from "@/lib/utils";
import type { Book } from "@/types/book";

export type BookCardProps = {
  book: Book;
  onDeleted?: () => void;
};

export function BookCard({ book, onDeleted }: BookCardProps) {
  const progress = getBookProgress(book);
  const translatedChapters = book.translatedChapters ?? 0;
  const totalChapters = book.totalChapters ?? 0;
  const chapters = `${translatedChapters}/${totalChapters} capítulos`;
  const statusLabel = formatBookStatus(book.status);
  const statusVariant = getStatusVariant(book.status);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{book.title}</CardTitle>
          <p className="text-sm text-text-muted">{book.author}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant}>{statusLabel}</Badge>
          <BookActions bookId={book.id} onDeleted={onDeleted} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm text-text-muted">
          <span>{formatBookLanguages(book)}</span>
          <span>{chapters}</span>
        </div>
        <div>
          <ProgressBar value={progress} />
          <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
            <span>{progress}% concluído</span>
            <span>Atualizado {formatDate(book.updatedAt)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <Link className={buttonStyles({ variant: "outline", size: "sm" })} href={`/books/${book.id}/edit`}>
          Editar
        </Link>
        <Link className={buttonStyles({ size: "sm" })} href={`/books/${book.id}`}>
          Abrir
        </Link>
      </CardFooter>
    </Card>
  );
}
