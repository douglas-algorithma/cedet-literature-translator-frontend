import type { Chapter } from "@/types/chapter";

export const getChapterProgress = (chapter: Pick<Chapter, "translatedParagraphs" | "totalParagraphs">) => {
  if (!chapter.totalParagraphs) return 0;
  return Math.round((chapter.translatedParagraphs / chapter.totalParagraphs) * 100);
};

export const isChapterTranslated = (
  chapter: Pick<Chapter, "status" | "translatedParagraphs" | "totalParagraphs">,
) => {
  const totalParagraphs = chapter.totalParagraphs ?? 0;
  const translatedParagraphs = chapter.translatedParagraphs ?? 0;
  if (totalParagraphs > 0) {
    return translatedParagraphs >= totalParagraphs;
  }
  return chapter.status === "translated";
};

export const segmentText = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

export const serializeEpigraph = (text?: string, author?: string) => {
  if (!text || text.trim().length === 0) return undefined;
  const trimmedText = text.trim();
  if (author && author.trim().length > 0) {
    return `${trimmedText}\n— ${author.trim()}`;
  }
  return trimmedText;
};

export const parseEpigraph = (value?: string | null) => {
  if (!value) return undefined;
  const parts = value.split("\n— ");
  if (parts.length > 1) {
    return { text: parts.slice(0, -1).join("\n— "), author: parts[parts.length - 1] };
  }
  return { text: value, author: "" };
};
