import type { BookStatus } from "@/types/book";

export const STATUS_LABELS: Record<BookStatus, string> = {
  draft: "Rascunho",
  in_progress: "Em andamento",
  completed: "Concluído",
  paused: "Pausado",
};

export const STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "in_progress", label: STATUS_LABELS.in_progress },
  { value: "completed", label: STATUS_LABELS.completed },
  { value: "paused", label: STATUS_LABELS.paused },
  { value: "draft", label: STATUS_LABELS.draft },
] as const;

export const ORDER_OPTIONS = [
  { value: "recent", label: "Mais recentes" },
  { value: "alpha", label: "Alfabético" },
  { value: "progress", label: "Progresso" },
] as const;

export const LANGUAGE_OPTIONS = [
  "Inglês",
  "Espanhol",
  "Francês",
  "Alemão",
  "Italiano",
  "Português (BR)",
  "Português (PT)",
  "Japonês",
  "Chinês",
] as const;

export const GENRE_OPTIONS = [
  "Ficção",
  "Não-ficção",
  "Fantasia",
  "Romance",
  "Histórico",
  "Suspense",
  "Técnico",
  "Poesia",
  "Infantojuvenil",
  "Filosofia",
  "Autoajuda",
  "Biografia",
  "Religioso",
  "Acadêmico",
  "Sci-fi",
  "Terror",
  "Drama",
  "Ensaio",
  "Policial",
] as const;
