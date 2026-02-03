import type { GlossaryTerm } from "@/types/glossary";

import { apiClient } from "@/lib/api";

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
  id: term.id,
  bookId: term.book_id ?? null,
  sourceTerm: term.source_term,
  targetTerm: term.target_term,
  context: term.context,
  createdAt: term.created_at,
});

export const glossaryService = {
  list: async (bookId?: string) => {
    const query = bookId ? `?book_id=${encodeURIComponent(bookId)}` : "";
    const data = handleResponse<GlossaryApi[]>(await apiClient.get(`/glossary${query}`));
    return data.map(mapTerm);
  },
  create: async (payload: { bookId?: string | null; sourceTerm: string; targetTerm: string; context: string }) => {
    const data = handleResponse<GlossaryApi>(
      await apiClient.post("/glossary", {
        book_id: payload.bookId ?? null,
        source_term: payload.sourceTerm,
        target_term: payload.targetTerm,
        context: payload.context,
      }),
    );
    return mapTerm(data);
  },
  update: async (id: string, payload: Partial<Omit<GlossaryTerm, "id" | "createdAt">>) => {
    const data = handleResponse<GlossaryApi>(
      await apiClient.put(`/glossary/${id}`, {
        source_term: payload.sourceTerm,
        target_term: payload.targetTerm,
        context: payload.context,
      }),
    );
    return mapTerm(data);
  },
  delete: async (id: string) => handleResponse<void>(await apiClient.delete(`/glossary/${id}`)),
};
