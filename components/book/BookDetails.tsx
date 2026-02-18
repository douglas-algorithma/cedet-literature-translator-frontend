"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Badge } from "@/components/common/Badge";
import { Button, buttonStyles } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { ProgressBar } from "@/components/common/ProgressBar";
import { Skeleton } from "@/components/common/Skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChapterList } from "@/components/chapter/ChapterList";
import {
  formatBookLanguages,
  formatBookStatus,
  formatDate,
  getBookProgressFromChapters,
  isChapterTranslated,
  getStatusVariant,
  cn,
} from "@/lib/utils";
import { booksService } from "@/services/booksService";
import { chaptersService } from "@/services/chaptersService";
import { glossaryService } from "@/services/glossaryService";

export function BookDetails({ bookId }: { bookId: string }) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { data: book, isLoading, error } = useQuery({
    queryKey: ["book", bookId],
    queryFn: () => booksService.get(bookId),
  });

  const { data: chapters = [] } = useQuery({
    queryKey: ["chapters", bookId],
    queryFn: () => chaptersService.listWithStats(bookId),
  });

  const { data: glossaryTerms = [] } = useQuery({
    queryKey: ["glossary", bookId],
    queryFn: () => glossaryService.list(bookId),
  });

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await booksService.delete(bookId);
      toast.success("Livro excluído");
      router.push("/");
    } catch (err) {
      toast.error((err as Error).message ?? "Não foi possível excluir o livro");
    } finally {
      setDeleteLoading(false);
      setDeleteOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-60" />
        <Skeleton className="h-28" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (error || !book) {
    return (
      <EmptyState
        title="Não foi possível carregar o livro"
        description="Tente novamente mais tarde para acessar os detalhes."
        action={
          <Button type="button" onClick={() => router.refresh()}>
            Recarregar
          </Button>
        }
      />
    );
  }

  const totalChapters = chapters.length;
  const translatedChapters = chapters.filter((chapter) => isChapterTranslated(chapter)).length;
  const totalParagraphs = chapters.reduce(
    (sum, chapter) => sum + (chapter.totalParagraphs ?? 0),
    0,
  );
  const translatedParagraphs = chapters.reduce(
    (sum, chapter) => sum + (chapter.translatedParagraphs ?? 0),
    0,
  );
  const progress = getBookProgressFromChapters({
    totalChapters,
    translatedChapters,
    totalParagraphs,
    translatedParagraphs,
  });
  const statusLabel = formatBookStatus(book.status);
  const statusVariant = getStatusVariant(book.status);
  const hasChapters = totalChapters > 0;
  const canExport = hasChapters && translatedChapters === totalChapters;

  return (
    <div className="space-y-8">
      <PageHeader
        title={book.title}
        description={`${book.author} · ${formatBookLanguages(book)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link className={buttonStyles({ variant: "outline" })} href={`/books/${book.id}/edit`}>
              Editar livro
            </Link>
            <Link className={buttonStyles({ variant: "outline" })} href={`/books/${book.id}/glossary`}>
              Glossário
            </Link>
            <Link
              className={cn(
                buttonStyles({}),
                !canExport && "pointer-events-none opacity-50",
              )}
              href={`/books/${book.id}/export`}
              title={canExport ? "Exportar livro" : "Finalize todos os capítulos para exportar"}
              aria-disabled={!canExport}
            >
              Exportar
            </Link>
            <Button variant="destructive" type="button" onClick={() => setDeleteOpen(true)}>
              Excluir
            </Button>
          </div>
        }
      />

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-text-muted">Progresso geral</p>
            <p className="text-2xl font-semibold text-text">{progress}% concluído</p>
          </div>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </div>
        <ProgressBar value={progress} />
        <div className="flex flex-wrap items-center justify-between text-sm text-text-muted">
          <span>
            {translatedChapters} de {totalChapters} capítulos traduzidos
          </span>
          <span>Última atividade: {formatDate(book.updatedAt)}</span>
        </div>
        {book.genre?.length ? (
          <p className="text-sm text-text-muted">
            Categorias: {book.genre.join(", ")}
          </p>
        ) : null}
        {book.translationNotes ? (
          <p className="text-sm text-text-muted">
            Notas de tradução: {book.translationNotes}
          </p>
        ) : null}
        <p className="text-sm text-text-muted">Modelo LLM: {book.llmModel}</p>
        <p className="text-sm text-text-muted">
          OpenRouter API Key: {book.openrouterApiKeyMasked ?? "Não configurada"}
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">Capítulos</h2>
            <Link className={buttonStyles({ size: "sm" })} href={`/books/${book.id}/chapters/new`}>
              Adicionar capítulo
            </Link>
          </div>

          <ChapterList bookId={book.id} />
        </section>

        <aside className="space-y-4">
          <Card className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
              Estatísticas
            </p>
            <div className="flex items-center justify-between text-sm">
              <span>Total de parágrafos</span>
              <span className="font-semibold text-text">{totalParagraphs}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Parágrafos traduzidos</span>
              <span className="font-semibold text-text">{translatedParagraphs}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Parágrafos em revisão</span>
              <span className="font-semibold text-text">-</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Termos no glossário</span>
              <span className="font-semibold text-text">{glossaryTerms.length || "-"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Última atividade</span>
              <span className="font-semibold text-text">{formatDate(book.updatedAt)}</span>
            </div>
          </Card>
        </aside>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Excluir livro?"
        description="Essa ação remove o livro permanentemente e não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        isDanger
        loading={deleteLoading}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
