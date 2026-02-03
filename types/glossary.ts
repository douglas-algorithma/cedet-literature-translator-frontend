export type GlossaryTerm = {
  id: string;
  bookId?: string | null;
  sourceTerm: string;
  targetTerm: string;
  context: string;
  createdAt: string;
};

export type GlossarySuggestion = {
  term: string;
  suggestedTranslation: string;
  context?: string;
  paragraphId?: string;
};
