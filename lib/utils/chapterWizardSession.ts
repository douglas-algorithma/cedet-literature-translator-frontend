type ChapterWizardMode = "paragraph" | "bulk";

type ParagraphDraft = {
  id: string;
  text: string;
  blockType?: "paragraph" | "bullet";
};

type ChapterMetaDraft = {
  number: number;
  title: string;
  epigraphText: string;
  epigraphAuthor: string;
};

export type ChapterWizardSession = {
  version: 1;
  step: number;
  mode: ChapterWizardMode | null;
  modeLocked: boolean;
  chapterId: string | null;
  createdMode: ChapterWizardMode | null;
  meta: ChapterMetaDraft;
  paragraphs: ParagraphDraft[];
  bulkText: string;
  bulkParagraphs: ParagraphDraft[];
};

const STORAGE_PREFIX = "chapter-wizard";

const isMode = (value: unknown): value is ChapterWizardMode =>
  value === "paragraph" || value === "bulk";

const toStringValue = (value: unknown) => (typeof value === "string" ? value : "");

const toNumberValue = (value: unknown, fallback = 1) => {
  if (typeof value === "number" && Number.isFinite(value) && value >= 1) {
    return Math.floor(value);
  }
  return fallback;
};

const toParagraphs = (value: unknown): ParagraphDraft[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.reduce<ParagraphDraft[]>((acc, item) => {
    if (!item || typeof item !== "object") {
      return acc;
    }
    const draft = item as Record<string, unknown>;
    const id = toStringValue(draft.id);
    if (!id) {
      return acc;
    }
    const text = toStringValue(draft.text);
    const blockType = draft.blockType === "bullet" ? "bullet" : "paragraph";
    acc.push({ id, text, blockType });
    return acc;
  }, []);
};

const getStorageKey = (bookId: string) => `${STORAGE_PREFIX}:${bookId}`;

const normalizeSession = (data: unknown): ChapterWizardSession | null => {
  if (!data || typeof data !== "object") {
    return null;
  }

  const raw = data as Record<string, unknown>;
  const mode = isMode(raw.mode) ? raw.mode : null;
  const createdMode = isMode(raw.createdMode) ? raw.createdMode : null;
  const chapterId = toStringValue(raw.chapterId) || null;
  const rawStep = Number.isInteger(raw.step) ? Number(raw.step) : 0;
  const normalizedStep = Math.min(Math.max(rawStep, 0), 2);
  const modeLocked = Boolean(raw.modeLocked);
  const paragraphs = toParagraphs(raw.paragraphs);
  const bulkParagraphs = toParagraphs(raw.bulkParagraphs);

  const rawMeta = raw.meta && typeof raw.meta === "object" ? (raw.meta as Record<string, unknown>) : {};
  const meta: ChapterMetaDraft = {
    number: toNumberValue(rawMeta.number, 1),
    title: toStringValue(rawMeta.title),
    epigraphText: toStringValue(rawMeta.epigraphText),
    epigraphAuthor: toStringValue(rawMeta.epigraphAuthor),
  };

  return {
    version: 1,
    step: normalizedStep,
    mode,
    modeLocked,
    chapterId,
    createdMode,
    meta,
    paragraphs,
    bulkText: toStringValue(raw.bulkText),
    bulkParagraphs,
  };
};

export const loadChapterWizardSession = (bookId: string): ChapterWizardSession | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(getStorageKey(bookId));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as unknown;
    return normalizeSession(parsed);
  } catch {
    return null;
  }
};

export const saveChapterWizardSession = (bookId: string, payload: ChapterWizardSession): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(getStorageKey(bookId), JSON.stringify(payload));
};

export const clearChapterWizardSession = (bookId: string): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(getStorageKey(bookId));
};
