import { useCallback, useEffect, useState } from "react";

export type Chapter = {
  id: string;
  book_id: string;
  title: string;
  order: number;
  status: string;
  epigraph: string | null;
  insertion_mode: string;
  created_at: string;
};

export type ChapterFormState = {
  id?: string;
  book_id: string;
  title: string;
  order: number;
  epigraph: string;
  insertion_mode: string;
  status: string;
};

const emptyChapter: ChapterFormState = {
  book_id: "",
  title: "",
  order: 1,
  epigraph: "",
  insertion_mode: "paragraph",
  status: "pending"
};

export function useChapters() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterBookId, setFilterBookId] = useState("");

  const loadChapters = useCallback(async () => {
    if (!filterBookId) {
      setChapters([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/chapters/books/${filterBookId}`);
      if (!response.ok) {
        throw new Error("Falha ao carregar capitulos.");
      }
      const data = (await response.json()) as Chapter[];
      setChapters(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar capitulos.");
    } finally {
      setLoading(false);
    }
  }, [filterBookId]);

  useEffect(() => {
    void loadChapters();
  }, [loadChapters]);

  const createChapter = useCallback(async (payload: ChapterFormState) => {
    if (!payload.book_id) {
      throw new Error("Informe o book_id.");
    }
    const response = await fetch(`/api/chapters/books/${payload.book_id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: payload.title,
        order: payload.order,
        epigraph: payload.epigraph || null,
        insertion_mode: payload.insertion_mode
      })
    });
    if (!response.ok) {
      throw new Error("Falha ao criar capitulo.");
    }
    await loadChapters();
  }, [loadChapters]);

  const updateChapter = useCallback(async (id: string, payload: ChapterFormState) => {
    const response = await fetch(`/api/chapters/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: payload.title,
        order: payload.order,
        epigraph: payload.epigraph || null,
        status: payload.status
      })
    });
    if (!response.ok) {
      throw new Error("Falha ao atualizar capitulo.");
    }
    await loadChapters();
  }, [loadChapters]);

  const deleteChapter = useCallback(async (id: string) => {
    const response = await fetch(`/api/chapters/${id}`, { method: "DELETE" });
    if (!response.ok) {
      throw new Error("Falha ao remover capitulo.");
    }
    await loadChapters();
  }, [loadChapters]);

  return {
    chapters,
    loading,
    error,
    emptyChapter,
    filterBookId,
    setFilterBookId,
    createChapter,
    updateChapter,
    deleteChapter
  };
}
