import { useCallback, useEffect, useMemo, useState } from "react";

export type GlossaryTerm = {
  id: string;
  book_id: string | null;
  source_term: string;
  target_term: string;
  context: string;
  created_at: string;
};

type GlossaryState = {
  terms: GlossaryTerm[];
  matches: GlossaryTerm[];
  loading: boolean;
  error: string;
};

const defaultState: GlossaryState = {
  terms: [],
  matches: [],
  loading: false,
  error: ""
};

/**
 * Loads glossary terms and provides matches against a text.
 *
 * Args:
 *   bookId: Book identifier filter.
 *   originalText: Source text for matching.
 *
 * Returns:
 *   Glossary state and refresh handler.
 */
export function useGlossaryLookup(bookId: string, originalText: string) {
  const [state, setState] = useState<GlossaryState>(defaultState);

  const loadTerms = useCallback(async () => {
    if (!bookId) {
      setState((prev) => ({ ...prev, terms: [], matches: [] }));
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const response = await fetch(`/api/glossary?book_id=${encodeURIComponent(bookId)}`);
      if (!response.ok) {
        throw new Error("Falha ao carregar glossario.");
      }
      const data = (await response.json()) as GlossaryTerm[];
      setState((prev) => ({ ...prev, terms: data }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Erro ao carregar glossario."
      }));
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [bookId]);

  useEffect(() => {
    void loadTerms();
  }, [loadTerms]);

  const matches = useMemo(() => {
    if (!originalText) {
      return [];
    }
    const text = originalText.toLowerCase();
    return state.terms.filter((term) => text.includes(term.source_term.toLowerCase()));
  }, [state.terms, originalText]);

  useEffect(() => {
    setState((prev) => ({ ...prev, matches }));
  }, [matches]);

  return {
    state,
    reload: loadTerms
  };
}
