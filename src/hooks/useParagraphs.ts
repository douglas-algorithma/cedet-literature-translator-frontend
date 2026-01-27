import { useCallback, useEffect, useState } from "react";

export type Paragraph = {
  id: string;
  chapter_id: string;
  order: number;
  original_text: string;
  translated_text: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type ParagraphFormState = {
  id?: string;
  chapter_id: string;
  order: number;
  original_text: string;
  translated_text: string;
  status: string;
};

const emptyParagraph: ParagraphFormState = {
  chapter_id: "",
  order: 1,
  original_text: "",
  translated_text: "",
  status: "pending"
};

export function useParagraphs() {
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterChapterId, setFilterChapterId] = useState("");

  const loadParagraphs = useCallback(async () => {
    if (!filterChapterId) {
      setParagraphs([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/paragraphs/chapters/${filterChapterId}`);
      if (!response.ok) {
        throw new Error("Falha ao carregar paragrafos.");
      }
      const data = (await response.json()) as Paragraph[];
      setParagraphs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar paragrafos.");
    } finally {
      setLoading(false);
    }
  }, [filterChapterId]);

  useEffect(() => {
    void loadParagraphs();
  }, [loadParagraphs]);

  const createParagraph = useCallback(async (payload: ParagraphFormState) => {
    if (!payload.chapter_id) {
      throw new Error("Informe o chapter_id.");
    }
    const response = await fetch(`/api/paragraphs/chapters/${payload.chapter_id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order: payload.order,
        original_text: payload.original_text
      })
    });
    if (!response.ok) {
      throw new Error("Falha ao criar paragrafo.");
    }
    await loadParagraphs();
  }, [loadParagraphs]);

  const updateParagraph = useCallback(async (id: string, payload: ParagraphFormState) => {
    const response = await fetch(`/api/paragraphs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        original_text: payload.original_text || null,
        translated_text: payload.translated_text || null,
        status: payload.status
      })
    });
    if (!response.ok) {
      throw new Error("Falha ao atualizar paragrafo.");
    }
    await loadParagraphs();
  }, [loadParagraphs]);

  const deleteParagraph = useCallback(async (id: string) => {
    const response = await fetch(`/api/paragraphs/${id}`, { method: "DELETE" });
    if (!response.ok) {
      throw new Error("Falha ao remover paragrafo.");
    }
    await loadParagraphs();
  }, [loadParagraphs]);

  return {
    paragraphs,
    loading,
    error,
    emptyParagraph,
    filterChapterId,
    setFilterChapterId,
    createParagraph,
    updateParagraph,
    deleteParagraph
  };
}
