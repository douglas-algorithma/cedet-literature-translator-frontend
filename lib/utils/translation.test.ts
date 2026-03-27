import { describe, expect, it } from "vitest";

import { buildReview, parseAgentAnalysis, parseSuggestions } from "./translation";

describe("translation utils", () => {
  it("merge suggestions from review, agents and fallback", () => {
    const reviewPackage = {
      prioritized_issues: [{ description: "Issue review", suggestion: "Fix review" }],
    };
    const agentOutputs = {
      semantic: {
        llm_output: {
          content: JSON.stringify({
            issues: [{ suggested_correction: "Fix semantic" }],
          }),
        },
      },
      style_grammar: {
        llm_output: {
          content: JSON.stringify({
            grammar_issues: [{ correction: "Fix grammar" }],
          }),
        },
      },
      consistency: {
        llm_output: {
          content: JSON.stringify({
            inconsistencies: [{ recommendation: "Fix consistency" }],
          }),
        },
      },
      recommendations: ["Fallback recommendation"],
    };
    const enforcementReport = {
      applied_suggestions: [{ source: "enforcement", description: "Applied enforcement" }],
      skipped_suggestions: [
        { source: "enforcement", description: "Skipped enforcement", reason: "Conflict" },
      ],
      notes: "Enforcement note",
    };

    const suggestions = parseSuggestions({
      reviewPackage,
      agentOutputs,
      enforcementReport,
    });

    expect(suggestions).toContain("Issue review Sugestão: Fix review");
    expect(suggestions).toContain("Fix semantic");
    expect(suggestions).toContain("Fix grammar");
    expect(suggestions).toContain("Fix consistency");
    expect(suggestions).toContain("Fallback recommendation");
    expect(suggestions).not.toContain("enforcement: Applied enforcement");
    expect(suggestions).not.toContain("enforcement: Skipped enforcement Não aplicada: Conflict");
    expect(suggestions).not.toContain("Enforcement note");
  });

  it("parse enforcement metadata into agent analysis", () => {
    const analysis = parseAgentAnalysis({
      enforcementReport: {
        mode_used: "hard",
        applied_suggestions: [{ source: "glossary", description: "Aplicar termo A" }],
        skipped_suggestions: [{ source: "style", description: "Troca B", reason: "Conflito" }],
        glossary_coverage: { status: "partial", missing_terms: ["Termo C"] },
        notes: "Enforcement summary",
      },
    });

    expect(analysis?.enforcement?.modeUsed).toBe("hard");
    expect(analysis?.enforcement?.glossaryCoverageStatus).toBe("partial");
    expect(analysis?.enforcement?.missingGlossaryTerms).toContain("Termo C");
    expect(analysis?.enforcement?.appliedSuggestions).toContain("glossary: Aplicar termo A");
    expect(analysis?.enforcement?.skippedSuggestions).toContain(
      "style: Troca B Não aplicada: Conflito",
    );
  });

  it("parse agent output wrapped in markdown fenced block", () => {
    const fencedContent = '```json\n{"issues":[{"suggested_correction":"Fix fenced"}]}\n```';
    const analysis = parseAgentAnalysis({
      agentOutputs: {
        semantic: { llm_output: { content: fencedContent } },
      },
    });
    expect(analysis?.notes).toBeUndefined();
    const suggestions = parseSuggestions({
      agentOutputs: {
        semantic: { llm_output: { content: fencedContent } },
      },
    });
    expect(suggestions).toContain("Fix fenced");
  });

  it("parse agent output with leading text before JSON", () => {
    const messyContent = 'Here is my analysis:\n{"semantic_score":0.85,"overall_assessment":"Good"}';
    const analysis = parseAgentAnalysis({
      agentOutputs: {
        semantic: { llm_output: { content: messyContent } },
      },
    });
    expect(analysis?.semanticScore).toBe(85);
  });

  it("build review with explicit and parsed suggestions", () => {
    const review = buildReview({
      paragraphId: "p1",
      translation: "Texto",
      suggestions: ["Manual suggestion"],
      reviewPackage: {
        prioritized_issues: [{ description: "Issue review", suggestion: "Fix review" }],
      },
    });

    expect(review.suggestions).toContain("Manual suggestion");
    expect(review.suggestions).toContain("Issue review Sugestão: Fix review");
  });
});
