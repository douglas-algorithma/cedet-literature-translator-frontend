import type { Chapter, ChapterPayload, Paragraph } from "@/types/chapter";

import { apiClient } from "@/lib/api";
import { parseEpigraph, segmentText, serializeEpigraph } from "@/lib/utils";

type ChapterApi = {
  id: string;
  book_id: string;
  title: string;
  order: number;
  status: string;
  epigraph?: string | null;
  insertion_mode: string;
  created_at: string;
};

type ParagraphApi = {
  id: string;
  chapter_id: string;
  order: number;
  original_text: string;
  translated_text?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

const handleResponse = <T>(response: { success: boolean; data?: T; error?: { message: string } }) => {
  if (!response.success) {
    throw new Error(response.error?.message ?? "Erro inesperado");
  }
  return response.data as T;
};

const mapChapter = (chapter: ChapterApi): Chapter => ({
  id: chapter.id,
  bookId: chapter.book_id,
  number: chapter.order,
  title: chapter.title,
  status: chapter.status as Chapter["status"],
  insertionMode: chapter.insertion_mode as Chapter["insertionMode"],
  epigraph: parseEpigraph(chapter.epigraph),
  createdAt: chapter.created_at,
  updatedAt: chapter.created_at,
  totalParagraphs: 0,
  translatedParagraphs: 0,
});

const mapParagraph = (paragraph: ParagraphApi): Paragraph => ({
  id: paragraph.id,
  chapterId: paragraph.chapter_id,
  index: paragraph.order,
  original: paragraph.original_text,
  translation: paragraph.translated_text ?? undefined,
  status: paragraph.status as Paragraph["status"],
});

const toChapterCreatePayload = (payload: ChapterPayload) => ({
  title: payload.title,
  order: payload.number,
  epigraph: serializeEpigraph(payload.epigraph?.text, payload.epigraph?.author),
  insertion_mode: payload.insertionMode,
});

const toChapterUpdatePayload = (payload: Partial<ChapterPayload>) => ({
  title: payload.title,
  order: payload.number,
  epigraph: serializeEpigraph(payload.epigraph?.text, payload.epigraph?.author),
  status: payload.status,
});

export const chaptersService = {
  list: async (bookId: string) => {
    const data = handleResponse<ChapterApi[]>(
      await apiClient.get(`/chapters/books/${encodeURIComponent(bookId)}`),
    );
    return data.map(mapChapter).sort((a, b) => a.number - b.number);
  },
  get: async (chapterId: string) => {
    const data = handleResponse<ChapterApi>(
      await apiClient.get(`/chapters/${encodeURIComponent(chapterId)}`),
    );
    return mapChapter(data);
  },
  listWithStats: async (bookId: string) => {
    const chapters = await chaptersService.list(bookId);
    const withStats = await Promise.all(
      chapters.map(async (chapter) => {
        try {
          const paragraphs = await chaptersService.listParagraphs(chapter.id);
          const totalParagraphs = paragraphs.length;
          const translatedParagraphs = paragraphs.filter((paragraph) =>
            ["translated", "approved"].includes(paragraph.status),
          ).length;
          return { ...chapter, totalParagraphs, translatedParagraphs };
        } catch {
          return { ...chapter, totalParagraphs: 0, translatedParagraphs: 0 };
        }
      }),
    );
    return withStats;
  },
  create: async (bookId: string, payload: ChapterPayload) => {
    const data = handleResponse<ChapterApi>(
      await apiClient.post(
        `/chapters/books/${encodeURIComponent(bookId)}`,
        toChapterCreatePayload(payload),
      ),
    );
    return mapChapter(data);
  },
  update: async (chapterId: string, payload: Partial<ChapterPayload>) => {
    const data = handleResponse<ChapterApi>(
      await apiClient.put(
        `/chapters/${encodeURIComponent(chapterId)}`,
        toChapterUpdatePayload(payload),
      ),
    );
    return mapChapter(data);
  },
  delete: async (chapterId: string) =>
    handleResponse<void>(await apiClient.delete(`/chapters/${encodeURIComponent(chapterId)}`)),
  reorder: async (_bookId: string, order: Chapter[]) => {
    await Promise.all(
      order.map((chapter, index) =>
        chaptersService.update(chapter.id, { number: index + 1 } as ChapterPayload),
      ),
    );
  },
  listParagraphs: async (chapterId: string) => {
    const data = handleResponse<ParagraphApi[]>(
      await apiClient.get(`/paragraphs/chapters/${encodeURIComponent(chapterId)}`),
    );
    return data.map(mapParagraph).sort((a, b) => a.index - b.index);
  },
  updateParagraph: async (
    paragraphId: string,
    payload: { translatedText?: string; status?: Paragraph["status"]; originalText?: string },
  ) => {
    const data = handleResponse<ParagraphApi>(
      await apiClient.put(`/paragraphs/${encodeURIComponent(paragraphId)}`, {
        translated_text: payload.translatedText,
        status: payload.status,
        original_text: payload.originalText,
      }),
    );
    return mapParagraph(data);
  },
  addParagraph: async (chapterId: string, text: string, order: number) => {
    const data = handleResponse<ParagraphApi>(
      await apiClient.post(`/paragraphs/chapters/${encodeURIComponent(chapterId)}`, {
        order,
        original_text: text,
      }),
    );
    return mapParagraph(data);
  },
  bulkInsert: async (chapterId: string, text: string) => {
    const paragraphs = segmentText(text);
    for (let i = 0; i < paragraphs.length; i += 1) {
      await chaptersService.addParagraph(chapterId, paragraphs[i], i + 1);
    }
  },
};
