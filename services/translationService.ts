import { apiClient } from "@/lib/api";

export type TranslationFeedbackItemPayload = {
  feedbackId?: string;
  type?:
    | "CORRECTION"
    | "PREFERENCE"
    | "CLARIFICATION"
    | "TERMINOLOGY"
    | "REWRITE"
    | "ACCEPT_ALTERNATIVE"
    | "CUSTOM";
  issue: string;
  notes?: string;
};

export type TranslationRequestPayload = {
  bookId: string;
  bookTitle?: string;
  chapterNumber: number;
  paragraphSequence: number;
  sourceLanguage: string;
  targetLanguage: string;
  originalText: string;
  threadId?: string;
  previousTranslated?: string;
  genre?: string;
  formality?: string;
  styleNotes?: string;
  tone?: string;
  specificConcerns?: string;
  context?: string;
  glossaryEntries?: string;
  feedbackItems?: TranslationFeedbackItemPayload[];
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
        thread_id: payload.threadId,
        previous_translated: payload.previousTranslated,
        genre: payload.genre,
        formality: payload.formality,
        style_notes: payload.styleNotes,
        tone: payload.tone,
        specific_concerns: payload.specificConcerns,
        context: payload.context,
        glossary_entries: payload.glossaryEntries,
        feedback_items: payload.feedbackItems?.map((item) => ({
          feedback_id: item.feedbackId ?? `feedback-${Date.now()}`,
          type: item.type ?? "CUSTOM",
          issue: item.issue,
          notes: item.notes ?? "",
        })),
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
  refineParagraph: async (
    payload: TranslationRequestPayload & {
      feedback: string;
    },
  ) => {
    return translationService.translateParagraph({
      ...payload,
      feedbackItems: [
        {
          type: "CUSTOM",
          issue: payload.feedback,
        },
      ],
    });
  },
};
