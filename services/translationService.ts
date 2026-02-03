import { apiClient } from "@/lib/api";

export type TranslationRequestPayload = {
  bookId: string;
  bookTitle?: string;
  chapterNumber: number;
  paragraphSequence: number;
  sourceLanguage: string;
  targetLanguage: string;
  originalText: string;
};

export type TranslationResult = {
  status: string;
  strategy?: string | null;
  threadId?: string | null;
  translatedText?: string | null;
  agentOutputs?: Record<string, unknown>;
};

const handleResponse = <T>(response: { success: boolean; data?: T; error?: { message: string } }) => {
  if (!response.success) {
    throw new Error(response.error?.message ?? "Erro inesperado");
  }
  return response.data as T;
};

export const translationService = {
  translateParagraph: async (payload: TranslationRequestPayload) => {
    const data = handleResponse<{
      status: string;
      strategy?: string | null;
      thread_id?: string | null;
      translated_text?: string | null;
      agent_outputs?: Record<string, unknown>;
    }>(
      await apiClient.post("/translate/paragraph", {
        book_id: payload.bookId,
        book_title: payload.bookTitle,
        chapter_number: payload.chapterNumber,
        paragraph_sequence: payload.paragraphSequence,
        source_language: payload.sourceLanguage,
        target_language: payload.targetLanguage,
        original_text: payload.originalText,
      }),
    );

    return {
      status: data.status,
      strategy: data.strategy,
      threadId: data.thread_id,
      translatedText: data.translated_text,
      agentOutputs: data.agent_outputs,
    } satisfies TranslationResult;
  },
};
