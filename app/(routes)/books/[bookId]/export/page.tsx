"use client";

import { useMemo, useState } from "react";

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
import type { Chapter, Paragraph } from "@/types/chapter";

type ExportFormat = "docx" | "txt" | "md";

type ExportOptions = {
  includeMetadata: boolean;
  includeEpigraphs: boolean;
  bilingual: boolean;
  includeNotes: boolean;
};

const FORMAT_CARDS: { value: ExportFormat; label: string; description: string }[] = [
  { value: "docx", label: "DOCX", description: "Formato editável, ideal para revisão final." },
  { value: "txt", label: "TXT", description: "Arquivo leve, compatível com qualquer editor." },
  { value: "md", label: "Markdown", description: "Formato estruturado para web e publicação." },
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

const buildChapterText = ({
  chapter,
  paragraphs,
  options,
}: {
  chapter: Chapter;
  paragraphs: Paragraph[];
  options: ExportOptions;
}) => {
  const lines: string[] = [];
  lines.push(`Capítulo ${chapter.number}: ${chapter.title}`);
  lines.push("");
  if (options.includeEpigraphs && chapter.epigraph?.text) {
    lines.push(`"${chapter.epigraph.text}"`);
    if (chapter.epigraph.author) {
      lines.push(`— ${chapter.epigraph.author}`);
    }
    lines.push("");
  }
  paragraphs.forEach((paragraph) => {
    const translation = paragraph.translation ?? "";
    const original = paragraph.original ?? "";
    if (options.bilingual) {
      lines.push(original);
      lines.push(translation || "");
    } else {
      lines.push(translation || original);
    }
    lines.push("");
  });
  if (options.includeNotes) {
    lines.push("Notas do tradutor:");
    lines.push("—");
    lines.push("");
  }
  return lines.join("\n");
};

const buildChapterMarkdown = ({
  chapter,
  paragraphs,
  options,
}: {
  chapter: Chapter;
  paragraphs: Paragraph[];
  options: ExportOptions;
}) => {
  const lines: string[] = [];
  lines.push(`## Capítulo ${chapter.number}: ${chapter.title}`);
  lines.push("");
  if (options.includeEpigraphs && chapter.epigraph?.text) {
    lines.push(`> ${chapter.epigraph.text}`);
    if (chapter.epigraph.author) {
      lines.push(`> — ${chapter.epigraph.author}`);
    }
    lines.push("");
  }
  paragraphs.forEach((paragraph) => {
    const translation = paragraph.translation ?? "";
    const original = paragraph.original ?? "";
    if (options.bilingual) {
      lines.push(`**Original:** ${original}`);
      lines.push(`**Tradução:** ${translation || ""}`);
    } else {
      lines.push(translation || original);
    }
    lines.push("");
  });
  if (options.includeNotes) {
    lines.push("> Notas do tradutor: ");
    lines.push("");
  }
  return lines.join("\n");
};

export default function ExportPage({ params }: { params: { bookId: string } }) {
  const [format, setFormat] = useState<ExportFormat>("docx");
  const [options, setOptions] = useState<ExportOptions>({
    includeMetadata: true,
    includeEpigraphs: true,
    bilingual: false,
    includeNotes: false,
  });
  const [isExporting, setIsExporting] = useState(false);

  const { data: book } = useQuery({
    queryKey: ["book", params.bookId],
    queryFn: () => booksService.get(params.bookId),
  });

  const { data: chapters = [], isLoading } = useQuery({
    queryKey: ["chapters", params.bookId, "export"],
    queryFn: () => chaptersService.listWithStats(params.bookId),
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
    const metadata = options.includeMetadata
      ? `Título: ${book.title}\nAutor: ${book.author ?? "—"}\nIdiomas: ${book.sourceLanguage} → ${book.targetLanguage}\n\n`
      : "";
    if (format === "md") {
      return (
        metadata +
        `# ${book.title}\n\n` +
        buildChapterMarkdown({ chapter, paragraphs: limitedParagraphs, options })
      );
    }
    return metadata + buildChapterText({ chapter, paragraphs: limitedParagraphs, options });
  }, [book, chapters, format, options, previewParagraphs]);

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

      if (format === "txt" || format === "md") {
        const chapterContent = orderedChapters
          .map((chapter, index) =>
            format === "md"
              ? buildChapterMarkdown({ chapter, paragraphs: paragraphLists[index], options })
              : buildChapterText({ chapter, paragraphs: paragraphLists[index], options }),
          )
          .join("\n\n");
        const metadata = options.includeMetadata
          ? `Título: ${book.title}\nAutor: ${book.author ?? "—"}\nIdiomas: ${book.sourceLanguage} → ${book.targetLanguage}\n\n`
          : "";
        const content = format === "md" ? `${metadata}# ${book.title}\n\n${chapterContent}` : `${metadata}${chapterContent}`;
        const blob = new Blob([content], {
          type: format === "md" ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8",
        });
        downloadBlob(blob, `${slugify(book.title)}.${format}`);
        toast.success("Exportação concluída");
        return;
      }

      const { Document, Packer, Paragraph, TextRun } = await import("docx");

      const docParagraphs: InstanceType<typeof Paragraph>[] = [];
      if (options.includeMetadata) {
        docParagraphs.push(
          new Paragraph({
            children: [new TextRun({ text: `Título: ${book.title}`, bold: true })],
          }),
          new Paragraph({ text: `Autor: ${book.author ?? "—"}` }),
          new Paragraph({ text: `Idiomas: ${book.sourceLanguage} → ${book.targetLanguage}` }),
          new Paragraph({ text: "" }),
        );
      }

      orderedChapters.forEach((chapter, index) => {
        docParagraphs.push(
          new Paragraph({
            children: [new TextRun({ text: `Capítulo ${chapter.number}: ${chapter.title}`, bold: true })],
          }),
        );
        if (options.includeEpigraphs && chapter.epigraph?.text) {
          docParagraphs.push(new Paragraph({ text: `"${chapter.epigraph.text}"`, italics: true }));
          if (chapter.epigraph.author) {
            docParagraphs.push(new Paragraph({ text: `— ${chapter.epigraph.author}` }));
          }
        }
        paragraphLists[index].forEach((paragraph) => {
          const translation = paragraph.translation ?? "";
          const original = paragraph.original ?? "";
          if (options.bilingual) {
            docParagraphs.push(new Paragraph({ text: `Original: ${original}` }));
            docParagraphs.push(new Paragraph({ text: `Tradução: ${translation || ""}` }));
          } else {
            docParagraphs.push(new Paragraph({ text: translation || original }));
          }
        });
        if (options.includeNotes) {
          docParagraphs.push(new Paragraph({ text: "Notas do tradutor:" }));
        }
        docParagraphs.push(new Paragraph({ text: "" }));
      });

      const doc = new Document({ sections: [{ properties: {}, children: docParagraphs }] });
      const blob = await Packer.toBlob(doc);
      downloadBlob(blob, `${slugify(book.title)}.docx`);
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
        <div className="flex flex-wrap gap-3">
          {FORMAT_CARDS.map((card) => (
            <button
              key={card.value}
              type="button"
              onClick={() => setFormat(card.value)}
              className={`flex min-w-[220px] flex-col rounded-2xl border px-4 py-3 text-left text-sm transition ${
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
        <div className="grid gap-3 md:grid-cols-2">
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
