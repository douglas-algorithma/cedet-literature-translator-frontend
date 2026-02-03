import type { GlossaryTerm } from "@/types/glossary";

type GlossaryContextPayload = {
  notes?: string;
  category?: string;
  caseSensitive?: boolean;
  wholeWord?: boolean;
};

export const parseGlossaryContext = (context: string): GlossaryContextPayload & { notes: string } => {
  const trimmed = context.trim();
  if (!trimmed) {
    return { notes: "" };
  }
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as GlossaryContextPayload;
      return {
        notes: parsed.notes ?? "",
        category: parsed.category,
        caseSensitive: parsed.caseSensitive,
        wholeWord: parsed.wholeWord,
      };
    } catch {
      return { notes: context };
    }
  }
  return { notes: context };
};

export const serializeGlossaryContext = (payload: GlossaryContextPayload & { notes: string }) => {
  const hasMetadata =
    payload.category || payload.caseSensitive !== undefined || payload.wholeWord !== undefined;
  if (!hasMetadata) return payload.notes;
  return JSON.stringify({
    notes: payload.notes,
    category: payload.category,
    caseSensitive: payload.caseSensitive ?? false,
    wholeWord: payload.wholeWord ?? false,
  });
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildTermRegex = (term: GlossaryTerm, field: "source" | "target") => {
  const raw = field === "source" ? term.sourceTerm : term.targetTerm;
  const escaped = escapeRegExp(raw);
  const body = term.wholeWord ? `\\b${escaped}\\b` : escaped;
  const flags = term.caseSensitive ? "g" : "gi";
  return new RegExp(body, flags);
};

export type GlossaryMatch = {
  term: GlossaryTerm;
  start: number;
  end: number;
  text: string;
};

export const findGlossaryMatches = (text: string, terms: GlossaryTerm[]) => {
  const matches: GlossaryMatch[] = [];
  terms.forEach((term) => {
    if (!term.sourceTerm) return;
    const regex = buildTermRegex(term, "source");
    let match = regex.exec(text);
    while (match) {
      matches.push({
        term,
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
      });
      match = regex.exec(text);
    }
  });
  return matches.sort((a, b) => a.start - b.start);
};

export const buildHighlightChunks = (text: string, terms: GlossaryTerm[]) => {
  const matches = findGlossaryMatches(text, terms);
  if (!matches.length) {
    return [{ text, match: null }];
  }
  const chunks: { text: string; match: GlossaryMatch | null }[] = [];
  let cursor = 0;
  matches.forEach((match) => {
    if (match.start < cursor) return;
    if (match.start > cursor) {
      chunks.push({ text: text.slice(cursor, match.start), match: null });
    }
    chunks.push({ text: text.slice(match.start, match.end), match });
    cursor = match.end;
  });
  if (cursor < text.length) {
    chunks.push({ text: text.slice(cursor), match: null });
  }
  return chunks;
};

export const getGlossaryCoverage = (
  originalText: string,
  translatedText: string | undefined,
  terms: GlossaryTerm[],
) => {
  const matches = findGlossaryMatches(originalText, terms);
  const uniqueTerms = Array.from(new Map(matches.map((match) => [match.term.id, match.term])).values());
  if (!translatedText) {
    return {
      total: uniqueTerms.length,
      applied: 0,
      missing: uniqueTerms.length,
      matchedTerms: uniqueTerms,
      missingTerms: uniqueTerms,
    };
  }

  const missingTerms: GlossaryTerm[] = [];
  uniqueTerms.forEach((term) => {
    const regex = buildTermRegex(term, "target");
    if (!regex.test(translatedText)) {
      missingTerms.push(term);
    }
  });

  return {
    total: uniqueTerms.length,
    applied: uniqueTerms.length - missingTerms.length,
    missing: missingTerms.length,
    matchedTerms: uniqueTerms,
    missingTerms,
  };
};
