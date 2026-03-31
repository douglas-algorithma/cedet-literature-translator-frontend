export type BookStatus = "draft" | "in_progress" | "completed" | "paused";
export type LlmModel =
  | "openai/gpt-4.1"
  | "openai/gpt-4.1-mini"
  | "anthropic/claude-sonnet-4.6"
  | "mistralai/mistral-large-2512";
export type TranslationStrategy = "auto" | "light" | "single" | "deep";

export type Book = {
  id: string;
  title: string;
  author: string;
  sourceLanguage: string;
  targetLanguage: string;
  totalChapters?: number;
  translatedChapters?: number;
  totalParagraphs?: number;
  translatedParagraphs?: number;
  status: BookStatus;
  updatedAt: string;
  createdAt: string;
  description?: string;
  genre?: string[];
  primaryCategory?: string;
  translationNotes?: string;
  llmModel: LlmModel;
  defaultStrategy: TranslationStrategy;
  hasOpenrouterApiKey: boolean;
  openrouterApiKeyMasked?: string;
};

export type BookPayload = {
  title: string;
  author: string;
  sourceLanguage: string;
  targetLanguage: string;
  status: BookStatus;
  description?: string;
  genre?: string[];
  primaryCategory?: string;
  translationNotes?: string;
  llmModel?: LlmModel;
  defaultStrategy?: TranslationStrategy;
  openrouterApiKey?: string;
};
