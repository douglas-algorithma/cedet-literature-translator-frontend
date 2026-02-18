import type { Book, BookPayload } from "@/types/book";

import { apiClient } from "@/lib/api";
import { isChapterTranslated } from "@/lib/utils";
import { chaptersService } from "@/services/chaptersService";

type BookApi = {
  id: string;
  title: string;
  author: string;
  source_language: string;
  target_language: string;
  description?: string | null;
  categories?: string[] | null;
  primary_category?: string | null;
  translation_notes?: string | null;
  llm_model: "openai/gpt-4.1" | "openai/gpt-4.1-mini" | "anthropic/claude-sonnet-4.6";
  has_openrouter_api_key: boolean;
  openrouter_api_key_masked?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

const handleResponse = <T>(response: { success: boolean; data?: T; error?: { message: string } }) => {
  if (!response.success) {
    throw new Error(response.error?.message ?? "Erro inesperado");
  }
  return response.data as T;
};

const mapBook = (book: BookApi): Book => ({
  id: book.id,
  title: book.title,
  author: book.author,
  sourceLanguage: book.source_language,
  targetLanguage: book.target_language,
  description: book.description ?? undefined,
  genre: book.categories ?? [],
  primaryCategory: book.primary_category ?? undefined,
  translationNotes: book.translation_notes ?? undefined,
  llmModel: book.llm_model,
  hasOpenrouterApiKey: book.has_openrouter_api_key,
  openrouterApiKeyMasked: book.openrouter_api_key_masked ?? undefined,
  status: book.status as Book["status"],
  createdAt: book.created_at,
  updatedAt: book.updated_at,
});

const toBookCreatePayload = (payload: BookPayload) => ({
  title: payload.title,
  author: payload.author,
  source_language: payload.sourceLanguage,
  target_language: payload.targetLanguage,
  description: payload.description,
  categories: payload.genre ?? [],
  primary_category: payload.primaryCategory ?? payload.genre?.[0],
  translation_notes: payload.translationNotes,
  llm_model: payload.llmModel ?? "openai/gpt-4.1",
  openrouter_api_key: payload.openrouterApiKey,
});

const toBookUpdatePayload = (payload: BookPayload) => {
  const requestPayload: Record<string, unknown> = {
    title: payload.title,
    author: payload.author,
    source_language: payload.sourceLanguage,
    target_language: payload.targetLanguage,
    description: payload.description,
    categories: payload.genre ?? [],
    primary_category: payload.primaryCategory ?? payload.genre?.[0],
    translation_notes: payload.translationNotes,
    llm_model: payload.llmModel ?? "openai/gpt-4.1",
    status: payload.status,
  };
  if (payload.openrouterApiKey) {
    requestPayload.openrouter_api_key = payload.openrouterApiKey;
  }
  return requestPayload;
};

export const booksService = {
  list: async () => {
    const data = handleResponse<BookApi[]>(await apiClient.get("/books"));
    return data.map(mapBook);
  },
  listWithStats: async () => {
    const books = await booksService.list();
    const chapters = await Promise.all(
      books.map((book) => chaptersService.listWithStats(book.id).catch(() => [])),
    );
    return books.map((book, index) => {
      const bookChapters = chapters[index] ?? [];
      const totalChapters = bookChapters.length;
      const translatedChapters = bookChapters.filter((chapter) => isChapterTranslated(chapter)).length;
      const totalParagraphs = bookChapters.reduce(
        (sum, chapter) => sum + (chapter.totalParagraphs ?? 0),
        0,
      );
      const translatedParagraphs = bookChapters.reduce(
        (sum, chapter) => sum + (chapter.translatedParagraphs ?? 0),
        0,
      );
      return {
        ...book,
        totalChapters,
        translatedChapters,
        totalParagraphs,
        translatedParagraphs,
      };
    });
  },
  get: async (id: string) => {
    const data = handleResponse<BookApi>(
      await apiClient.get(`/books/${encodeURIComponent(id)}`),
    );
    return mapBook(data);
  },
  create: async (payload: BookPayload) => {
    const data = handleResponse<BookApi>(
      await apiClient.post("/books", toBookCreatePayload(payload)),
    );
    return mapBook(data);
  },
  update: async (id: string, payload: BookPayload) => {
    const data = handleResponse<BookApi>(
      await apiClient.put(`/books/${encodeURIComponent(id)}`, toBookUpdatePayload(payload)),
    );
    return mapBook(data);
  },
  delete: async (id: string) =>
    handleResponse<void>(await apiClient.delete(`/books/${encodeURIComponent(id)}`)),
};
