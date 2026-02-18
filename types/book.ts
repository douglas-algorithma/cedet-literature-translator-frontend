export type BookStatus = "draft" | "in_progress" | "completed" | "paused";
export type LlmModel = "openai/gpt-4.1" | "openai/gpt-4.1-mini" | "anthropic/claude-sonnet-4.6";

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
  openrouterApiKey?: string;
};
