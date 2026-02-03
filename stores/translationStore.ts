import { create } from "zustand";

import type { TranslationProgress, TranslationReview, TranslationStatus } from "@/types/translation";

type TranslationStore = {
  statusByParagraph: Record<string, TranslationStatus>;
  progressByParagraph: Record<string, TranslationProgress>;
  currentReview: TranslationReview | null;
  reviewQueue: TranslationReview[];
  isProcessing: boolean;
  setStatus: (paragraphId: string, status: TranslationStatus) => void;
  setProgress: (paragraphId: string, progress: TranslationProgress) => void;
  setError: (paragraphId: string, message?: string) => void;
  setReviewData: (review: TranslationReview) => void;
  openReview: (review: TranslationReview) => void;
  closeReview: () => void;
  clearParagraphState: (paragraphId: string) => void;
};

export const useTranslationStore = create<TranslationStore>((set) => ({
  statusByParagraph: {},
  progressByParagraph: {},
  currentReview: null,
  reviewQueue: [],
  isProcessing: false,
  setStatus: (paragraphId, status) =>
    set((state) => ({
      statusByParagraph: { ...state.statusByParagraph, [paragraphId]: status },
      isProcessing: status === "translating" ? true : state.isProcessing,
    })),
  setProgress: (paragraphId, progress) =>
    set((state) => ({
      progressByParagraph: {
        ...state.progressByParagraph,
        [paragraphId]: { ...state.progressByParagraph[paragraphId], ...progress },
      },
    })),
  setError: (paragraphId, message) =>
    set((state) => ({
      statusByParagraph: { ...state.statusByParagraph, [paragraphId]: "error" },
      progressByParagraph: {
        ...state.progressByParagraph,
        [paragraphId]: { ...state.progressByParagraph[paragraphId], error: message },
      },
      isProcessing: false,
    })),
  setReviewData: (review) =>
    set((state) => {
      if (!state.currentReview) {
        return {
          currentReview: review,
          statusByParagraph: { ...state.statusByParagraph, [review.paragraphId]: "review" },
          isProcessing: false,
        };
      }
      return {
        reviewQueue: [...state.reviewQueue, review],
        statusByParagraph: { ...state.statusByParagraph, [review.paragraphId]: "review" },
        isProcessing: false,
      };
    }),
  openReview: (review) =>
    set((state) => ({
      currentReview: review,
      statusByParagraph: { ...state.statusByParagraph, [review.paragraphId]: "review" },
      reviewQueue: state.currentReview ? [state.currentReview, ...state.reviewQueue] : state.reviewQueue,
    })),
  closeReview: () =>
    set((state) => {
      const [next, ...rest] = state.reviewQueue;
      return {
        currentReview: next ?? null,
        reviewQueue: rest,
      };
    }),
  clearParagraphState: (paragraphId) =>
    set((state) => {
      const nextStatus = { ...state.statusByParagraph };
      const nextProgress = { ...state.progressByParagraph };
      delete nextStatus[paragraphId];
      delete nextProgress[paragraphId];
      return { statusByParagraph: nextStatus, progressByParagraph: nextProgress };
    }),
}));
