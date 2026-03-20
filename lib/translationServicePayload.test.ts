import { describe, expect, it } from "vitest";

import { buildRequestPayload } from "@/services/translationService";

describe("translationService payload", () => {
  it("includes current translation and enforcement mode", () => {
    const payload = buildRequestPayload({
      bookId: "book-1",
      chapterId: "chapter-1",
      paragraphId: "paragraph-1",
      chapterNumber: 2,
      paragraphSequence: 4,
      sourceLanguage: "en",
      targetLanguage: "pt-BR",
      originalText: "Original text.",
      currentTranslation: "Texto editado",
      enforcementMode: "hard",
      feedbackItems: [{ issue: "Ajustar tom" }],
    });

    expect(payload.current_translation).toBe("Texto editado");
    expect(payload.enforcement_mode).toBe("hard");
    expect(payload.feedback_items).toEqual([
      expect.objectContaining({
        type: "CUSTOM",
        issue: "Ajustar tom",
      }),
    ]);
  });
});
