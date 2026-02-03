export type GlossaryTerm = {
  id: string;
  bookId?: string | null;
  sourceTerm: string;
  targetTerm: string;
  context: string;
  category?: string;
  caseSensitive?: boolean;
  wholeWord?: boolean;
  createdAt: string;
};

export type GlossarySuggestion = {
  term: string;
  suggestedTranslation: string;
  context?: string;
  paragraphId?: string;
};
