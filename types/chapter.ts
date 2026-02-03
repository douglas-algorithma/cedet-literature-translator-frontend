export type ChapterStatus = "pending" | "translating" | "review" | "translated";

export type Epigraph = {
  text: string;
  author: string;
};

export type Chapter = {
  id: string;
  bookId: string;
  number: number;
  title: string;
  status: ChapterStatus;
  totalParagraphs?: number;
  translatedParagraphs?: number;
  insertionMode: "paragraph" | "bulk";
  epigraph?: Epigraph;
  createdAt: string;
  updatedAt: string;
};

export type ChapterPayload = Omit<
  Chapter,
  "id" | "createdAt" | "updatedAt" | "totalParagraphs" | "translatedParagraphs"
> & {
  totalParagraphs?: number;
  translatedParagraphs?: number;
};

export type Paragraph = {
  id: string;
  chapterId: string;
  index: number;
  original: string;
  translation?: string;
  status: "pending" | "translated" | "approved";
};
