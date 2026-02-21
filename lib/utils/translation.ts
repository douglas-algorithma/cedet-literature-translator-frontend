import type { AgentAnalysis, TranslationReview } from "@/types/translation";

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as UnknownRecord;
};

const parseJsonRecord = (value: unknown): UnknownRecord | undefined => {
  const record = asRecord(value);
  if (record) return record;
  if (typeof value !== "string") return undefined;
  try {
    const parsed = JSON.parse(value);
    return asRecord(parsed);
  } catch {
    return undefined;
  }
};

const toRecordArray = (value: unknown): UnknownRecord[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => asRecord(item)).filter((item): item is UnknownRecord => Boolean(item));
};

const toDisplayString = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  const record = asRecord(value);
  if (!record) return "";
  const candidates = [
    record.description,
    record.suggestion,
    record.question,
    record.issue,
    record.summary,
    record.recommendation,
    record.segment,
    record.current,
    record.current_segment,
    record.target_term,
    record.source_term,
    record.text,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return "";
};

const toStringArray = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(toDisplayString).filter(Boolean);
  }
  if (typeof value === "string") return [value];
  if (typeof value === "number" || typeof value === "boolean") return [String(value)];
  return [];
};

const mergeStringArrays = (...values: string[][]) => uniqueStrings(values.flat());

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

const toPercentScore = (value: unknown): number | undefined => {
  const score = toNumber(value);
  if (score === undefined) return undefined;
  if (score >= 0 && score <= 1) return Math.round(score * 100);
  return Math.round(score);
};

const uniqueStrings = (values: string[]) => Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

const toSuggestionLine = (item: UnknownRecord) => {
  const source = toDisplayString(item.source);
  const description = toDisplayString(item.description);
  const reason = toDisplayString(item.reason);
  const prefix = source ? `${source}: ` : "";
  if (description && reason) return `${prefix}${description} Não aplicada: ${reason}`;
  if (description) return `${prefix}${description}`;
  if (reason) return `${prefix}${reason}`;
  return "";
};

const resolveAgentPayload = (
  agentOutputs: Record<string, unknown> | undefined,
  agentName: string,
): UnknownRecord | undefined => {
  if (!agentOutputs) return undefined;
  const node = asRecord(agentOutputs[agentName]);
  if (!node) return undefined;
  const llmOutput = asRecord(node.llm_output);
  const parsedFromContent = parseJsonRecord(llmOutput?.content);
  if (parsedFromContent) return parsedFromContent;
  const validatedOutput = asRecord(node.validated_output);
  if (validatedOutput) return validatedOutput;
  return asRecord(node.parsed_output);
};

const resolveReviewPackage = (
  reviewPackage: Record<string, unknown> | undefined,
  agentOutputs: Record<string, unknown> | undefined,
): UnknownRecord | undefined => {
  if (reviewPackage) return reviewPackage;
  const humanReview = resolveAgentPayload(agentOutputs, "human_review");
  const nestedPackage = asRecord(humanReview?.review_package);
  if (nestedPackage) return nestedPackage;
  return undefined;
};

const formatIssueText = (issue: UnknownRecord): string => {
  const description = toDisplayString(issue.description);
  const suggestion = toDisplayString(issue.suggestion);
  if (description && suggestion) return `${description} Sugestão: ${suggestion}`;
  return description || suggestion;
};

const collectGlossaryFromReview = (reviewPackage: UnknownRecord | undefined): string[] => {
  if (!reviewPackage) return [];
  const issues = toRecordArray(reviewPackage.prioritized_issues);
  const glossaryIssues = issues
    .filter((item) => String(item.source_agent ?? "").toLowerCase().includes("glossary"))
    .map(formatIssueText)
    .filter(Boolean);
  return uniqueStrings(glossaryIssues);
};

const collectGlossaryFromAgent = (glossaryPayload: UnknownRecord | undefined): string[] => {
  if (!glossaryPayload) return [];
  const glossaryMatches = toRecordArray(glossaryPayload.glossary_matches).map((item) => {
    const source = toDisplayString(item.source_term);
    const target = toDisplayString(item.target_term);
    if (!source || !target) return "";
    return `"${source}" -> "${target}"`;
  });
  const extractedTerms = toRecordArray(glossaryPayload.extracted_terms).map((item) => {
    const source = toDisplayString(item.source_term ?? item.term);
    if (!source) return "";
    return `Termo identificado: ${source}`;
  });
  const instructions = toStringArray(glossaryPayload.translation_instructions);
  return uniqueStrings([...glossaryMatches, ...extractedTerms, ...instructions]);
};

const collectConsistencyFromReview = (reviewPackage: UnknownRecord | undefined): string[] => {
  if (!reviewPackage) return [];
  const issues = toRecordArray(reviewPackage.prioritized_issues);
  const consistencyIssues = issues
    .filter((item) => String(item.source_agent ?? "").toLowerCase().includes("consistency"))
    .map(formatIssueText)
    .filter(Boolean);
  return uniqueStrings(consistencyIssues);
};

