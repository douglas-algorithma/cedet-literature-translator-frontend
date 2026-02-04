import type { GlossarySuggestion, GlossaryTerm } from "@/types/glossary";

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

type GlossarySuggestionApi = {
  id: string;
  book_id: string;
  chapter_id: string;
  source_term: string;
  suggested_translation: string;
  context: string;
  category?: string | null;
  confidence: number;
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

/**
 * Map glossary suggestion API payload to UI model.
 *
 * @param suggestion - Glossary suggestion payload.
 * @returns GlossarySuggestion mapped object.
 */
const mapSuggestion = (suggestion: GlossarySuggestionApi): GlossarySuggestion => ({
  id: suggestion.id,
  bookId: suggestion.book_id,
  chapterId: suggestion.chapter_id,
  term: suggestion.source_term,
  suggestedTranslation: suggestion.suggested_translation,
  context: suggestion.context,
  category: suggestion.category,
  confidence: suggestion.confidence,
  createdAt: suggestion.created_at,
});

/**
 * Approve multiple glossary suggestions.
 *
 * @param suggestionIds - Suggestion identifiers.
 * @returns Approved glossary terms.
 */
const approveSuggestions = async (suggestionIds: string[]) => {
  if (suggestionIds.length === 0) {
    return [];
  }
  const approved = await Promise.all(
    suggestionIds.map((id) => glossaryService.approveSuggestion(id)),
  );
  return approved;
};

/**
 * Reject multiple glossary suggestions.
 *
 * @param suggestionIds - Suggestion identifiers.
 */
const rejectSuggestions = async (suggestionIds: string[]) => {
  if (suggestionIds.length === 0) {
    return;
  }
  await Promise.all(suggestionIds.map((id) => glossaryService.rejectSuggestion(id)));
};

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
  listSuggestions: async (bookId: string) => {
    const data = handleResponse<GlossarySuggestionApi[]>(
      await apiClient.get(`/glossary/suggestions?book_id=${encodeURIComponent(bookId)}`),
    );
    return data.map(mapSuggestion);
  },
  generateSuggestions: async (chapterId: string) => {
    const data = handleResponse<GlossarySuggestionApi[]>(
      await apiClient.post(`/glossary/suggestions/chapters/${encodeURIComponent(chapterId)}`),
    );
    return data.map(mapSuggestion);
  },
  approveSuggestion: async (suggestionId: string) => {
    const data = handleResponse<GlossaryApi>(
      await apiClient.post(`/glossary/suggestions/${encodeURIComponent(suggestionId)}/approve`),
    );
    return mapTerm(data);
  },
  rejectSuggestion: async (suggestionId: string) => {
    await handleResponse<void>(
      await apiClient.delete(`/glossary/suggestions/${encodeURIComponent(suggestionId)}`),
    );
  },
  approveSuggestions,
  rejectSuggestions,
};
