import { create } from "zustand";

import {
  glossaryService,
  type GlossaryBulkMutationResult,
  type GlossaryMutationResult,
} from "@/services/glossaryService";
import type { GlossarySuggestion, GlossaryTerm } from "@/types/glossary";

/**
 * Build a suggestion id set from a list.
 *
 * @param terms - Suggestion list.
 * @returns Set of suggestion identifiers.
 */
const buildSuggestionIdSet = (terms: GlossarySuggestion[]) => new Set(terms.map((term) => term.id));

type GlossaryStore = {
  terms: GlossaryTerm[];
  pendingTerms: GlossarySuggestion[];
  appliedTerms: Map<string, GlossaryTerm[]>;
  isLoading: boolean;
  fetchTerms: (bookId: string) => Promise<void>;
  fetchSuggestions: (bookId: string) => Promise<void>;
  addTerm: (term: GlossaryTerm) => void;
  updateTerm: (term: GlossaryTerm) => void;
  deleteTerm: (id: string) => void;
  addPendingTerm: (term: GlossarySuggestion) => void;
  approvePendingTerm: (term: GlossarySuggestion) => Promise<GlossaryMutationResult>;
  approvePendingTerms: (terms: GlossarySuggestion[]) => Promise<GlossaryBulkMutationResult>;
  rejectPendingTerm: (term: GlossarySuggestion) => Promise<void>;
  rejectPendingTerms: (terms: GlossarySuggestion[]) => Promise<void>;
};

export const useGlossaryStore = create<GlossaryStore>((set) => ({
  terms: [],
  pendingTerms: [],
  appliedTerms: new Map(),
  isLoading: false,
  fetchTerms: async () => {
    set({ isLoading: true });
    set({ isLoading: false });
  },
  addTerm: (term) => set((state) => ({ terms: [...state.terms, term] })),
  updateTerm: (term) =>
    set((state) => ({
      terms: state.terms.map((item) => (item.id === term.id ? term : item)),
    })),
  deleteTerm: (id) =>
    set((state) => ({ terms: state.terms.filter((item) => item.id !== id) })),
  fetchSuggestions: async (bookId: string) => {
    set({ isLoading: true });
    try {
      const suggestions = await glossaryService.listSuggestions(bookId);
      set({ pendingTerms: suggestions, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
  addPendingTerm: (term) =>
    set((state) => {
      const exists = state.pendingTerms.some((item) => item.id === term.id);
      if (exists) return state;
      return { pendingTerms: [...state.pendingTerms, term] };
    }),
  approvePendingTerm: async (term) => {
    const result = await glossaryService.approveSuggestion(term.id);
    set((state) => ({
      pendingTerms: state.pendingTerms.filter((item) => item.id !== term.id),
    }));
    return result;
  },
  /**
   * Approve multiple pending suggestions.
   *
   * @param terms - Suggestions to approve.
   */
  approvePendingTerms: async (terms) => {
    const ids = buildSuggestionIdSet(terms);
    const result = await glossaryService.approveSuggestions(Array.from(ids));
    set((state) => ({
      pendingTerms: state.pendingTerms.filter((item) => !ids.has(item.id)),
    }));
    return result;
  },
  rejectPendingTerm: async (term) => {
    await glossaryService.rejectSuggestion(term.id);
    set((state) => ({
      pendingTerms: state.pendingTerms.filter((item) => item.id !== term.id),
    }));
  },
  /**
   * Reject multiple pending suggestions.
   *
   * @param terms - Suggestions to reject.
   */
  rejectPendingTerms: async (terms) => {
    const ids = buildSuggestionIdSet(terms);
    await glossaryService.rejectSuggestions(Array.from(ids));
    set((state) => ({
      pendingTerms: state.pendingTerms.filter((item) => !ids.has(item.id)),
    }));
  },
}));
