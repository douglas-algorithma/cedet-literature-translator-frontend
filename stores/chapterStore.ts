import { create } from "zustand";

import type { Chapter, ChapterPayload, Paragraph } from "@/types/chapter";

import { chaptersService } from "@/services/chaptersService";

type ChapterStore = {
  chapters: Chapter[];
  currentChapter: Chapter | null;
  paragraphs: Paragraph[];
  insertionMode: "paragraph" | "bulk" | null;
  isLoading: boolean;
  fetchChapters: (bookId: string) => Promise<void>;
  createChapter: (bookId: string, payload: ChapterPayload) => Promise<Chapter | null>;
  updateChapter: (id: string, payload: Partial<ChapterPayload>) => Promise<Chapter | null>;
  deleteChapter: (id: string) => Promise<boolean>;
  reorderChapters: (bookId: string, order: Chapter[]) => Promise<boolean>;
  fetchParagraphs: (chapterId: string) => Promise<void>;
  addParagraph: (chapterId: string, text: string, order: number) => Promise<Paragraph | null>;
  setInsertionMode: (mode: "paragraph" | "bulk" | null) => void;
};

export const useChapterStore = create<ChapterStore>((set) => ({
  chapters: [],
  currentChapter: null,
  paragraphs: [],
  insertionMode: null,
  isLoading: false,
  fetchChapters: async (bookId) => {
    set({ isLoading: true });
    try {
      const chapters = await chaptersService.list(bookId);
      set({ chapters });
    } finally {
      set({ isLoading: false });
    }
  },
  createChapter: async (bookId, payload) => {
    set({ isLoading: true });
    try {
      const chapter = await chaptersService.create(bookId, payload);
      set((state) => ({ chapters: [...state.chapters, chapter] }));
      return chapter;
    } catch {
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
  updateChapter: async (id, payload) => {
    set({ isLoading: true });
    try {
      const chapter = await chaptersService.update(id, payload);
      set((state) => ({
        chapters: state.chapters.map((item) => (item.id === chapter.id ? chapter : item)),
        currentChapter: state.currentChapter?.id === chapter.id ? chapter : state.currentChapter,
      }));
      return chapter;
    } catch {
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
  deleteChapter: async (id) => {
    set({ isLoading: true });
    try {
      await chaptersService.delete(id);
      set((state) => ({
        chapters: state.chapters.filter((item) => item.id !== id),
        currentChapter: state.currentChapter?.id === id ? null : state.currentChapter,
      }));
      return true;
    } catch {
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
  reorderChapters: async (bookId, order) => {
    set({ isLoading: true });
    try {
      set({ chapters: order });
      await chaptersService.reorder(bookId, order);
      return true;
    } catch {
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
  fetchParagraphs: async (chapterId) => {
    set({ isLoading: true });
    try {
      const paragraphs = await chaptersService.listParagraphs(chapterId);
      set({ paragraphs });
    } finally {
      set({ isLoading: false });
    }
  },
  addParagraph: async (chapterId, text, order) => {
    set({ isLoading: true });
    try {
      const paragraph = await chaptersService.addParagraph(chapterId, text, order);
      set((state) => ({ paragraphs: [...state.paragraphs, paragraph] }));
      return paragraph;
    } catch {
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
  setInsertionMode: (mode) => set({ insertionMode: mode }),
}));
