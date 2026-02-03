import type { ChapterStatus } from "@/types/chapter";

export const CHAPTER_STATUS_LABELS: Record<ChapterStatus, string> = {
  pending: "Pendente",
  translating: "Em tradução",
  review: "Em revisão",
  translated: "Traduzido",
};

export const CHAPTER_STATUS_VARIANTS: Record<
  ChapterStatus,
  "neutral" | "info" | "warning" | "success"
> = {
  pending: "neutral",
  translating: "info",
  review: "warning",
  translated: "success",
};
