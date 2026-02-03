import { create } from "zustand";

import type { TranslationReview, TranslationStatus } from "@/types/translation";

type TranslationStore = {
  translationStatus: Map<string, TranslationStatus>;
  currentTranslation: TranslationReview | null;
  agentAnalysis: TranslationReview["analysis"] | null;
  hitlQueue: TranslationReview[];
  isProcessing: boolean;
  startTranslation: (paragraphId: string) => void;
  updateProgress: (paragraphId: string, status: TranslationStatus) => void;
  setReviewData: (review: TranslationReview) => void;
  approveTranslation: (paragraphId: string) => void;
  requestRefine: (paragraphId: string) => void;
  clearTranslation: () => void;
};

export const useTranslationStore = create<TranslationStore>((set, get) => ({
  translationStatus: new Map(),
  currentTranslation: null,
  agentAnalysis: null,
  hitlQueue: [],
  isProcessing: false,
  startTranslation: (paragraphId) => {
    const status = new Map(get().translationStatus);
    status.set(paragraphId, "em_traducao");
    set({ translationStatus: status, isProcessing: true });
  },
  updateProgress: (paragraphId, statusValue) => {
    const status = new Map(get().translationStatus);
    status.set(paragraphId, statusValue);
    set({ translationStatus: status });
  },
  setReviewData: (review) =>
    set((state) => ({
      currentTranslation: review,
      agentAnalysis: review.analysis ?? null,
      hitlQueue: [...state.hitlQueue, review],
      isProcessing: false,
    })),
  approveTranslation: (paragraphId) => {
    const status = new Map(get().translationStatus);
    status.set(paragraphId, "aprovado");
    set({ translationStatus: status, currentTranslation: null });
  },
  requestRefine: (paragraphId) => {
    const status = new Map(get().translationStatus);
    status.set(paragraphId, "em_traducao");
    set({ translationStatus: status, currentTranslation: null, isProcessing: true });
  },
  clearTranslation: () => set({ currentTranslation: null, agentAnalysis: null, isProcessing: false }),
}));
