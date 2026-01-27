import { useCallback, useMemo, useState } from "react";

type Paragraph = {
  id: string;
  chapter_id: string;
  order: number;
  original_text: string;
  translated_text: string | null;
  status: string;
};

type TranslationMeta = {
  status: string;
  strategy: string | null;
  thread_id: string | null;
  agent_outputs: Record<string, unknown>;
};

type WorkspaceState = {
  bookId: string;
  chapterId: string;
  chapterNumber: number;
  sourceLanguage: string;
  targetLanguage: string;
  paragraphs: Paragraph[];
  selectedId: string;
  translatedText: string;
  translationStatus: string;
  meta: TranslationMeta | null;
  loading: boolean;
  translating: boolean;
  saving: boolean;
  error: string;
};

type TranslationPayload = {
  book_id: string;
  chapter_number: number;
  paragraph_sequence: number;
  source_language: string;
  target_language: string;
  original_text: string;
};

type TranslationResponse = {
  status: string;
  strategy: string | null;
  thread_id: string | null;
  translated_text: string | null;
  agent_outputs: Record<string, unknown>;
};

const defaultState: WorkspaceState = {
  bookId: "",
  chapterId: "",
  chapterNumber: 1,
  sourceLanguage: "en",
  targetLanguage: "pt-BR",
  paragraphs: [],
  selectedId: "",
  translatedText: "",
  translationStatus: "pending",
  meta: null,
  loading: false,
  translating: false,
  saving: false,
  error: ""
};

/**
 * Provides state and actions for the translation workspace.
 *
 * Returns:
 *   WorkspaceState and action handlers.
 */
export function useTranslationWorkspace() {
  const [state, setState] = useState<WorkspaceState>(defaultState);

  const selectedParagraph = useMemo(
    () => state.paragraphs.find((item) => item.id === state.selectedId) ?? null,
    [state.paragraphs, state.selectedId]
  );

  /**
   * Loads paragraphs for the selected chapter.
   *
   * Returns:
   *   Promise<void> when completed.
   */
  const loadParagraphs = useCallback(async () => {
    if (!state.chapterId) {
      setState((prev) => ({ ...prev, paragraphs: [], selectedId: "" }));
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const response = await fetch(`/api/paragraphs/chapters/${state.chapterId}`);
      if (!response.ok) {
        throw new Error("Falha ao carregar paragrafos.");
      }
      const data = (await response.json()) as Paragraph[];
      const sorted = [...data].sort((a, b) => a.order - b.order);
      setState((prev) => ({
        ...prev,
        paragraphs: sorted,
        selectedId: prev.selectedId || sorted[0]?.id || ""
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Erro ao carregar paragrafos."
      }));
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [state.chapterId]);

  /**
   * Selects a paragraph and syncs editor state.
   *
   * Args:
   *   id: Paragraph identifier.
   */
  const selectParagraph = useCallback((id: string) => {
    setState((prev) => {
      const paragraph = prev.paragraphs.find((item) => item.id === id);
      if (!paragraph) {
        return prev;
      }
      return {
        ...prev,
        selectedId: id,
        translatedText: paragraph.translated_text ?? "",
        translationStatus: paragraph.status,
        meta: null
      };
    });
  }, []);

  /**
   * Updates a field in the workspace state.
   *
   * Args:
   *   key: Field key.
   *   value: Field value.
   */
  const updateField = useCallback(<K extends keyof WorkspaceState>(key: K, value: WorkspaceState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Runs translation for the selected paragraph.
   *
   * Returns:
   *   Promise<void> when completed.
   */
  const translateSelected = useCallback(async () => {
    if (!selectedParagraph) {
      setState((prev) => ({ ...prev, error: "Selecione um paragrafo." }));
      return;
    }
    setState((prev) => ({ ...prev, translating: true, error: "" }));
    try {
      const payload = buildTranslationPayload(state, selectedParagraph);
      const response = await fetch("/api/translate/paragraph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error("Falha ao traduzir paragrafo.");
      }
      const data = (await response.json()) as TranslationResponse;
      setState((prev) => ({
        ...prev,
        translatedText: data.translated_text ?? "",
        meta: {
          status: data.status,
          strategy: data.strategy,
          thread_id: data.thread_id,
          agent_outputs: data.agent_outputs ?? {}
        }
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Erro ao traduzir."
      }));
    } finally {
      setState((prev) => ({ ...prev, translating: false }));
    }
  }, [selectedParagraph, state]);

  /**
   * Persists the current translation to the backend.
   *
   * Returns:
   *   Promise<void> when completed.
   */
  const saveTranslation = useCallback(async () => {
    if (!selectedParagraph) {
      setState((prev) => ({ ...prev, error: "Selecione um paragrafo." }));
      return;
    }
    setState((prev) => ({ ...prev, saving: true, error: "" }));
    try {
      const response = await fetch(`/api/paragraphs/${selectedParagraph.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          original_text: selectedParagraph.original_text,
          translated_text: state.translatedText || null,
          status: state.translationStatus
        })
      });
      if (!response.ok) {
        throw new Error("Falha ao salvar paragrafo.");
      }
      await loadParagraphs();
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Erro ao salvar."
      }));
    } finally {
      setState((prev) => ({ ...prev, saving: false }));
    }
  }, [selectedParagraph, state.translatedText, state.translationStatus, loadParagraphs]);

  return {
    state,
    selectedParagraph,
    loadParagraphs,
    selectParagraph,
    updateField,
    translateSelected,
    saveTranslation
  };
}

/**
 * Builds a translation payload from workspace state.
 *
 * Args:
 *   state: Current workspace state.
 *   paragraph: Selected paragraph.
 *
 * Returns:
 *   TranslationPayload for the API.
 */
function buildTranslationPayload(state: WorkspaceState, paragraph: Paragraph): TranslationPayload {
  return {
    book_id: state.bookId,
    chapter_number: state.chapterNumber,
    paragraph_sequence: paragraph.order,
    source_language: state.sourceLanguage,
    target_language: state.targetLanguage,
    original_text: paragraph.original_text
  };
}
