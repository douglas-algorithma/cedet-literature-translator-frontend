"use client";

import { buildHighlightChunks, type GlossaryMatch } from "@/lib/utils/glossary";
import type { GlossaryTerm } from "@/types/glossary";

type GlossaryHighlightTextProps = {
  text: string;
  terms: GlossaryTerm[];
};

export function GlossaryHighlightText({ text, terms }: GlossaryHighlightTextProps) {
  const chunks = buildHighlightChunks(text, terms);

  return (
    <span>
      {chunks.map((chunk, index) => {
        if (!chunk.match) {
          return <span key={`text-${index}`}>{chunk.text}</span>;
        }
        const match = chunk.match as GlossaryMatch;
        return (
          <span
            key={`match-${index}-${match.term.id}`}
            className="rounded-md bg-brand-soft px-1 underline decoration-brand/70 underline-offset-2"
            title={`${match.term.sourceTerm} → ${match.term.targetTerm}`}
          >
            {chunk.text}
          </span>
        );
      })}
    </span>
  );
}
