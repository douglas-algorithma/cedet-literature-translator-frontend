export type TranslationStatus =
  | "pendente"
  | "em_traducao"
  | "em_revisao"
  | "aprovado"
  | "erro";

export type AgentAnalysis = {
  glossary?: string[];
  semanticScore?: number;
  styleScore?: number;
  consistencyWarnings?: string[];
};

export type TranslationReview = {
  paragraphId: string;
  translation: string;
  analysis?: AgentAnalysis;
  suggestions?: string[];
};
