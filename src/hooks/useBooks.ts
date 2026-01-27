import { useCallback, useEffect, useState } from "react";

export type Book = {
  id: string;
  title: string;
  author: string;
  source_language: string;
  target_language: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type BookFormState = {
  id?: string;
  title: string;
  author: string;
  source_language: string;
  target_language: string;
};

const emptyBook: BookFormState = {
  title: "",
  author: "",
  source_language: "en",
  target_language: "pt-BR"
};

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadBooks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/books");
      if (!response.ok) {
        throw new Error("Falha ao carregar livros.");
      }
      const data = (await response.json()) as Book[];
      setBooks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar livros.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBooks();
  }, [loadBooks]);

  const createBook = useCallback(async (payload: BookFormState) => {
    const response = await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error("Falha ao criar livro.");
    }
    await loadBooks();
  }, [loadBooks]);

  const updateBook = useCallback(async (id: string, payload: BookFormState) => {
    const response = await fetch(`/api/books/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error("Falha ao atualizar livro.");
    }
    await loadBooks();
  }, [loadBooks]);

  const deleteBook = useCallback(async (id: string) => {
    const response = await fetch(`/api/books/${id}`, { method: "DELETE" });
    if (!response.ok) {
      throw new Error("Falha ao remover livro.");
    }
    await loadBooks();
  }, [loadBooks]);

  return {
    books,
    loading,
    error,
    emptyBook,
    createBook,
    updateBook,
    deleteBook
  };
}
