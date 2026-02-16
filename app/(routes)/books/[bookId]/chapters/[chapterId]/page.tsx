"use client";

import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Skeleton } from "@/components/common/Skeleton";
import { Toggle } from "@/components/common/Toggle";
import {
  GlossaryHighlightText,
  HitlPanel,
  ParagraphOriginalCard,
  ParagraphTranslationCard,
  TranslationFooterBar,
  TranslationHeader,
} from "@/components/translation";
import { buildReview } from "@/lib/utils/translation";
import { getGlossaryCoverage } from "@/lib/utils/glossary";
import { useScrollSync } from "@/lib/hooks/useScrollSync";
import { useWebSocket } from "@/lib/hooks/useWebSocket";
import { booksService } from "@/services/booksService";
import { chaptersService } from "@/services/chaptersService";
import { glossaryService } from "@/services/glossaryService";
import { translationService } from "@/services/translationService";
import { useGlossaryStore } from "@/stores/glossaryStore";
import { useTranslationStore } from "@/stores/translationStore";
import type { Paragraph } from "@/types/chapter";
import type { GlossarySuggestion } from "@/types/glossary";
import type { TranslationStatus } from "@/types/translation";

type TranslationMeta = {
  threadId?: string;
  agentOutputs?: Record<string, unknown>;
  lastTranslation?: string;
};

const mapBackendStatus = (status: Paragraph["status"]): TranslationStatus => {
  if (status === "approved") return "approved";
  if (status === "translated") return "review";
  return "pending";
};