const collectConsistencyFromAgent = (consistencyPayload: UnknownRecord | undefined): string[] => {
  if (!consistencyPayload) return [];
  const inconsistencies = toRecordArray(consistencyPayload.inconsistencies).map((item) => {
    const segment = toDisplayString(item.current_segment);
    const recommendation = toDisplayString(item.recommendation);
    if (segment && recommendation) return `${segment}: ${recommendation}`;
    return segment || recommendation;
  });
  const summary = toStringArray(consistencyPayload.summary);
  return uniqueStrings([...inconsistencies, ...summary]);
};

const collectNotes = (
  reviewPackage: UnknownRecord | undefined,
  semanticPayload: UnknownRecord | undefined,
  stylePayload: UnknownRecord | undefined,
): string[] => {
  const contextNotes = toStringArray(reviewPackage?.context_notes);
  const semanticAssessment = toStringArray(semanticPayload?.overall_assessment);
  const semanticPositive = toStringArray(semanticPayload?.positive_observations);
  const styleSummary = toStringArray(stylePayload?.summary);
  return uniqueStrings([...contextNotes, ...semanticAssessment, ...semanticPositive, ...styleSummary]);
};

export const parseAgentAnalysis = ({
  reviewPackage,
  agentOutputs,
  enforcementReport,
}: {
  reviewPackage?: Record<string, unknown>;
  agentOutputs?: Record<string, unknown>;
  enforcementReport?: Record<string, unknown>;
}): AgentAnalysis | undefined => {
  if (!reviewPackage && !agentOutputs && !enforcementReport) return undefined;

  const resolvedReviewPackage = resolveReviewPackage(reviewPackage, agentOutputs);
  const glossaryPayload = resolveAgentPayload(agentOutputs, "glossary");
  const semanticPayload = resolveAgentPayload(agentOutputs, "semantic");
  const stylePayload = resolveAgentPayload(agentOutputs, "style_grammar");
  const consistencyPayload = resolveAgentPayload(agentOutputs, "consistency");
  const enforcementPayload = asRecord(enforcementReport) ?? resolveAgentPayload(agentOutputs, "suggestion_enforcement");

  const glossary = mergeStringArrays(
    collectGlossaryFromReview(resolvedReviewPackage),
    collectGlossaryFromAgent(glossaryPayload),
    toStringArray(agentOutputs?.glossary),
    toStringArray(agentOutputs?.glossary_terms),
    toStringArray(agentOutputs?.terms),
  );
  const consistencyWarnings = mergeStringArrays(
    collectConsistencyFromReview(resolvedReviewPackage),
    collectConsistencyFromAgent(consistencyPayload),
    toStringArray(agentOutputs?.consistency_warnings),
    toStringArray(agentOutputs?.consistency),
    toStringArray(agentOutputs?.warnings),
  );

  const reviewScores = asRecord(resolvedReviewPackage?.agent_scores);
  const semanticScore = toPercentScore(
    reviewScores?.semantic ?? semanticPayload?.semantic_score ?? agentOutputs?.semantic_score ?? agentOutputs?.semanticScore,
  );
  const styleScore = toPercentScore(
    reviewScores?.style ?? stylePayload?.style_score ?? agentOutputs?.style_score ?? agentOutputs?.styleScore,
  );

  const notes = collectNotes(resolvedReviewPackage, semanticPayload, stylePayload);
  const fallbackNotes = toStringArray(agentOutputs?.notes);
  const enforcementNotes = toStringArray(enforcementPayload?.notes);
  const appliedSuggestions = toRecordArray(enforcementPayload?.applied_suggestions)
    .map((item) => toSuggestionLine(item))
    .filter(Boolean);
  const skippedSuggestions = toRecordArray(enforcementPayload?.skipped_suggestions)
    .map((item) => toSuggestionLine(item))
    .filter(Boolean);
  const glossaryCoverage = asRecord(enforcementPayload?.glossary_coverage);
  const missingGlossaryTerms = toStringArray(glossaryCoverage?.missing_terms);
  const modeUsedRaw = toDisplayString(enforcementPayload?.mode_used);
  const modeUsed = modeUsedRaw === "hard" || modeUsedRaw === "soft" ? modeUsedRaw : undefined;
  const glossaryCoverageStatus = toDisplayString(glossaryCoverage?.status);

  return {
    glossary: glossary.length ? glossary : undefined,
    consistencyWarnings: consistencyWarnings.length ? consistencyWarnings : undefined,
    semanticScore,
    styleScore,
    notes: mergeStringArrays(notes, fallbackNotes, enforcementNotes).length
      ? mergeStringArrays(notes, fallbackNotes, enforcementNotes)
      : undefined,
    enforcement:
      modeUsed ||
      appliedSuggestions.length ||
      skippedSuggestions.length ||
      glossaryCoverageStatus ||
      missingGlossaryTerms.length
        ? {
            modeUsed,
            appliedSuggestions: appliedSuggestions.length ? appliedSuggestions : undefined,
            skippedSuggestions: skippedSuggestions.length ? skippedSuggestions : undefined,
            glossaryCoverageStatus: glossaryCoverageStatus || undefined,
            missingGlossaryTerms: missingGlossaryTerms.length ? missingGlossaryTerms : undefined,
          }
        : undefined,
  };
};

