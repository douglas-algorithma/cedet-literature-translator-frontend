export type BookStatus = "draft" | "in_progress" | "completed" | "paused";

export type Book = {
  id: string;
  title: string;
  author: string;
  sourceLanguage: string;
  targetLanguage: string;
  totalChapters?: number;
  translatedChapters?: number;
  totalParagraphs?: number;
  translatedParagraphs?: number;
  status: BookStatus;
  updatedAt: string;
  createdAt: string;
  description?: string;
  genre?: string[];
  translationNotes?: string;
};

export type BookPayload = Omit<
  Book,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "totalChapters"
  | "translatedChapters"
  | "totalParagraphs"
  | "translatedParagraphs"
>;
