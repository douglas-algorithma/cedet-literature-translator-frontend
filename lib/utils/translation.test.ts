import { describe, expect, it } from "vitest";

import { buildReview, parseAgentAnalysis, parseSuggestions } from "./translation";

describe("translation utils", () => {
  it("merge suggestions from review, agents, fallback and enforcement", () => {
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
    expect(suggestions).toContain("enforcement: Applied enforcement");
    expect(suggestions).toContain("enforcement: Skipped enforcement Não aplicada: Conflict");
    expect(suggestions).toContain("Enforcement note");
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
