import type { AgentAnalysis, TranslationReview } from "@/types/translation";

const toStringArray = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }
  if (typeof value === "string") return [value];
  return [];
};

const firstNonEmpty = (...values: string[][]) => values.find((value) => value.length > 0) ?? [];

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

export const parseAgentAnalysis = (agentOutputs?: Record<string, unknown>): AgentAnalysis | undefined => {
  if (!agentOutputs) return undefined;

  const glossary = firstNonEmpty(
    toStringArray(agentOutputs.glossary),
    toStringArray(agentOutputs.glossary_terms),
    toStringArray(agentOutputs.terms),
  );
  const consistencyWarnings = firstNonEmpty(
    toStringArray(agentOutputs.consistency_warnings),
    toStringArray(agentOutputs.consistency),
    toStringArray(agentOutputs.warnings),
  );

  const semanticScore = toNumber(agentOutputs.semantic_score ?? agentOutputs.semanticScore);
  const styleScore = toNumber(agentOutputs.style_score ?? agentOutputs.styleScore);

  const notes = toStringArray(agentOutputs.notes);

  return {
    glossary: glossary.length ? glossary : undefined,
    consistencyWarnings: consistencyWarnings.length ? consistencyWarnings : undefined,
    semanticScore,
    styleScore,
    notes: notes.length ? notes : undefined,
  };
};

export const parseSuggestions = (agentOutputs?: Record<string, unknown>): string[] => {
  if (!agentOutputs) return [];
  return firstNonEmpty(
    toStringArray(agentOutputs.suggestions),
    toStringArray(agentOutputs.recommendations),
    toStringArray(agentOutputs.actions),
  );
};

export const buildReview = ({
  paragraphId,
  translation,
  agentOutputs,
}: {
  paragraphId: string;
  translation: string;
  agentOutputs?: Record<string, unknown>;
}): TranslationReview => ({
  paragraphId,
  translation,
  analysis: parseAgentAnalysis(agentOutputs),
  suggestions: parseSuggestions(agentOutputs),
});