const collectSuggestionsFromReview = (reviewPackage: UnknownRecord | undefined): string[] => {
  if (!reviewPackage) return [];
  const prioritizedIssueSuggestions = toRecordArray(reviewPackage.prioritized_issues)
    .map(formatIssueText)
    .filter(Boolean);
  const decisionSuggestions = toRecordArray(reviewPackage.decisions_required).map((item) => {
    const question = toDisplayString(item.question);
    const impact = toDisplayString(item.impact);
    if (question && impact) return `${question} Impacto: ${impact}`;
    return question || impact;
  });
  const alternatives = toRecordArray(reviewPackage.alternatives).flatMap((item) => {
    const segment = toDisplayString(item.segment);
    return toRecordArray(item.options).map((option) => {
      const text = toDisplayString(option.text);
      if (!text) return "";
      if (!segment) return text;
      return `${segment}: ${text}`;
    });
  });
  return uniqueStrings([...prioritizedIssueSuggestions, ...decisionSuggestions, ...alternatives]);
};

const collectSuggestionsFromAgentOutputs = (
  semanticPayload: UnknownRecord | undefined,
  stylePayload: UnknownRecord | undefined,
  consistencyPayload: UnknownRecord | undefined,
): string[] => {
  const semanticSuggestions = toRecordArray(semanticPayload?.issues).map((item) =>
    toDisplayString(item.suggested_correction),
  );
  const styleSuggestions = [
    ...toRecordArray(stylePayload?.grammar_issues).map((item) => toDisplayString(item.correction)),
    ...toRecordArray(stylePayload?.style_issues).map((item) => toDisplayString(item.suggested)),
  ];
  const consistencySuggestions = toRecordArray(consistencyPayload?.inconsistencies).map((item) =>
    toDisplayString(item.recommendation),
  );
  return uniqueStrings([...semanticSuggestions, ...styleSuggestions, ...consistencySuggestions]);
};

const collectSuggestionsFromEnforcement = (
  enforcementPayload: UnknownRecord | undefined,
): string[] => {
  if (!enforcementPayload) return [];
  const applied = toRecordArray(enforcementPayload.applied_suggestions)
    .map((item) => toSuggestionLine(item))
    .filter(Boolean);
  const skipped = toRecordArray(enforcementPayload.skipped_suggestions)
    .map((item) => toSuggestionLine(item))
    .filter(Boolean);
  const notes = toStringArray(enforcementPayload.notes);
  return uniqueStrings([...applied, ...skipped, ...notes]);
};

export const parseSuggestions = ({
  reviewPackage,
  agentOutputs,
  enforcementReport,
}: {
  reviewPackage?: Record<string, unknown>;
  agentOutputs?: Record<string, unknown>;
  enforcementReport?: Record<string, unknown>;
}): string[] => {
  if (!reviewPackage && !agentOutputs && !enforcementReport) return [];
  const resolvedReviewPackage = resolveReviewPackage(reviewPackage, agentOutputs);
  const semanticPayload = resolveAgentPayload(agentOutputs, "semantic");
  const stylePayload = resolveAgentPayload(agentOutputs, "style_grammar");
  const consistencyPayload = resolveAgentPayload(agentOutputs, "consistency");
  const enforcementPayload = asRecord(enforcementReport) ?? resolveAgentPayload(agentOutputs, "suggestion_enforcement");
  return mergeStringArrays(
    collectSuggestionsFromReview(resolvedReviewPackage),
    collectSuggestionsFromAgentOutputs(semanticPayload, stylePayload, consistencyPayload),
    collectSuggestionsFromEnforcement(enforcementPayload),
    toStringArray(agentOutputs?.suggestions),
    toStringArray(agentOutputs?.recommendations),
    toStringArray(agentOutputs?.actions),
  );
};

export const buildReview = ({
  paragraphId,
  translation,
  reviewPackage,
  agentOutputs,
  enforcementReport,
  suggestions,
}: {
  paragraphId: string;
  translation: string;
  reviewPackage?: Record<string, unknown>;
  agentOutputs?: Record<string, unknown>;
  enforcementReport?: Record<string, unknown>;
  suggestions?: string[];
}): TranslationReview => ({
  paragraphId,
  translation,
  analysis: parseAgentAnalysis({ reviewPackage, agentOutputs, enforcementReport }),
  suggestions: mergeStringArrays(
    suggestions ?? [],
    parseSuggestions({ reviewPackage, agentOutputs, enforcementReport }),
  ),
});
