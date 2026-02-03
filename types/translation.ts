export type TranslationStatus =
  | "pending"
  | "translating"
  | "review"
  | "approved"
  | "error";

export type AgentAnalysis = {
  glossary?: string[];
  semanticScore?: number;
  styleScore?: number;
  consistencyWarnings?: string[];
  notes?: string[];
};

export type TranslationReview = {
  paragraphId: string;
  translation: string;
  analysis?: AgentAnalysis;
  suggestions?: string[];
};

export type TranslationProgress = {
  progress?: number;
  currentAgent?: string;
  message?: string;
  error?: string;
};
