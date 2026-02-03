import type { Book, BookStatus } from "@/types/book";
import { STATUS_LABELS } from "@/config/books";

export const getBookProgress = (book: Pick<Book, "translatedChapters" | "totalChapters">) => {
  if (!book.totalChapters || !book.translatedChapters) return 0;
  return Math.round((book.translatedChapters / book.totalChapters) * 100);
};

export const getBookProgressFromChapters = (values: {
  totalChapters: number;
  translatedChapters: number;
  totalParagraphs: number;
  translatedParagraphs: number;
}) => {
  if (values.totalParagraphs) {
    return Math.round((values.translatedParagraphs / values.totalParagraphs) * 100);
  }
  if (values.totalChapters) {
    return Math.round((values.translatedChapters / values.totalChapters) * 100);
  }
  return 0;
};

export const formatBookLanguages = (book: Pick<Book, "sourceLanguage" | "targetLanguage">) =>
  `${book.sourceLanguage} → ${book.targetLanguage}`;

export const formatBookStatus = (status: BookStatus) => STATUS_LABELS[status];

export const formatDate = (value: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(date);
};

export const getStatusVariant = (status: BookStatus) => {
  switch (status) {
    case "completed":
      return "success" as const;
    case "paused":
      return "warning" as const;
    case "draft":
      return "neutral" as const;
    default:
      return "info" as const;
  }
};
