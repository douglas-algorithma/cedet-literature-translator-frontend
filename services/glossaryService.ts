import type { GlossaryTerm } from "@/types/glossary";

import { apiClient } from "@/lib/api";
import { parseGlossaryContext, serializeGlossaryContext } from "@/lib/utils/glossary";

type GlossaryApi = {
  id: string;
  book_id?: string | null;
  source_term: string;
  target_term: string;
  context: string;
  created_at: string;
};

const handleResponse = <T>(response: { success: boolean; data?: T; error?: { message: string } }) => {
  if (!response.success) {
    throw new Error(response.error?.message ?? "Erro inesperado");
  }
  return response.data as T;
};

const mapTerm = (term: GlossaryApi): GlossaryTerm => ({
  ...(() => {
    const parsed = parseGlossaryContext(term.context ?? "");
    return {
      context: parsed.notes,
      category: parsed.category,
      caseSensitive: parsed.caseSensitive,
      wholeWord: parsed.wholeWord,
    };
  })(),
  id: term.id,
  bookId: term.book_id ?? null,
  sourceTerm: term.source_term,
  targetTerm: term.target_term,
  createdAt: term.created_at,
});

export const glossaryService = {
  list: async (bookId?: string) => {
    const query = bookId ? `?book_id=${encodeURIComponent(bookId)}` : "";
    const data = handleResponse<GlossaryApi[]>(await apiClient.get(`/glossary${query}`));
    return data.map(mapTerm);
  },
  create: async (payload: {
    bookId?: string | null;
    sourceTerm: string;
    targetTerm: string;
    context: string;
    category?: string;
    caseSensitive?: boolean;
    wholeWord?: boolean;
  }) => {
    const data = handleResponse<GlossaryApi>(
      await apiClient.post("/glossary", {
        book_id: payload.bookId ?? null,
        source_term: payload.sourceTerm,
        target_term: payload.targetTerm,
        context: serializeGlossaryContext({
          notes: payload.context,
          category: payload.category,
          caseSensitive: payload.caseSensitive,
          wholeWord: payload.wholeWord,
        }),
      }),
    );
    return mapTerm(data);
  },
  update: async (id: string, payload: Partial<Omit<GlossaryTerm, "id" | "createdAt">>) => {
    const data = handleResponse<GlossaryApi>(
      await apiClient.put(`/glossary/${id}`, {
        source_term: payload.sourceTerm,
        target_term: payload.targetTerm,
        context: serializeGlossaryContext({
          notes: payload.context ?? "",
          category: payload.category,
          caseSensitive: payload.caseSensitive,
          wholeWord: payload.wholeWord,
        }),
      }),
    );
    return mapTerm(data);
  },
  delete: async (id: string) => handleResponse<void>(await apiClient.delete(`/glossary/${id}`)),
};
