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
  chapterId?: string;
  paragraphId?: string;
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
  enforcementMode?: "hard" | "soft";
};

export type TranslationResult = {
  status: string;
  strategy?: string | null;
  threadId?: string | null;
  translatedText?: string | null;
  reviewPackage?: Record<string, unknown> | null;
  agentOutputs?: Record<string, unknown>;
  enforcementReport?: Record<string, unknown> | null;
};

export type TranslationJobStatus = "queued" | "running" | "completed" | "failed";

export type TranslationJobUpdate = {
  status: TranslationJobStatus;
  message?: string;
};

type TranslationRequestOptions = {
  onStatus?: (update: TranslationJobUpdate) => void;
  pollIntervalMs?: number;
  timeoutMs?: number;
};

type TranslationResponsePayload = {
  status: string;
  strategy?: string | null;
  thread_id?: string | null;
  translated_text?: string | null;
  review_package?: Record<string, unknown> | null;
  agent_outputs?: Record<string, unknown>;
  enforcement_report?: Record<string, unknown> | null;
};

type TranslationJobStartPayload = {
  job_id: string;
  status: TranslationJobStatus;
  message?: string | null;
};

type TranslationJobStatusPayload = {
  job_id: string;
  status: TranslationJobStatus;
  message?: string | null;
  result?: TranslationResponsePayload | null;
  error?: string | null;
};

const handleResponse = <T>(response: { success: boolean; data?: T; error?: { message: string } }) => {
  if (!response.success) {
    throw new Error(response.error?.message ?? "Erro inesperado");
  }
  return response.data as T;
};

const noRetryConfig = { retries: 0, delay: 0 };
const defaultPollIntervalMs = 1500;
const defaultTimeoutMs = 15 * 60 * 1000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const buildRequestPayload = (payload: TranslationRequestPayload) => ({
  book_id: payload.bookId,
  book_title: payload.bookTitle,
  chapter_id: payload.chapterId,
  paragraph_id: payload.paragraphId,
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
  enforcement_mode: payload.enforcementMode,
  feedback_items: payload.feedbackItems?.map((item) => ({
    feedback_id: item.feedbackId ?? `feedback-${Date.now()}`,
    type: item.type ?? "CUSTOM",
    issue: item.issue,
    notes: item.notes ?? "",
  })),
});

const mapResult = (data: TranslationResponsePayload): TranslationResult => ({
  status: data.status,
  strategy: data.strategy,
  threadId: data.thread_id,
  translatedText: data.translated_text,
  reviewPackage: data.review_package,
  agentOutputs: data.agent_outputs,
  enforcementReport: data.enforcement_report,
});

const pollTranslationJob = async (
  jobId: string,
  options?: TranslationRequestOptions,
): Promise<TranslationResponsePayload> => {
  const pollIntervalMs = options?.pollIntervalMs ?? defaultPollIntervalMs;
  const timeoutMs = options?.timeoutMs ?? defaultTimeoutMs;
  const startedAt = Date.now();

  while (Date.now() - startedAt <= timeoutMs) {
    const statusData = handleResponse<TranslationJobStatusPayload>(
      await apiClient.get(`/translate/jobs/${jobId}`),
    );
    options?.onStatus?.({
      status: statusData.status,
      message: statusData.message ?? undefined,
    });

    if (statusData.status === "completed") {
      if (!statusData.result) {
        throw new Error("A tradução foi concluída sem resultado.");
      }
      return statusData.result;
    }

    if (statusData.status === "failed") {
      throw new Error(statusData.error ?? statusData.message ?? "Falha ao processar tradução.");
    }

    await sleep(pollIntervalMs);
  }

  throw new Error("Tempo limite atingido ao aguardar conclusão da tradução.");
};

export const translationService = {
  translateParagraph: async (
    payload: TranslationRequestPayload,
    options?: TranslationRequestOptions,
  ) => {
    const jobStart = handleResponse<TranslationJobStartPayload>(
      await apiClient.post(
        "/translate/paragraph/async",
        buildRequestPayload(payload),
        undefined,
        noRetryConfig,
      ),
    );
    options?.onStatus?.({
      status: jobStart.status,
      message: jobStart.message ?? undefined,
    });
    const data = await pollTranslationJob(jobStart.job_id, options);
    return mapResult(data);
  },
  refineParagraph: async (
    payload: TranslationRequestPayload & {
      feedback: string;
    },
    options?: TranslationRequestOptions,
  ) => {
    return translationService.translateParagraph({
      ...payload,
      feedbackItems: [
        {
          type: "CUSTOM",
          issue: payload.feedback,
        },
      ],
    }, options);
  },
};
