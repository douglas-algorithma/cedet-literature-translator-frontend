import { create } from "zustand";

import type { Book, BookPayload } from "@/types/book";

import { booksService } from "@/services/booksService";

type BookStore = {
  books: Book[];
  currentBook: Book | null;
  isLoading: boolean;
  error?: string;
  fetchBooks: () => Promise<void>;
  fetchBookById: (id: string) => Promise<void>;
  createBook: (payload: BookPayload) => Promise<Book | null>;
  updateBook: (id: string, payload: BookPayload) => Promise<Book | null>;
  deleteBook: (id: string) => Promise<boolean>;
  setCurrentBook: (book: Book | null) => void;
};

const setLoading = (set: (state: Partial<BookStore>) => void, isLoading: boolean) =>
  set({ isLoading, error: undefined });

export const useBookStore = create<BookStore>((set, get) => ({
  books: [],
  currentBook: null,
  isLoading: false,
  error: undefined,
  fetchBooks: async () => {
    setLoading(set, true);
    try {
      const books = await booksService.list();
      set({ books });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },
  fetchBookById: async (id) => {
    setLoading(set, true);
    try {
      const cached = get().books.find((item) => item.id === id);
      const book = cached ?? (await booksService.get(id));
      set({ currentBook: book });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },
  createBook: async (payload) => {
    setLoading(set, true);
    try {
      const book = await booksService.create(payload);
      set((state) => ({ books: [...state.books, book] }));
      return book;
    } catch (error) {
      set({ error: (error as Error).message });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
  updateBook: async (id, payload) => {
    setLoading(set, true);
    try {
      const book = await booksService.update(id, payload);
      set((state) => ({
        books: state.books.map((item) => (item.id === book.id ? book : item)),
        currentBook: state.currentBook?.id === book.id ? book : state.currentBook,
      }));
      return book;
    } catch (error) {
      set({ error: (error as Error).message });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
  deleteBook: async (id) => {
    setLoading(set, true);
    try {
      await booksService.delete(id);
      set((state) => ({
        books: state.books.filter((item) => item.id !== id),
        currentBook: state.currentBook?.id === id ? null : state.currentBook,
      }));
      return true;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
  setCurrentBook: (book) => set({ currentBook: book }),
}));
