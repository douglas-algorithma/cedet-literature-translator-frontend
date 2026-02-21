"use client";

import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Modal } from "@/components/common/Modal";
import { Skeleton } from "@/components/common/Skeleton";
import { Textarea } from "@/components/common/Textarea";
import { Toggle } from "@/components/common/Toggle";
import {
  EditOriginalParagraphModal,
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
import { cn } from "@/lib/utils";
import { booksService } from "@/services/booksService";
import { chaptersService } from "@/services/chaptersService";
import { glossaryService } from "@/services/glossaryService";
import { translationService, type TranslationJobUpdate } from "@/services/translationService";
import { useGlossaryStore } from "@/stores/glossaryStore";
import { useTranslationStore } from "@/stores/translationStore";
import type { Paragraph } from "@/types/chapter";
import type { GlossarySuggestion } from "@/types/glossary";
import type { TranslationStatus } from "@/types/translation";

type TranslationMeta = {
  threadId?: string;
  reviewPackage?: Record<string, unknown>;
  agentOutputs?: Record<string, unknown>;
  lastTranslation?: string;
};

const mapBackendStatus = (status: Paragraph["status"]): TranslationStatus => {
  if (status === "approved") return "approved";
  if (status === "translated") return "review";
  return "pending";
};

const MAX_BATCH_CONCURRENCY = 5;
const MAX_PARAGRAPH_TEXT_LENGTH = 100000;

type TranslateParagraphMode = "manualReview" | "autoApprove";

type TranslateParagraphOptions = {
  feedback?: string;
  mode?: TranslateParagraphMode;
  refetchAfterSave?: boolean;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
};

export default function TranslationEditorPage({
  params,
}: {
  params: Promise<{ bookId: string; chapterId: string }>;
}) {
  const { bookId, chapterId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  const [syncScroll, setSyncScroll] = useState(true);
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(null);
  const [metaByParagraph, setMetaByParagraph] = useState<Record<string, TranslationMeta>>({});
  const [isBatchTranslating, setIsBatchTranslating] = useState(false);
  const [isGeneratingGlossary, setIsGeneratingGlossary] = useState(false);
  const [isAddingOriginalParagraph, setIsAddingOriginalParagraph] = useState(false);
  const [isAddOriginalModalOpen, setIsAddOriginalModalOpen] = useState(false);
  const [newOriginalParagraphText, setNewOriginalParagraphText] = useState("");
  const [isEditOriginalModalOpen, setIsEditOriginalModalOpen] = useState(false);
  const [editingParagraphId, setEditingParagraphId] = useState<string | null>(null);
  const [editedOriginalText, setEditedOriginalText] = useState("");
  const [editOriginalError, setEditOriginalError] = useState<string | undefined>();
  const [isSavingOriginalEdit, setIsSavingOriginalEdit] = useState(false);
  const [isConfirmEditOriginalOpen, setIsConfirmEditOriginalOpen] = useState(false);
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
    queryKey: ["chapters", "plain", bookId],
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

  const updateParagraphInCache = useCallback(
    (
      paragraphId: string,
      updater: (paragraph: Paragraph) => Paragraph,
    ) => {
      queryClient.setQueryData<Paragraph[]>(["paragraphs", chapterId], (current) => {
        if (!current?.length) return current ?? [];
        return current.map((paragraph) =>
          paragraph.id === paragraphId ? updater(paragraph) : paragraph,
        );
      });
    },
    [chapterId, queryClient],
  );

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
  const editingParagraph = useMemo(
    () => paragraphs.find((paragraph) => paragraph.id === editingParagraphId),
    [editingParagraphId, paragraphs],
  );

  const reviewIndex = activeReviewParagraph
    ? paragraphs.findIndex((paragraph) => paragraph.id === activeReviewParagraph.id)
    : -1;

  const previousParagraph = reviewIndex > 0 ? paragraphs[reviewIndex - 1] : undefined;
  const nextParagraph = reviewIndex >= 0 && reviewIndex < paragraphs.length - 1 ? paragraphs[reviewIndex + 1] : undefined;

  useScrollSync({ enabled: syncScroll, leftRef: leftPanelRef, rightRef: rightPanelRef });

  const saveParagraphTranslation = useCallback(
    async ({
      paragraphId,
      translatedText,
      status,
    }: {
      paragraphId: string;
      translatedText: string;
      status: "translated" | "approved";
    }) => {
      await chaptersService.updateParagraph(paragraphId, {
        translatedText,
        status,
      });
      updateParagraphInCache(paragraphId, (paragraph) => ({
        ...paragraph,
        translation: translatedText,
        status,
      }));
      if (status === "approved") {
        setStatus(paragraphId, "approved");
      }
    },
    [setStatus, updateParagraphInCache],
  );

  const queueReviewForParagraph = useCallback(
    ({
      paragraphId,
      translation,
      reviewPackage,
      agentOutputs,
    }: {
      paragraphId: string;
      translation: string;
      reviewPackage?: Record<string, unknown> | null;
      agentOutputs?: Record<string, unknown>;
    }) => {
      setReviewData(
        buildReview({
          paragraphId,
          translation,
          reviewPackage: reviewPackage ?? undefined,
          agentOutputs,
        }),
      );
    },
    [setReviewData],
  );

  const handleTranslateParagraph = useCallback(
    async (paragraph: Paragraph, options?: TranslateParagraphOptions) => {
      if (!book || !chapter) return false;
      const {
        feedback,
        mode = "manualReview",
        refetchAfterSave = true,
        showSuccessToast = true,
        showErrorToast = true,
      } = options ?? {};
      setActiveParagraphId(paragraph.id);
      setStatus(paragraph.id, "translating");
      setProgress(paragraph.id, {
        currentAgent: "Fila",
        progress: 10,
        message: "Enfileirando solicitação...",
      });

      try {
        const meta = metaByParagraph[paragraph.id];
        const resolvedGenre =
          book.primaryCategory ?? (book.genre?.length ? book.genre.join(", ") : undefined);
        const onJobStatus = (update: TranslationJobUpdate) => {
          if (update.status === "queued") {
            setProgress(paragraph.id, {
              currentAgent: "Fila",
              progress: 20,
              message: update.message ?? "Aguardando execução no servidor...",
            });
            return;
          }
          if (update.status === "running") {
            setProgress(paragraph.id, {
              currentAgent: "Processando",
              progress: 60,
              message: update.message ?? "Traduzindo no servidor...",
            });
            return;
          }
          if (update.status === "completed") {
            setProgress(paragraph.id, {
              currentAgent: "Finalizando",
              progress: 90,
              message: update.message ?? "Consolidando resultado...",
            });
          }
        };
        const result = feedback
          ? await translationService.refineParagraph({
              bookId: book.id,
              bookTitle: book.title,
              chapterId: chapter.id,
              paragraphId: paragraph.id,
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
            }, { onStatus: onJobStatus })
          : await translationService.translateParagraph({
              bookId: book.id,
              bookTitle: book.title,
              chapterId: chapter.id,
              paragraphId: paragraph.id,
              chapterNumber: chapter.number,
              paragraphSequence: paragraph.index,
              sourceLanguage: book.sourceLanguage,
              targetLanguage: book.targetLanguage,
              originalText: paragraph.original,
              genre: resolvedGenre,
              context: book.description,
              styleNotes: book.translationNotes,
              glossaryEntries: serializedGlossaryEntries,
            }, { onStatus: onJobStatus });

        const translatedText = result.translatedText;
        if (!translatedText) {
          if (showErrorToast) {
            toast.error("A tradução não retornou texto.");
          }
          setError(paragraph.id, "Sem conteúdo traduzido.");
          return false;
        }

        setMetaByParagraph((state) => ({
          ...state,
          [paragraph.id]: {
            threadId: result.threadId ?? meta?.threadId,
            reviewPackage: result.reviewPackage ?? meta?.reviewPackage,
            agentOutputs: result.agentOutputs ?? meta?.agentOutputs,
            lastTranslation: translatedText,
          },
        }));

        setProgress(paragraph.id, { progress: 100, currentAgent: "Concluído" });
        if (mode === "manualReview") {
          queueReviewForParagraph({
            paragraphId: paragraph.id,
            translation: translatedText,
            reviewPackage: result.reviewPackage ?? undefined,
            agentOutputs: result.agentOutputs,
          });
          await saveParagraphTranslation({
            paragraphId: paragraph.id,
            translatedText,
            status: "translated",
          });
          if (showSuccessToast) {
            toast.success("Tradução concluída. Revisão pendente.");
          }
        } else {
          await saveParagraphTranslation({
            paragraphId: paragraph.id,
            translatedText,
            status: "approved",
          });
          if (showSuccessToast) {
            toast.success("Tradução concluída e aprovada.");
          }
        }
        if (refetchAfterSave) {
          await refetch();
        }
        return true;
      } catch (error) {
        setError(paragraph.id, (error as Error).message ?? "Erro ao traduzir.");
        if (showErrorToast) {
          toast.error((error as Error).message ?? "Erro ao traduzir parágrafo");
        }
        return false;
      }
    },
    [
      book,
      chapter,
      queueReviewForParagraph,
      metaByParagraph,
      refetch,
      saveParagraphTranslation,
      serializedGlossaryEntries,
      setError,
      setProgress,
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
        updateParagraphInCache(paragraphId, (paragraph) => ({
          ...paragraph,
          translation: translationText,
          status: "approved",
        }));
        setStatus(paragraphId, "approved");
        toast.success("Tradução aprovada.");
        await refetch();
        if (closeAfter) closeReview();
      } catch (error) {
        toast.error((error as Error).message ?? "Erro ao aprovar tradução");
      }
    },
    [closeReview, refetch, setStatus, updateParagraphInCache],
  );

  const handleEditOriginal = useCallback(
    (paragraph: Paragraph) => {
      setEditingParagraphId(paragraph.id);
      setEditedOriginalText(paragraph.original);
      setEditOriginalError(undefined);
      setIsConfirmEditOriginalOpen(false);
      setIsEditOriginalModalOpen(true);
    },
    [],
  );

  const handleCloseEditOriginalModal = useCallback(() => {
    if (isSavingOriginalEdit) {
      return;
    }
    setIsEditOriginalModalOpen(false);
    setIsConfirmEditOriginalOpen(false);
    setEditingParagraphId(null);
    setEditedOriginalText("");
    setEditOriginalError(undefined);
  }, [isSavingOriginalEdit]);

  const handleSubmitEditedOriginal = useCallback(
    async (confirmTranslationReset: boolean) => {
      if (!editingParagraph) return;
      const normalized = editedOriginalText.trim();
      if (!normalized) {
        const message = "O parágrafo original não pode ficar vazio.";
        setEditOriginalError(message);
        toast.error(message);
        return;
      }
      if (normalized.length > MAX_PARAGRAPH_TEXT_LENGTH) {
        const message = `O parágrafo original não pode ultrapassar ${MAX_PARAGRAPH_TEXT_LENGTH} caracteres.`;
        setEditOriginalError(message);
        toast.error(message);
        return;
      }
      const hadTranslation = Boolean(editingParagraph.translation?.trim());
      if (hadTranslation && !confirmTranslationReset) {
        setIsConfirmEditOriginalOpen(true);
        return;
      }

      setIsSavingOriginalEdit(true);
      try {
        await chaptersService.updateParagraph(editingParagraph.id, {
          originalText: normalized,
          translatedText: hadTranslation ? null : undefined,
          status: hadTranslation ? "pending" : editingParagraph.status,
        });
        updateParagraphInCache(editingParagraph.id, (paragraph) => ({
          ...paragraph,
          original: normalized,
          translation: hadTranslation ? undefined : paragraph.translation,
          status: hadTranslation ? "pending" : paragraph.status,
        }));
        if (hadTranslation) {
          setStatus(editingParagraph.id, "pending");
          setMetaByParagraph((state) => {
            const next = { ...state };
            delete next[editingParagraph.id];
            return next;
          });
        }
        toast.success("Parágrafo atualizado.");
        handleCloseEditOriginalModal();
        await refetch();
      } catch (error) {
        toast.error((error as Error).message ?? "Erro ao atualizar parágrafo");
      } finally {
        setIsSavingOriginalEdit(false);
      }
    },
    [
      editedOriginalText,
      editingParagraph,
      handleCloseEditOriginalModal,
      refetch,
      setStatus,
      updateParagraphInCache,
    ],
  );

  const handleSaveEditedOriginal = useCallback(async () => {
    await handleSubmitEditedOriginal(false);
  }, [handleSubmitEditedOriginal]);

  const handleConfirmEditedOriginal = useCallback(async () => {
    setIsConfirmEditOriginalOpen(false);
    await handleSubmitEditedOriginal(true);
  }, [handleSubmitEditedOriginal]);

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
      await handleTranslateParagraph(
        { ...paragraph, translation: currentTranslation },
        { feedback },
      );
    },
    [handleTranslateParagraph],
  );

  const focusParagraph = useCallback((paragraphId: string) => {
    setActiveParagraphId(paragraphId);
    const selector = `[data-paragraph-id="${paragraphId}"]`;
    const leftElement = leftPanelRef.current?.querySelector(selector);
    const rightElement = rightPanelRef.current?.querySelector(selector);

    if (leftElement instanceof HTMLElement) {
      leftElement.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    if (rightElement instanceof HTMLElement) {
      rightElement.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, []);

  const handleOpenAddOriginalParagraphModal = useCallback(() => {
    setActivePanel("original");
    setIsAddOriginalModalOpen(true);
  }, []);

  const handleCloseAddOriginalParagraphModal = useCallback(() => {
    if (isAddingOriginalParagraph) {
      return;
    }
    setIsAddOriginalModalOpen(false);
    setNewOriginalParagraphText("");
  }, [isAddingOriginalParagraph]);

  const handleAddOriginalParagraph = useCallback(async () => {
    if (!chapterId) return;
    const normalized = newOriginalParagraphText.trim();
    if (!normalized) {
      toast.error("O novo parágrafo não pode ficar vazio.");
      return;
    }
    if (normalized.length > MAX_PARAGRAPH_TEXT_LENGTH) {
      toast.error(`O novo parágrafo não pode ultrapassar ${MAX_PARAGRAPH_TEXT_LENGTH} caracteres.`);
      return;
    }

    setIsAddingOriginalParagraph(true);
    try {
      const createdParagraph = await chaptersService.addParagraph(
        chapterId,
        normalized,
        paragraphs.length + 1,
      );
      setStatus(createdParagraph.id, "pending");
      toast.success("Parágrafo adicionado.");
      setIsAddOriginalModalOpen(false);
      setNewOriginalParagraphText("");
      await refetch();
      window.requestAnimationFrame(() => focusParagraph(createdParagraph.id));
    } catch (error) {
      toast.error((error as Error).message ?? "Erro ao adicionar parágrafo");
    } finally {
      setIsAddingOriginalParagraph(false);
    }
  }, [
    chapterId,
    focusParagraph,
    newOriginalParagraphText,
    paragraphs.length,
    refetch,
    setStatus,
  ]);

  const handleOpenReview = useCallback(
    (paragraph?: Paragraph) => {
      if (!paragraph || !paragraph.translation) {
        toast.error("Tradução indisponível para revisão.");
        return;
      }
      const meta = metaByParagraph[paragraph.id];
      openReview(
        buildReview({
          paragraphId: paragraph.id,
          translation: paragraph.translation,
          reviewPackage: meta?.reviewPackage,
          agentOutputs: meta?.agentOutputs,
        }),
      );
      focusParagraph(paragraph.id);
      setActivePanel("translation");
    },
    [focusParagraph, metaByParagraph, openReview],
  );

  const handleTranslateAll = useCallback(async () => {
    if (!paragraphs.length) return;
    const pendingParagraphs = paragraphs.filter((paragraph) => getParagraphStatus(paragraph) === "pending");
    if (!pendingParagraphs.length) {
      toast.message("Nenhum parágrafo pendente.");
      return;
    }
    const confirm = window.confirm(
      `Iniciar tradução de ${pendingParagraphs.length} parágrafos pendentes com autoaprovação?`,
    );
    if (!confirm) return;

    const workers = Math.min(MAX_BATCH_CONCURRENCY, pendingParagraphs.length);
    const queue = [...pendingParagraphs];
    let successCount = 0;
    let failedCount = 0;

    setIsBatchTranslating(true);
    try {
      const workerTasks = Array.from({ length: workers }, async () => {
        while (queue.length > 0) {
          const paragraph = queue.shift();
          if (!paragraph) {
            return;
          }
          const success = await handleTranslateParagraph(paragraph, {
            mode: "autoApprove",
            refetchAfterSave: false,
            showSuccessToast: false,
            showErrorToast: false,
          });
          if (success) {
            successCount += 1;
            continue;
          }
          failedCount += 1;
        }
      });

      await Promise.all(workerTasks);
      await refetch();
      if (successCount > 0) {
        toast.success(
          `${successCount} parágrafo${successCount > 1 ? "s" : ""} traduzido${successCount > 1 ? "s" : ""} e aprovado${successCount > 1 ? "s" : ""}.`,
        );
      }
      if (failedCount > 0) {
        toast.error(
          `${failedCount} parágrafo${failedCount > 1 ? "s" : ""} ${failedCount > 1 ? "falharam" : "falhou"} na tradução em lote.`,
        );
      }
    } finally {
      setIsBatchTranslating(false);
    }
  }, [getParagraphStatus, handleTranslateParagraph, paragraphs, refetch]);

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
        const payload = event.payload as {
          paragraphId: string;
          progress?: number;
          currentAgent?: string;
          message?: string;
        };
        setStatus(payload.paragraphId, "translating");
        setProgress(payload.paragraphId, {
          progress: payload.progress,
          currentAgent: payload.currentAgent,
          message: payload.message,
        });
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
      if (event.type === "translation.completed") {
        const payload = event.payload as {
          paragraphId: string;
          translatedText?: string;
          reviewPackage?: Record<string, unknown> | null;
          agentOutputs?: Record<string, unknown>;
          threadId?: string;
          progress?: number;
          currentAgent?: string;
          message?: string;
        };
        if (payload.translatedText) {
          updateParagraphInCache(payload.paragraphId, (paragraph) => ({
            ...paragraph,
            translation: payload.translatedText,
          }));
          setMetaByParagraph((state) => ({
            ...state,
            [payload.paragraphId]: {
              ...state[payload.paragraphId],
              threadId: payload.threadId ?? state[payload.paragraphId]?.threadId,
              reviewPackage: payload.reviewPackage ?? state[payload.paragraphId]?.reviewPackage,
              agentOutputs: payload.agentOutputs ?? state[payload.paragraphId]?.agentOutputs,
              lastTranslation: payload.translatedText,
            },
          }));
        }
        setProgress(payload.paragraphId, {
          progress: payload.progress ?? 100,
          currentAgent: payload.currentAgent ?? "Concluido",
          message: payload.message,
        });
      }
      if (event.type === "translation.review") {
        const payload = event.payload as {
          paragraphId: string;
          translation: string;
          reviewPackage?: Record<string, unknown>;
          agentAnalysis?: Record<string, unknown>;
          suggestions?: string[];
        };
        setReviewData(
          buildReview({
            paragraphId: payload.paragraphId,
            translation: payload.translation,
            reviewPackage: payload.reviewPackage,
            agentOutputs: payload.agentAnalysis,
            suggestions: payload.suggestions,
          }),
        );
        setActiveParagraphId(payload.paragraphId);
      }
      if (event.type === "translation.approved") {
        const payload = event.payload as { paragraphId: string; translatedText?: string };
        if (payload.translatedText) {
          updateParagraphInCache(payload.paragraphId, (paragraph) => ({
            ...paragraph,
            translation: payload.translatedText,
            status: "approved",
          }));
        }
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
    <div className={cn("space-y-6", pendingReviewCount > 0 && "pb-24 sm:pb-28")}>
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
          <div className="flex gap-2 lg:hidden">
            <Button
              size="sm"
              className="flex-1"
              variant={activePanel === "original" ? "primary" : "secondary"}
              onClick={() => setActivePanel("original")}
            >
              Original
            </Button>
            <Button
              size="sm"
              className="flex-1"
              variant={activePanel === "translation" ? "primary" : "secondary"}
              onClick={() => setActivePanel("translation")}
            >
              Tradução
            </Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
            <Card
              className={`flex min-h-[360px] max-h-[calc(100vh-16rem)] flex-col gap-4 overflow-hidden sm:min-h-[420px] sm:max-h-[calc(100vh-14rem)] lg:max-h-[calc(100vh-12rem)] ${
                activePanel === "original" ? "flex" : "hidden lg:flex"
              }`}
            >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-text">Texto original</h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={handleOpenAddOriginalParagraphModal}
                >
                  Adicionar parágrafo
                </Button>
              </div>
              <Badge variant="neutral" className="shrink-0">
                {book?.sourceLanguage ?? "-"}
              </Badge>
            </div>
            <div
              ref={leftPanelRef}
              className={cn(
                "flex-1 space-y-4 overflow-y-auto pr-2 pb-6 text-sm text-text",
                pendingReviewCount > 0 && "pb-28 sm:pb-32",
              )}
            >
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
            className={`flex min-h-[360px] max-h-[calc(100vh-16rem)] flex-col gap-4 overflow-hidden sm:min-h-[420px] sm:max-h-[calc(100vh-14rem)] lg:max-h-[calc(100vh-12rem)] ${
              activePanel === "translation" ? "flex" : "hidden lg:flex"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <h3 className="text-base font-semibold text-text">Tradução</h3>
              <Badge variant="neutral" className="shrink-0">
                {book?.targetLanguage ?? "-"}
              </Badge>
            </div>
            <div
              ref={rightPanelRef}
              className={cn(
                "flex-1 space-y-4 overflow-y-auto pr-2 pb-6 text-sm text-text",
                pendingReviewCount > 0 && "pb-28 sm:pb-32",
              )}
            >
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

      <Modal
        open={isAddOriginalModalOpen}
        onClose={handleCloseAddOriginalParagraphModal}
        title="Adicionar parágrafo"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              type="button"
              onClick={handleCloseAddOriginalParagraphModal}
              disabled={isAddingOriginalParagraph}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleAddOriginalParagraph}
              loading={isAddingOriginalParagraph}
              disabled={!newOriginalParagraphText.trim()}
            >
              Adicionar
            </Button>
          </div>
        }
      >
        <Textarea
          label="Texto do novo parágrafo"
          placeholder="Digite o texto original do novo parágrafo"
          value={newOriginalParagraphText}
          onChange={(event) => setNewOriginalParagraphText(event.target.value)}
          maxLength={MAX_PARAGRAPH_TEXT_LENGTH}
          showCount
        />
      </Modal>

      <EditOriginalParagraphModal
        open={isEditOriginalModalOpen}
        value={editedOriginalText}
        onChange={(value) => {
          setEditedOriginalText(value);
          if (editOriginalError && value.trim()) {
            setEditOriginalError(undefined);
          }
        }}
        onClose={handleCloseEditOriginalModal}
        onSave={handleSaveEditedOriginal}
        loading={isSavingOriginalEdit}
        error={editOriginalError}
        maxLength={MAX_PARAGRAPH_TEXT_LENGTH}
      />

      <ConfirmDialog
        open={isConfirmEditOriginalOpen}
        title="Confirmar edição do original"
        description="Este parágrafo já possui tradução. Ao salvar, a tradução atual será removida. Deseja continuar?"
        confirmText="Salvar e limpar tradução"
        cancelText="Voltar"
        onConfirm={handleConfirmEditedOriginal}
        onClose={() => setIsConfirmEditOriginalOpen(false)}
        loading={isSavingOriginalEdit}
      />

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
