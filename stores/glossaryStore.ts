import { create } from "zustand";

import type { GlossarySuggestion, GlossaryTerm } from "@/types/glossary";

type GlossaryStore = {
  terms: GlossaryTerm[];
  pendingTerms: GlossarySuggestion[];
  appliedTerms: Map<string, GlossaryTerm[]>;
  isLoading: boolean;
  fetchTerms: (bookId: string) => Promise<void>;
  addTerm: (term: GlossaryTerm) => void;
  updateTerm: (term: GlossaryTerm) => void;
  deleteTerm: (id: string) => void;
  addPendingTerm: (term: GlossarySuggestion) => void;
  approvePendingTerm: (term: GlossarySuggestion) => void;
  rejectPendingTerm: (term: GlossarySuggestion) => void;
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
  addPendingTerm: (term) =>
    set((state) => ({
      pendingTerms: [...state.pendingTerms.filter((item) => item.term !== term.term), term],
    })),
  approvePendingTerm: (term) =>
    set((state) => ({
      pendingTerms: state.pendingTerms.filter((item) => item.term !== term.term),
    })),
  rejectPendingTerm: (term) =>
    set((state) => ({
      pendingTerms: state.pendingTerms.filter((item) => item.term !== term.term),
    })),
}));