export default function TranslationEditorPage({
  params,
}: {
  params: Promise<{ bookId: string; chapterId: string }>;
}) {
  const { bookId, chapterId } = use(params);
  const router = useRouter();
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  const [syncScroll, setSyncScroll] = useState(true);
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(null);
  const [metaByParagraph, setMetaByParagraph] = useState<Record<string, TranslationMeta>>({});
  const [isBatchTranslating, setIsBatchTranslating] = useState(false);
  const [isGeneratingGlossary, setIsGeneratingGlossary] = useState(false);
  const [activePanel, setActivePanel] = useState<"original" | "translation">("original");

  const {
    statusByParagraph,
    progressByParagraph,
    currentReview,
    setStatus,
    setProgress,
    setError,
    setReviewData,
    openReview,
    closeReview,
  } = useTranslationStore();

  const { addPendingTerm, fetchSuggestions } = useGlossaryStore();

  const { data: book, isLoading: bookLoading } = useQuery({
    queryKey: ["book", bookId],
    queryFn: () => booksService.get(bookId),
  });

  const { data: chapters = [] } = useQuery({
    queryKey: ["chapters", bookId],
    queryFn: () => chaptersService.list(bookId),
  });

  const { data: chapter, isLoading: chapterLoading } = useQuery({
    queryKey: ["chapter", chapterId],
    queryFn: () => chaptersService.get(chapterId),
  });

  const {
    data: paragraphs = [],
    isLoading: paragraphsLoading,
    refetch,
  } = useQuery({
    queryKey: ["paragraphs", chapterId],
    queryFn: () => chaptersService.listParagraphs(chapterId),
  });

  const { data: glossaryTerms = [] } = useQuery({
    queryKey: ["glossary", bookId],
    queryFn: () => glossaryService.list(bookId),
  });

  const getParagraphStatus = useCallback(
    (paragraph: Paragraph) => statusByParagraph[paragraph.id] ?? mapBackendStatus(paragraph.status),
    [statusByParagraph],
  );

  const pendingReviewCount = useMemo(
    () => paragraphs.filter((paragraph) => getParagraphStatus(paragraph) === "review").length,
    [getParagraphStatus, paragraphs],
  );

  const approvedCount = useMemo(
    () => paragraphs.filter((paragraph) => paragraph.status === "approved").length,
    [paragraphs],
  );

  const translatedCount = useMemo(
    () => paragraphs.filter((paragraph) => ["translated", "approved"].includes(paragraph.status)).length,
    [paragraphs],
  );

  const progressValue = paragraphs.length ? Math.round((translatedCount / paragraphs.length) * 100) : 0;

  const glossaryCoverageByParagraph = useMemo(() => {
    if (!glossaryTerms.length) return {};
    return paragraphs.reduce<Record<string, ReturnType<typeof getGlossaryCoverage>>>((acc, paragraph) => {
      acc[paragraph.id] = getGlossaryCoverage(paragraph.original, paragraph.translation, glossaryTerms);
      return acc;
    }, {});
  }, [glossaryTerms, paragraphs]);

  const serializedGlossaryEntries = useMemo(() => {
    if (!glossaryTerms.length) {
      return undefined;
    }
    const entries = glossaryTerms.map((term) => ({
      source_term: term.sourceTerm,
      target_term: term.targetTerm,
      context: term.context ?? "",
    }));
    return JSON.stringify(entries);
  }, [glossaryTerms]);

  const chapterOptions = useMemo(
    () =>
      chapters.map((item) => ({
        value: item.id,
        label: `Capítulo ${item.number} · ${item.title}`,
      })),
    [chapters],
  );

  const activeReviewParagraph = useMemo(
    () => paragraphs.find((paragraph) => paragraph.id === currentReview?.paragraphId),
    [currentReview, paragraphs],
  );

  const firstReviewParagraph = useMemo(
    () => paragraphs.find((paragraph) => getParagraphStatus(paragraph) === "review"),
    [getParagraphStatus, paragraphs],
  );

  const reviewTargetParagraph = activeReviewParagraph ?? firstReviewParagraph;

  const reviewIndex = activeReviewParagraph
    ? paragraphs.findIndex((paragraph) => paragraph.id === activeReviewParagraph.id)
    : -1;

  const previousParagraph = reviewIndex > 0 ? paragraphs[reviewIndex - 1] : undefined;
  const nextParagraph = reviewIndex >= 0 && reviewIndex < paragraphs.length - 1 ? paragraphs[reviewIndex + 1] : undefined;

  useScrollSync({ enabled: syncScroll, leftRef: leftPanelRef, rightRef: rightPanelRef });

  const handleTranslateParagraph = useCallback(
    async (paragraph: Paragraph, feedback?: string) => {
      if (!book || !chapter) return;
      setActiveParagraphId(paragraph.id);
      setStatus(paragraph.id, "translating");
      setProgress(paragraph.id, { currentAgent: "Supervisor Agent", progress: 15 });

      try {
        const meta = metaByParagraph[paragraph.id];
        const resolvedGenre =
          book.primaryCategory ?? (book.genre?.length ? book.genre.join(", ") : undefined);
        const result = feedback
          ? await translationService.refineParagraph({
              bookId: book.id,
              bookTitle: book.title,
              chapterNumber: chapter.number,
              paragraphSequence: paragraph.index,
              sourceLanguage: book.sourceLanguage,
              targetLanguage: book.targetLanguage,
              originalText: paragraph.original,
              threadId: meta?.threadId,
              previousTranslated: meta?.lastTranslation ?? paragraph.translation,
              genre: resolvedGenre,
              context: book.description,
              styleNotes: book.translationNotes,
              feedback,
              glossaryEntries: serializedGlossaryEntries,
            })
          : await translationService.translateParagraph({
              bookId: book.id,
              bookTitle: book.title,
              chapterNumber: chapter.number,
              paragraphSequence: paragraph.index,
              sourceLanguage: book.sourceLanguage,
              targetLanguage: book.targetLanguage,
              originalText: paragraph.original,
              genre: resolvedGenre,
              context: book.description,
              styleNotes: book.translationNotes,
              glossaryEntries: serializedGlossaryEntries,
            });

        const translatedText = result.translatedText;
        if (!translatedText) {
          toast.error("A tradução não retornou texto.");
          setError(paragraph.id, "Sem conteúdo traduzido.");
          return;
        }

        setMetaByParagraph((state) => ({
          ...state,
          [paragraph.id]: {
            threadId: result.threadId ?? meta?.threadId,
            agentOutputs: result.agentOutputs ?? meta?.agentOutputs,
            lastTranslation: translatedText,
          },
        }));

        setProgress(paragraph.id, { progress: 100, currentAgent: "Concluído" });
        setReviewData(buildReview({ paragraphId: paragraph.id, translation: translatedText, agentOutputs: result.agentOutputs }));

        await chaptersService.updateParagraph(paragraph.id, {
          translatedText,
          status: "translated",
        });

        toast.success("Tradução concluída. Revisão pendente.");
        await refetch();
      } catch (error) {
        setError(paragraph.id, (error as Error).message ?? "Erro ao traduzir.");
        toast.error((error as Error).message ?? "Erro ao traduzir parágrafo");
      }
    },
    [
      book,
      chapter,
      metaByParagraph,
      refetch,
      serializedGlossaryEntries,
      setError,
      setProgress,
      setReviewData,
      setStatus,
    ],
  );

  const handleApprove = useCallback(
    async (paragraphId: string, translationText: string, closeAfter = true) => {
      if (!translationText) {
        toast.error("A tradução está vazia.");
        return;
      }
      try {
        await chaptersService.updateParagraph(paragraphId, {
          translatedText: translationText,
          status: "approved",
        });
        setStatus(paragraphId, "approved");
        toast.success("Tradução aprovada.");
        await refetch();
        if (closeAfter) closeReview();
      } catch (error) {
        toast.error((error as Error).message ?? "Erro ao aprovar tradução");
      }
    },
    [closeReview, refetch, setStatus],
  );

  const handleEditOriginal = useCallback(
    async (paragraph: Paragraph) => {
      const draft = window.prompt("Editar parágrafo original:", paragraph.original);
      if (draft === null) return;
      const normalized = draft.trim();
      if (!normalized) {
        toast.error("O parágrafo original não pode ficar vazio.");
        return;
      }
      const hadTranslation = Boolean(paragraph.translation?.trim());
      if (
        hadTranslation &&
        !window.confirm(
          "Este parágrafo já possui tradução. Ao editar o original, a tradução atual será removida. Deseja continuar?",
        )
      ) {
        return;
      }
      try {
        await chaptersService.updateParagraph(paragraph.id, {
          originalText: normalized,
          translatedText: hadTranslation ? null : undefined,
          status: hadTranslation ? "pending" : paragraph.status,
        });
        if (hadTranslation) {
          setStatus(paragraph.id, "pending");
          setMetaByParagraph((state) => {
            const next = { ...state };
            delete next[paragraph.id];
            return next;
          });
        }
        toast.success("Parágrafo atualizado.");
        await refetch();
      } catch (error) {
        toast.error((error as Error).message ?? "Erro ao atualizar parágrafo");
      }
    },
    [refetch, setStatus],
  );

  const handleDeleteOriginal = useCallback(
    async (paragraph: Paragraph) => {
      const confirm = window.confirm("Excluir este parágrafo?");
      if (!confirm) return;
      try {
        await chaptersService.deleteParagraph(paragraph.id);
        setMetaByParagraph((state) => {
          const next = { ...state };
          delete next[paragraph.id];
          return next;
        });
        toast.success("Parágrafo excluído.");
        await refetch();
      } catch (error) {
        toast.error((error as Error).message ?? "Erro ao excluir parágrafo");
      }
    },
    [refetch],
  );

  const handleMoveParagraph = useCallback(
    async (paragraphId: string, direction: "up" | "down") => {
      const currentIndex = paragraphs.findIndex((paragraph) => paragraph.id === paragraphId);
      if (currentIndex < 0) return;
      const targetIndex =
        direction === "up"
          ? Math.max(0, currentIndex - 1)
          : Math.min(paragraphs.length - 1, currentIndex + 1);
      if (targetIndex === currentIndex) return;

      const reordered = [...paragraphs];
      const [moved] = reordered.splice(currentIndex, 1);
      reordered.splice(targetIndex, 0, moved);

      try {
        await chaptersService.reorderParagraphs(
          chapterId,
          reordered.map((paragraph) => paragraph.id),
        );
        toast.success("Ordem dos parágrafos atualizada.");
        await refetch();
      } catch (error) {
        toast.error((error as Error).message ?? "Erro ao reordenar parágrafos");
      }
    },
    [chapterId, paragraphs, refetch],
  );

  const handleRefine = useCallback(
    async (paragraph: Paragraph, feedback: string, currentTranslation: string) => {
      if (!feedback) {
        toast.error("Descreva o motivo do refinamento.");
        return;
      }
      await handleTranslateParagraph({ ...paragraph, translation: currentTranslation }, feedback);
    },
    [handleTranslateParagraph],
  );

  const handleOpenReview = useCallback(
    (paragraph?: Paragraph) => {
      if (!paragraph || !paragraph.translation) {
        toast.error("Tradução indisponível para revisão.");
        return;
      }
      const meta = metaByParagraph[paragraph.id];
      openReview(buildReview({ paragraphId: paragraph.id, translation: paragraph.translation, agentOutputs: meta?.agentOutputs }));
      setActiveParagraphId(paragraph.id);
      setActivePanel("translation");
    },
    [metaByParagraph, openReview],
  );

  const handleTranslateAll = useCallback(async () => {
    if (!paragraphs.length) return;
    const pendingParagraphs = paragraphs.filter((paragraph) => getParagraphStatus(paragraph) === "pending");
    if (!pendingParagraphs.length) {
      toast.message("Nenhum parágrafo pendente.");
      return;
    }
    const confirm = window.confirm(`Iniciar tradução de ${pendingParagraphs.length} parágrafos pendentes?`);
    if (!confirm) return;

    setIsBatchTranslating(true);
    for (const paragraph of pendingParagraphs) {
      await handleTranslateParagraph(paragraph);
      if (useTranslationStore.getState().currentReview) {
        toast.message("Revisão pendente. Fluxo em pausa.");
        break;
      }
    }
    setIsBatchTranslating(false);
  }, [getParagraphStatus, handleTranslateParagraph, paragraphs]);

  const handleSkipReview = useCallback(() => {
    closeReview();
  }, [closeReview]);

  const handleGenerateGlossary = useCallback(async () => {
    if (!chapterId || !bookId) return;
    setIsGeneratingGlossary(true);
    try {
      const suggestions = await glossaryService.generateSuggestions(chapterId);
      suggestions.forEach((suggestion) => addPendingTerm(suggestion));
      await fetchSuggestions(bookId);
      toast.success(
        `${suggestions.length} sugestão(ões) de glossário gerada(s)`,
        {
          action: {
            label: "Ver glossário",
            onClick: () => router.push(`/books/${bookId}/glossary`),
          },
        },
      );
    } catch (error) {
      toast.error((error as Error).message ?? "Erro ao gerar sugestões de glossário");
    } finally {
      setIsGeneratingGlossary(false);
    }
  }, [chapterId, bookId, addPendingTerm, fetchSuggestions, router]);

  const focusParagraph = useCallback(
    (paragraphId: string) => {
      setActiveParagraphId(paragraphId);
      const element = document.querySelector(`[data-paragraph-id="${paragraphId}"]`);
      if (element instanceof HTMLElement) {
        element.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    },
    [],
  );

  const moveSelection = useCallback(
    (direction: "up" | "down") => {
      if (!paragraphs.length) return;
      const currentIndex = paragraphs.findIndex((item) => item.id === activeParagraphId);
      const nextIndex =
        currentIndex === -1
          ? 0
          : direction === "up"
            ? Math.max(0, currentIndex - 1)
            : Math.min(paragraphs.length - 1, currentIndex + 1);
      const target = paragraphs[nextIndex];
      focusParagraph(target.id);
    },
    [activeParagraphId, focusParagraph, paragraphs],
  );

  const handleKeyboardShortcuts = useCallback(
    (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key.toLowerCase() === "t") {
          event.preventDefault();
          const target = paragraphs.find((item) => item.id === activeParagraphId);
          if (target) handleTranslateParagraph(target);
        }
        if (event.key.toLowerCase() === "g") {
          event.preventDefault();
          router.push(`/books/${bookId}/glossary`);
        }
      }
      if (event.altKey && event.key === "ArrowUp") {
        event.preventDefault();
        moveSelection("up");
      }
      if (event.altKey && event.key === "ArrowDown") {
        event.preventDefault();
        moveSelection("down");
      }
    },
    [activeParagraphId, bookId, handleTranslateParagraph, moveSelection, paragraphs, router],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyboardShortcuts);
    return () => window.removeEventListener("keydown", handleKeyboardShortcuts);
  }, [handleKeyboardShortcuts]);

  const { status: connectionStatus, reconnectAttempts } = useWebSocket({
    bookId,
    chapterId,
    onEvent: (event) => {
      if (event.type === "translation.started") {
        const payload = event.payload as { paragraphId: string };
        setStatus(payload.paragraphId, "translating");
      }
      if (event.type === "translation.progress") {
        const payload = event.payload as {
          paragraphId: string;
          progress?: number;
          currentAgent?: string;
          message?: string;
        };
        setProgress(payload.paragraphId, {
          progress: payload.progress,
          currentAgent: payload.currentAgent,
          message: payload.message,
        });
      }
      if (event.type === "translation.review") {
        const payload = event.payload as {
          paragraphId: string;
          translation: string;
          agentAnalysis?: Record<string, unknown>;
          suggestions?: string[];
        };
        setReviewData(
          buildReview({
            paragraphId: payload.paragraphId,
            translation: payload.translation,
            agentOutputs: payload.agentAnalysis,
          }),
        );
        setActiveParagraphId(payload.paragraphId);
      }
      if (event.type === "translation.approved") {
        const payload = event.payload as { paragraphId: string };
        setStatus(payload.paragraphId, "approved");
      }
      if (event.type === "translation.error") {
        const payload = event.payload as { paragraphId: string; error?: string };
        setError(payload.paragraphId, payload.error ?? "Erro no processamento.");
      }
      if (event.type === "glossary.suggestion") {
        const payload = event.payload as {
          term: string;
          suggestedTranslation: string;
          context?: string;
          paragraphId?: string;
        };
        const suggestion: GlossarySuggestion = {
          id: `ws-${Date.now()}-${Math.random()}`,
          bookId: bookId ?? "",
          chapterId: chapterId ?? "",
          term: payload.term,
          suggestedTranslation: payload.suggestedTranslation,
          context: payload.context ?? "",
          confidence: 0.8,
          createdAt: new Date().toISOString(),
          category: null,
        };
        addPendingTerm(suggestion);
      }
    },
  });

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
      <TranslationHeader
        backHref={`/books/${bookId}`}
        title={`Capítulo ${chapter?.number ?? chapterId}: ${chapter?.title ?? ""}`}
        subtitle={`${book?.title ?? "Livro"} · Editor de tradução`}
        chapterOptions={chapterOptions}
        selectedChapter={chapterId}
        onChapterChange={(value) => router.push(`/books/${bookId}/chapters/${value}`)}
        progressLabel={`${approvedCount}/${paragraphs.length} aprovados · ${translatedCount}/${paragraphs.length} traduzidos`}
        progressValue={progressValue}
        onTranslateAll={handleTranslateAll}
        isTranslating={isBatchTranslating}
        onGenerateGlossary={handleGenerateGlossary}
        isGeneratingGlossary={isGeneratingGlossary}
        connectionStatus={connectionStatus}
        reconnectAttempts={reconnectAttempts}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Toggle
          checked={syncScroll}
          onChange={setSyncScroll}
          label="Scroll sincronizado"
        />
        {isBatchTranslating ? (
          <Badge variant="info">Tradução em lote ativa</Badge>
        ) : null}
      </div>

      {paragraphsLoading ? (
        <Skeleton className="h-40" />
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2 md:hidden">
            <Button
              size="sm"
              variant={activePanel === "original" ? "primary" : "secondary"}
              onClick={() => setActivePanel("original")}
            >
              Original
            </Button>
            <Button
              size="sm"
              variant={activePanel === "translation" ? "primary" : "secondary"}
              onClick={() => setActivePanel("translation")}
            >
              Tradução
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card
              className={`flex h-[70vh] flex-col gap-4 overflow-hidden ${
                activePanel === "original" ? "flex" : "hidden md:flex"
              }`}
            >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-semibold text-text">Texto original</h3>
              <Badge variant="neutral">{book?.sourceLanguage ?? "-"}</Badge>
            </div>
            <div ref={leftPanelRef} className="flex-1 space-y-4 overflow-y-auto pr-2 text-sm text-text">
              {chapter?.epigraph ? (
                <div className="rounded-2xl border border-border bg-surface-muted p-4 text-sm italic text-text">
                  <p>{chapter.epigraph.text}</p>
                  <p className="mt-2 text-xs not-italic text-text-muted">— {chapter.epigraph.author}</p>
                </div>
              ) : null}
              {paragraphs.map((paragraph, paragraphListIndex) => (
                <ParagraphOriginalCard
                  key={paragraph.id}
                  index={paragraph.index}
                  text={paragraph.original}
                  highlightedText={
                    glossaryTerms.length ? (
                      <GlossaryHighlightText text={paragraph.original} terms={glossaryTerms} />
                    ) : undefined
                  }
                  isActive={activeParagraphId === paragraph.id}
                  onTranslate={() => handleTranslateParagraph(paragraph)}
                  onFocus={() => focusParagraph(paragraph.id)}
                  onEditOriginal={() => handleEditOriginal(paragraph)}
                  onDelete={() => handleDeleteOriginal(paragraph)}
                  onMoveUp={
                    paragraphListIndex > 0
                      ? () => handleMoveParagraph(paragraph.id, "up")
                      : undefined
                  }
                  onMoveDown={
                    paragraphListIndex < paragraphs.length - 1
                      ? () => handleMoveParagraph(paragraph.id, "down")
                      : undefined
                  }
                  dataParagraphId={paragraph.id}
                />
              ))}
            </div>
          </Card>

          <Card
            className={`flex h-[70vh] flex-col gap-4 overflow-hidden ${
              activePanel === "translation" ? "flex" : "hidden md:flex"
            }`}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-semibold text-text">Tradução</h3>
              <Badge variant="neutral">{book?.targetLanguage ?? "-"}</Badge>
            </div>
            <div ref={rightPanelRef} className="flex-1 space-y-4 overflow-y-auto pr-2 text-sm text-text">
              {chapter?.epigraph ? (
                <div className="rounded-2xl border border-border bg-surface-muted p-4 text-sm italic text-text-muted">
                  Epígrafe aguardando tradução.
                </div>
              ) : null}
              {paragraphs.map((paragraph) => (
                (() => {
                  const status = getParagraphStatus(paragraph);
                  const coverage = glossaryCoverageByParagraph[paragraph.id];
                  return (
                    <ParagraphTranslationCard
                      key={`translation-${paragraph.id}`}
                      index={paragraph.index}
                      translation={paragraph.translation}
                      status={status}
                      progress={progressByParagraph[paragraph.id]}
                      glossaryStatus={
                        status !== "pending" && coverage
                          ? {
                              total: coverage.total,
                              applied: coverage.applied,
                              missing: coverage.missing,
                              missingTerms: coverage.missingTerms.map((term) => term.targetTerm),
                            }
                          : undefined
                      }
                      isActive={activeParagraphId === paragraph.id}
                      onTranslate={() => handleTranslateParagraph(paragraph)}
                      onApprove={() => handleApprove(paragraph.id, paragraph.translation ?? "", false)}
                      onOpenReview={paragraph.translation ? () => handleOpenReview(paragraph) : undefined}
                      onRefine={() => handleOpenReview(paragraph)}
                      onRetry={() => handleTranslateParagraph(paragraph)}
                      dataParagraphId={paragraph.id}
                    />
                  );
                })()
              ))}
            </div>
          </Card>
        </div>
        </div>
      )}

      <TranslationFooterBar
        pendingReviewCount={pendingReviewCount}
        onOpenReview={() => reviewTargetParagraph && handleOpenReview(reviewTargetParagraph)}
        onApprove={() =>
          reviewTargetParagraph &&
          handleApprove(reviewTargetParagraph.id, reviewTargetParagraph.translation ?? "")
        }
        onSkip={handleSkipReview}
      />

      {currentReview && activeReviewParagraph ? (
        <HitlPanel
          key={currentReview.paragraphId}
          open={Boolean(currentReview)}
          paragraphNumber={activeReviewParagraph.index}
          originalText={activeReviewParagraph.original}
          previousText={previousParagraph?.original}
          nextText={nextParagraph?.original}
          translation={currentReview.translation}
          analysis={currentReview.analysis}
          suggestions={currentReview.suggestions}
          onApprove={(translation) => handleApprove(currentReview.paragraphId, translation, true)}
          onRefine={(feedback, currentTranslation) =>
            handleRefine(activeReviewParagraph, feedback, currentTranslation)
          }
          onClose={closeReview}
        />
      ) : null}
    </div>
  );
}
