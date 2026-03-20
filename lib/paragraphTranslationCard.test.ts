import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ParagraphTranslationCard } from "@/components/translation/ParagraphTranslationCard";

describe("ParagraphTranslationCard", () => {
  it("shows partial glossary status in soft mode", () => {
    const html = renderToStaticMarkup(
      createElement(ParagraphTranslationCard, {
        index: 1,
        translation: "Texto traduzido",
        status: "review",
        glossaryStatus: {
          total: 2,
          applied: 1,
          missing: 1,
          missingTerms: ["Termo X"],
          modeUsed: "soft",
        },
      }),
    );

    expect(html).toContain("Glossário");
    expect(html).toContain("parcial");
    expect(html).toContain("Pode faltar: Termo X");
  });
});
