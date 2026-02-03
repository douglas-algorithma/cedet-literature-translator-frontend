"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Skeleton } from "@/components/common/Skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { booksService } from "@/services/booksService";
import { chaptersService } from "@/services/chaptersService";
import { translationService } from "@/services/translationService";
import type { Paragraph } from "@/types/chapter";

export default function TranslationEditorPage({
  params,
}: {
  params: { bookId: string; chapterId: string };
}) {
  const [activeParagraph, setActiveParagraph] = useState<string | null>(null);

  const { data: book, isLoading: bookLoading } = useQuery({
    queryKey: ["book", params.bookId],
    queryFn: () => booksService.get(params.bookId),
  });

  const { data: chapter, isLoading: chapterLoading } = useQuery({
    queryKey: ["chapter", params.chapterId],
    queryFn: () => chaptersService.get(params.chapterId),
  });

  const {
    data: paragraphs = [],
    isLoading: paragraphsLoading,
    refetch,
  } = useQuery({
    queryKey: ["paragraphs", params.chapterId],
    queryFn: () => chaptersService.listParagraphs(params.chapterId),
  });

  const handleTranslate = async (paragraph: Paragraph) => {
    if (!book || !chapter) return;
    setActiveParagraph(paragraph.id);
    try {
      const result = await translationService.translateParagraph({
        bookId: book.id,
        bookTitle: book.title,
        chapterNumber: chapter.number,
        paragraphSequence: paragraph.index,
        sourceLanguage: book.sourceLanguage,
        targetLanguage: book.targetLanguage,
        originalText: paragraph.original,
      });

      if (!result.translatedText) {
        toast.error("A tradução não retornou texto.");
        return;
      }

      await chaptersService.updateParagraph(paragraph.id, {
        translatedText: result.translatedText,
        status: "translated",
      });

      toast.success("Tradução concluída");
      await refetch();
    } catch (error) {
      toast.error((error as Error).message ?? "Erro ao traduzir parágrafo");
    } finally {
      setActiveParagraph(null);
    }
  };

  if (bookLoading || chapterLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-60" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Capítulo ${chapter?.number ?? params.chapterId}`}
        description={`${book?.title ?? "Livro"} · Editor de tradução`}
        action={<Button>Traduzir capítulo</Button>}
      />

      {paragraphsLoading ? (
        <Skeleton className="h-40" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-text">Texto original</h3>
              <Badge variant="neutral">{book?.sourceLanguage ?? "-"}</Badge>
            </div>
            <div className="mt-4 space-y-4 text-sm text-text">
              {paragraphs.map((paragraph) => (
                <div
                  key={paragraph.id}
                  className="rounded-2xl border border-border bg-surface-muted px-4 py-3"
                >
                  <p className="text-xs text-text-muted">Parágrafo {paragraph.index}</p>
                  <p className="mt-2">{paragraph.original}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-3"
                    onClick={() => handleTranslate(paragraph)}
                    loading={activeParagraph === paragraph.id}
                  >
                    Traduzir
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-text">Tradução</h3>
              <Badge variant="neutral">{book?.targetLanguage ?? "-"}</Badge>
            </div>
            <div className="mt-4 space-y-4 text-sm text-text">
              {paragraphs.map((paragraph) => (
                <div
                  key={`translation-${paragraph.id}`}
                  className="rounded-2xl border border-border bg-surface-muted px-4 py-3"
                >
                  <p className="text-xs text-text-muted">Parágrafo {paragraph.index}</p>
                  <p className="mt-2 text-text-muted">
                    {paragraph.translation ?? "Aguardando tradução."}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => handleTranslate(paragraph)}
                    loading={activeParagraph === paragraph.id}
                  >
                    Traduzir
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
