"use client";

import { use, useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Checkbox } from "@/components/common/Checkbox";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { PAGE_TITLES } from "@/config/app";
import { booksService } from "@/services/booksService";
import { chaptersService } from "@/services/chaptersService";
import type { Chapter, Paragraph as ChapterParagraph } from "@/types/chapter";

type ExportFormat = "docx" | "txt";

type ExportOptions = {
  includeMetadata: boolean;
  includeEpigraphs: boolean;
  bilingual: boolean;
  includeNotes: boolean;
};

type ExportBookMetadata = {
  title: string;
  author?: string | null;
  sourceLanguage: string;
  targetLanguage: string;
};

type NormalizedParagraph = {
  original: string;
  content: string;
};

const FORMAT_CARDS: { value: ExportFormat; label: string; description: string }[] = [
  { value: "docx", label: "DOCX", description: "Formato editável, ideal para revisão final." },
  { value: "txt", label: "TXT", description: "Arquivo leve, compatível com qualquer editor." },
];

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Returns a local timestamp used in exported metadata.
 *
 * Returns:
 *   A formatted timestamp in pt-BR locale.
 */
const getCurrentExportTimestamp = () =>
  new Date().toLocaleString("pt-BR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * Normalizes paragraph text for cleaner exports.
 *
 * Args:
 *   value: Raw text from source or translation.
 *
 * Returns:
 *   A single-line text with normalized spacing.
 */
const normalizeParagraphText = (value: string) =>
  value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join(" ")
    .trim();

/**
 * Creates a normalized paragraph model for text and DOCX rendering.
 *
 * Args:
 *   paragraph: Paragraph entity from chapter export list.
 *
 * Returns:
 *   A normalized paragraph or null when content is empty.
 */
const normalizeParagraph = (paragraph: ChapterParagraph): NormalizedParagraph | null => {
  const original = normalizeParagraphText(paragraph.original ?? "");
  const translation = normalizeParagraphText(paragraph.translation ?? "");
  const content = translation || original;

  if (!content) {
    return null;
  }

  return {
    original,
    content,
  };
};

/**
 * Builds a metadata block for text-based exports.
 *
 * Args:
 *   book: Book metadata needed for export header.
 *   includeMetadata: Whether metadata should be included.
 *   includeTimestamp: Whether export timestamp should be included.
 *
 * Returns:
 *   Metadata text block or empty string.
 */
const buildMetadataBlock = (
  book: ExportBookMetadata,
  includeMetadata: boolean,
  includeTimestamp: boolean,
) => {
  if (!includeMetadata) {
    return "";
  }

  const lines = [
    `Título: ${book.title}`,
    `Autor: ${book.author ?? "—"}`,
    `Idiomas: ${book.sourceLanguage} → ${book.targetLanguage}`,
  ];

  if (includeTimestamp) {
    lines.push(`Exportado em: ${getCurrentExportTimestamp()}`);
  }

  return lines.join("\n");
};

/**
 * Builds one text block for a chapter paragraph.
 *
 * Args:
 *   paragraph: Paragraph entity from chapter.
 *   bilingual: Whether bilingual export is enabled.
 *
 * Returns:
 *   Formatted text block for the paragraph.
 */
const buildParagraphTextBlock = (paragraph: ChapterParagraph, bilingual: boolean) => {
  const normalizedParagraph = normalizeParagraph(paragraph);

  if (!normalizedParagraph) {
    return "";
  }

  if (!bilingual) {
    return normalizedParagraph.content;
  }

  const lines: string[] = [];

  if (normalizedParagraph.original) {
    lines.push(`Original: ${normalizedParagraph.original}`);
  }

  lines.push(`Tradução: ${normalizedParagraph.content}`);
  return lines.join("\n");
};

const buildChapterText = ({
  chapter,
  paragraphs,
  options,
}: {
  chapter: Chapter;
  paragraphs: ChapterParagraph[];
  options: ExportOptions;
}) => {
  const blocks: string[] = [`Capítulo ${chapter.number}: ${chapter.title}`];

  if (options.includeEpigraphs && chapter.epigraph?.text) {
    const epigraphLines = [`"${normalizeParagraphText(chapter.epigraph.text)}"`];

    if (chapter.epigraph.author) {
      epigraphLines.push(`— ${normalizeParagraphText(chapter.epigraph.author)}`);
    }

    blocks.push(epigraphLines.join("\n"));
  }

  const paragraphBlocks = paragraphs
    .map((paragraph) => buildParagraphTextBlock(paragraph, options.bilingual))
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  blocks.push(...paragraphBlocks);

  if (options.includeNotes) {
    blocks.push("Notas do tradutor:");
  }

  return blocks.join("\n\n");
};

/**
 * Builds plain text file content for the entire book.
 *
 * Args:
 *   book: Book metadata.
 *   chapters: Ordered list of chapters.
 *   paragraphLists: Paragraphs per chapter in the same order.
 *   options: Export options selected by user.
 *
 * Returns:
 *   Complete plain text content.
 */
const buildTextDocument = ({
  book,
  chapters,
  paragraphLists,
  options,
}: {
  book: ExportBookMetadata;
  chapters: Chapter[];
  paragraphLists: ChapterParagraph[][];
  options: ExportOptions;
}) => {
  const sections: string[] = [];
  const metadata = buildMetadataBlock(book, options.includeMetadata, true);

  if (metadata) {
    sections.push(metadata);
  }

  const chapterSections = chapters.map((chapter, index) =>
    buildChapterText({
      chapter,
      paragraphs: paragraphLists[index],
      options,
    }),
  );

  sections.push(...chapterSections);
  return sections.join("\n\n\n");
};

/**
 * Builds export filename with date suffix.
 *
 * Args:
 *   title: Book title.
 *   format: Selected output format.
 *
 * Returns:
 *   Export filename ready for download.
 */
const buildExportFilename = (title: string, format: ExportFormat) => {
  const dateSuffix = new Date().toISOString().slice(0, 10);
  return `${slugify(title)}-${dateSuffix}.${format}`;
};

export default function ExportPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = use(params);
  const [format, setFormat] = useState<ExportFormat>("docx");
  const [options, setOptions] = useState<ExportOptions>({
    includeMetadata: true,
    includeEpigraphs: true,
    bilingual: false,
    includeNotes: false,
  });
  const [isExporting, setIsExporting] = useState(false);

  const { data: book } = useQuery({
    queryKey: ["book", bookId],
    queryFn: () => booksService.get(bookId),
  });

  const { data: chapters = [], isLoading } = useQuery({
    queryKey: ["chapters", bookId, "export"],
    queryFn: () => chaptersService.listWithStats(bookId),
  });

  const pendingChapters = useMemo(
    () =>
      chapters.filter(
        (chapter) =>
          chapter.totalParagraphs && chapter.totalParagraphs > 0
            ? chapter.translatedParagraphs !== chapter.totalParagraphs
            : true,
      ),
    [chapters],
  );

  const firstChapterId = chapters[0]?.id;

  const { data: previewParagraphs = [] } = useQuery({
    queryKey: ["export-preview", firstChapterId],
    queryFn: () => (firstChapterId ? chaptersService.listParagraphs(firstChapterId) : Promise.resolve([])),
    enabled: Boolean(firstChapterId),
  });

  const previewContent = useMemo(() => {
    if (!book || !chapters.length) return "";
    const chapter = chapters[0];
    const limitedParagraphs = previewParagraphs.slice(0, 2);
    const metadata = buildMetadataBlock(book, options.includeMetadata, false);
    const sections = [metadata, buildChapterText({ chapter, paragraphs: limitedParagraphs, options })].filter(Boolean);
    return sections.join("\n\n");
  }, [book, chapters, options, previewParagraphs]);

  const handleExport = async () => {
    if (!book) return;
    if (pendingChapters.length > 0) {
      toast.error("Finalize todos os capítulos antes de exportar.");
      return;
    }
    setIsExporting(true);
    try {
      const orderedChapters = [...chapters].sort((a, b) => a.number - b.number);
      const paragraphLists = await Promise.all(
        orderedChapters.map((chapter) => chaptersService.listParagraphs(chapter.id)),
      );

      if (format === "txt") {
        const content = buildTextDocument({
          book,
          chapters: orderedChapters,
          paragraphLists,
          options,
        });
        const blob = new Blob([content], {
          type: "text/plain;charset=utf-8",
        });
        downloadBlob(blob, buildExportFilename(book.title, "txt"));
        toast.success("Exportação concluída");
        return;
      }

      const { AlignmentType, Document, Packer, Paragraph, TextRun } = await import("docx");

      const createMetadataParagraph = (text: string, bold = false) =>
        new Paragraph({
          children: [new TextRun({ text, bold })],
          spacing: { after: 120 },
        });

      const createChapterTitleParagraph = (text: string, pageBreakBefore = false) =>
        new Paragraph({
          pageBreakBefore,
          children: [new TextRun({ text, bold: true })],
          spacing: { before: 160, after: 220 },
        });

      const createBodyParagraph = (text: string) =>
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { firstLine: 420 },
          spacing: { after: 220 },
          children: [new TextRun({ text })],
        });

      const createBilingualBodyParagraph = (label: string, text: string) =>
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { firstLine: 420 },
          spacing: { after: 180 },
          children: [new TextRun({ text: `${label}: `, bold: true }), new TextRun({ text })],
        });

      const docParagraphs: InstanceType<typeof Paragraph>[] = [];

      if (options.includeMetadata) {
        docParagraphs.push(
          createMetadataParagraph(`Título: ${book.title}`, true),
          createMetadataParagraph(`Autor: ${book.author ?? "—"}`),
          createMetadataParagraph(`Idiomas: ${book.sourceLanguage} → ${book.targetLanguage}`),
          createMetadataParagraph(`Exportado em: ${getCurrentExportTimestamp()}`),
          new Paragraph({ text: "", spacing: { after: 200 } }),
        );
      }

      orderedChapters.forEach((chapter, index) => {
        docParagraphs.push(
          createChapterTitleParagraph(`Capítulo ${chapter.number}: ${chapter.title}`, index > 0),
        );

        if (options.includeEpigraphs && chapter.epigraph?.text) {
          docParagraphs.push(
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: `"${normalizeParagraphText(chapter.epigraph.text)}"`, italics: true })],
              spacing: { after: 80 },
            }),
          );

          if (chapter.epigraph.author) {
            docParagraphs.push(
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                text: `— ${normalizeParagraphText(chapter.epigraph.author)}`,
                spacing: { after: 220 },
              }),
            );
          }
        }

        paragraphLists[index].forEach((paragraph) => {
          const normalizedParagraph = normalizeParagraph(paragraph);

          if (!normalizedParagraph) {
            return;
          }

          if (options.bilingual) {
            if (normalizedParagraph.original) {
              docParagraphs.push(createBilingualBodyParagraph("Original", normalizedParagraph.original));
            }

            docParagraphs.push(createBilingualBodyParagraph("Tradução", normalizedParagraph.content));
          } else {
            docParagraphs.push(createBodyParagraph(normalizedParagraph.content));
          }
        });

        if (options.includeNotes) {
          docParagraphs.push(
            new Paragraph({
              children: [new TextRun({ text: "Notas do tradutor:", bold: true })],
              spacing: { before: 160, after: 120 },
            }),
            new Paragraph({ text: "", spacing: { after: 120 } }),
          );
        }
      });

      const doc = new Document({ sections: [{ properties: {}, children: docParagraphs }] });
      const blob = await Packer.toBlob(doc);
      downloadBlob(blob, buildExportFilename(book.title, "docx"));
      toast.success("Exportação concluída");
    } catch (err) {
      toast.error((err as Error).message ?? "Não foi possível exportar o arquivo");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={PAGE_TITLES.export}
        description="Configure o formato final e gere o arquivo da tradução."
        action={
          <Button onClick={handleExport} loading={isExporting} disabled={pendingChapters.length > 0 || isLoading}>
            Exportar
          </Button>
        }
      />

      {pendingChapters.length > 0 ? (
        <EmptyState
          title="Exportação bloqueada"
          description="Finalize todos os capítulos para habilitar a exportação."
          action={
            <div className="rounded-2xl border border-border bg-surface-muted p-4 text-sm text-text-muted">
              <p className="font-semibold text-text">Capítulos pendentes</p>
              <ul className="mt-2 space-y-1">
                {pendingChapters.map((chapter) => (
                  <li key={chapter.id}>
                    Capítulo {chapter.number}: {chapter.title}
                  </li>
                ))}
              </ul>
            </div>
          }
        />
      ) : null}

      <Card className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-2">
          {FORMAT_CARDS.map((card) => (
            <button
              key={card.value}
              type="button"
              onClick={() => setFormat(card.value)}
              className={`flex w-full flex-col rounded-2xl border px-4 py-3 text-left text-sm transition ${
                format === card.value
                  ? "border-brand bg-brand-soft text-text"
                  : "border-border bg-surface text-text-muted hover:border-brand/40"
              }`}
            >
              <span className="font-semibold text-text">{card.label}</span>
              <span className="mt-1 text-xs text-text-muted">{card.description}</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Checkbox
            checked={options.includeMetadata}
            onChange={(checked) => setOptions((state) => ({ ...state, includeMetadata: checked }))}
            label="Incluir metadados"
          />
          <Checkbox
            checked={options.includeEpigraphs}
            onChange={(checked) => setOptions((state) => ({ ...state, includeEpigraphs: checked }))}
            label="Incluir epígrafes"
          />
          <Checkbox
            checked={options.bilingual}
            onChange={(checked) => setOptions((state) => ({ ...state, bilingual: checked }))}
            label="Modo bilíngue"
          />
          <Checkbox
            checked={options.includeNotes}
            onChange={(checked) => setOptions((state) => ({ ...state, includeNotes: checked }))}
            label="Incluir notas do tradutor"
          />
        </div>
      </Card>

      <Card>
        <p className="text-sm text-text-muted">Pré-visualização</p>
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface-muted p-6 text-sm text-text-muted whitespace-pre-wrap">
          {previewContent || "Pré-visualização indisponível."}
        </div>
      </Card>
    </div>
  );
}
