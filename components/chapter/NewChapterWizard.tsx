"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Input } from "@/components/common/Input";
import { Textarea } from "@/components/common/Textarea";
import {
  clearChapterWizardSession,
  loadChapterWizardSession,
  saveChapterWizardSession,
} from "@/lib/utils/chapterWizardSession";
import { chapterMetaSchema, type ChapterMetaFormValues } from "@/lib/validation";
import { chaptersService } from "@/services/chaptersService";
import type { Chapter, ChapterPayload } from "@/types/chapter";

const steps = ["Metadados", "Modo", "Conteúdo"];

type ParagraphField = {
  id: string;
  text: string;
  blockType?: "paragraph" | "bullet";
};

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

const createParagraph = (
  text = "",
  blockType: "paragraph" | "bullet" = "paragraph",
): ParagraphField => ({
  id: createId(),
  text,
  blockType,
});

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {steps.map((label, index) => {
        const isActive = index === current;
        const isDone = index < current;
        return (
          <div
            key={label}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-widest ${
              isActive
                ? "border-brand bg-brand/10 text-brand"
                : isDone
                  ? "border-border bg-surface text-text"
                  : "border-border text-text-muted"
            }`}
          >
            <span>{index + 1}</span>
            {label}
          </div>
        );
      })}
    </div>
  );
}

function ParagraphSortable({
  paragraph,
  index,
  onChange,
  onRemove,
}: {
  paragraph: ParagraphField;
  index: number;
  onChange: (text: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: paragraph.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded-2xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-text-muted">
          {paragraph.blockType === "bullet" ? "Bullet" : "Parágrafo"} {index + 1}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-border px-2 py-1 text-xs text-text-muted"
            {...attributes}
            {...listeners}
            aria-label="Arrastar parágrafo"
          >
            ⋮⋮
          </button>
          <button
            type="button"
            className="rounded-full border border-border px-2 py-1 text-xs text-danger"
            onClick={onRemove}
          >
            Remover
          </button>
        </div>
      </div>
      <Textarea
        value={paragraph.text}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Texto do parágrafo"
      />
    </div>
  );
}

export function NewChapterWizard({ bookId }: { bookId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"paragraph" | "bulk" | null>(null);
  const [modeLocked, setModeLocked] = useState(false);
  const [chapterId, setChapterId] = useState<string | null>(null);
  const [createdMode, setCreatedMode] = useState<"paragraph" | "bulk" | null>(null);
  const [paragraphs, setParagraphs] = useState<ParagraphField[]>([createParagraph()]);
  const [bulkText, setBulkText] = useState("");
  const [bulkParagraphs, setBulkParagraphs] = useState<ParagraphField[]>([]);
  const [parsingBulk, setParsingBulk] = useState(false);
  const [saving, setSaving] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor));

  const { data: chapters = [] } = useQuery({
    queryKey: ["chapters", bookId],
    queryFn: () => chaptersService.list(bookId),
  });

  const suggestedNumber = useMemo(() => {
    if (!chapters.length) return 1;
    return Math.max(...chapters.map((item) => item.number)) + 1;
  }, [chapters]);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, dirtyFields },
    setValue,
    watch,
  } = useForm<ChapterMetaFormValues>({
    resolver: zodResolver(chapterMetaSchema),
    mode: "onChange",
    defaultValues: {
      number: suggestedNumber,
      title: "",
      epigraphText: "",
      epigraphAuthor: "",
    },
  });

  const watchedNumber = watch("number");
  const watchedTitle = watch("title");
  const watchedEpigraphText = watch("epigraphText");
  const watchedEpigraphAuthor = watch("epigraphAuthor");

  useEffect(() => {
    if (!dirtyFields.number) {
      setValue("number", suggestedNumber, { shouldValidate: true });
    }
  }, [dirtyFields.number, setValue, suggestedNumber]);

  const handleMetaSubmit = () => {
    setStep(1);
  };

  const resetDraftContent = () => {
    setParagraphs([createParagraph()]);
    setBulkText("");
    setBulkParagraphs([]);
  };

  const clearWizardState = () => {
    clearChapterWizardSession(bookId);
  };

  const buildChapterPayload = (selectedMode: "paragraph" | "bulk"): ChapterPayload => ({
    bookId,
    number: typeof watchedNumber === "number" && Number.isFinite(watchedNumber) ? watchedNumber : suggestedNumber,
    title: watchedTitle ?? "",
    status: "pending",
    insertionMode: selectedMode,
    epigraph: watchedEpigraphText
      ? {
          text: watchedEpigraphText,
          author: watchedEpigraphAuthor ?? "",
        }
      : undefined,
  });

  const applyCreatedChapter = (chapter: Chapter, selectedMode: "paragraph" | "bulk") => {
    updateChaptersCache(chapter);
    setChapterId(chapter.id);
    setCreatedMode(selectedMode);
    setModeLocked(true);
    setStep(2);
  };

  const createChapterForMode = async (selectedMode: "paragraph" | "bulk") => {
    const chapter = await chaptersService.create(bookId, buildChapterPayload(selectedMode));
    applyCreatedChapter(chapter, selectedMode);
  };

  const deleteChapterInProgress = async (targetChapterId: string) => {
    await chaptersService.delete(targetChapterId);
    removeChapterFromCache(targetChapterId);
    refreshChaptersCache();
  };

  const handleContinueFromMode = async () => {
    if (!mode) return;
    setSaving(true);
    try {
      if (chapterId && createdMode && mode === createdMode) {
        setModeLocked(true);
        setStep(2);
        return;
      }
      if (chapterId) {
        await deleteChapterInProgress(chapterId);
        setChapterId(null);
        setCreatedMode(null);
        resetDraftContent();
      }
      await createChapterForMode(mode);
    } catch (error) {
      toast.error((error as Error).message ?? "Não foi possível preparar o capítulo.");
    } finally {
      setSaving(false);
    }
  };

  const handleBackFromContent = () => {
    setModeLocked(false);
    setStep(1);
  };

  const handleCancelWizard = async () => {
    setCanceling(true);
    try {
      if (chapterId) {
        await deleteChapterInProgress(chapterId);
      }
      clearWizardState();
      router.push(`/books/${bookId}`);
    } catch (error) {
      toast.error((error as Error).message ?? "Não foi possível cancelar a criação do capítulo.");
    } finally {
      setCanceling(false);
    }
  };

  useEffect(() => {
    let active = true;

    const restore = async () => {
      const saved = loadChapterWizardSession(bookId);
      if (!saved) {
        if (active) {
          setSessionReady(true);
        }
        return;
      }

      if (saved.chapterId) {
        try {
          await chaptersService.get(saved.chapterId);
        } catch {
          clearWizardState();
          if (!active) {
            return;
          }
          resetDraftContent();
          setStep(0);
          setMode(null);
          setModeLocked(false);
          setChapterId(null);
          setCreatedMode(null);
          setValue("number", suggestedNumber, { shouldValidate: true });
          setValue("title", "", { shouldValidate: true });
          setValue("epigraphText", "", { shouldValidate: true });
          setValue("epigraphAuthor", "", { shouldValidate: true });
          setSessionReady(true);
          return;
        }
      }

      if (!active) {
        return;
      }

      const restoredStep = saved.step === 2 && !saved.mode ? 1 : saved.step;

      setStep(restoredStep);
      setMode(saved.mode);
      setModeLocked(saved.modeLocked);
      setChapterId(saved.chapterId);
      setCreatedMode(saved.createdMode ?? saved.mode);
      setParagraphs(saved.paragraphs.length ? saved.paragraphs : [createParagraph()]);
      setBulkText(saved.bulkText);
      setBulkParagraphs(saved.bulkParagraphs);
      setValue("number", saved.meta.number, { shouldValidate: true, shouldDirty: true });
      setValue("title", saved.meta.title, { shouldValidate: true, shouldDirty: true });
      setValue("epigraphText", saved.meta.epigraphText, { shouldValidate: true, shouldDirty: true });
      setValue("epigraphAuthor", saved.meta.epigraphAuthor, { shouldValidate: true, shouldDirty: true });
      setSessionReady(true);
    };

    void restore();

    return () => {
      active = false;
    };
  }, [bookId, setValue, suggestedNumber]);

  useEffect(() => {
    if (!sessionReady) {
      return;
    }

    saveChapterWizardSession(bookId, {
      version: 1,
      step,
      mode,
      modeLocked,
      chapterId,
      createdMode,
      meta: {
        number:
          typeof watchedNumber === "number" && Number.isFinite(watchedNumber) && watchedNumber > 0
            ? watchedNumber
            : suggestedNumber,
        title: watchedTitle ?? "",
        epigraphText: watchedEpigraphText ?? "",
        epigraphAuthor: watchedEpigraphAuthor ?? "",
      },
      paragraphs,
      bulkText,
      bulkParagraphs,
    });
  }, [
    bookId,
    bulkParagraphs,
    bulkText,
    chapterId,
    createdMode,
    mode,
    modeLocked,
    paragraphs,
    sessionReady,
    step,
    suggestedNumber,
    watchedEpigraphAuthor,
    watchedEpigraphText,
    watchedNumber,
    watchedTitle,
  ]);

  const handleAddParagraph = () => {
    setParagraphs((current) => [...current, createParagraph()]);
  };

  const handleRemoveParagraph = (id: string) => {
    setParagraphs((current) => (current.length === 1 ? current : current.filter((p) => p.id !== id)));
  };

  const handleParagraphDrag = (event: DragEndEvent) => {
    if (!event.over) return;
    const activeId = String(event.active.id);
    const overId = String(event.over.id);
    if (activeId === overId) return;
    const oldIndex = paragraphs.findIndex((item) => item.id === activeId);
    const newIndex = paragraphs.findIndex((item) => item.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = [...paragraphs];
    const [moved] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, moved);
    setParagraphs(next);
  };

  const handleBulkParagraphDrag = (event: DragEndEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : undefined;
    if (!overId || activeId === overId) return;
    const oldIndex = bulkParagraphs.findIndex((item) => item.id === activeId);
    const newIndex = bulkParagraphs.findIndex((item) => item.id === overId);
    const next = [...bulkParagraphs];
    const [moved] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, moved);
    setBulkParagraphs(next);
  };

  const handleParseBulkText = async () => {
    if (!bulkText.trim()) {
      toast.error("Cole o texto completo do capítulo");
      return;
    }
    setParsingBulk(true);
    try {
      const parsed = await chaptersService.parseParagraphPreview(bulkText);
      setBulkParagraphs(parsed.map((item) => createParagraph(item.text, item.blockType)));
      if (!parsed.length) {
        toast.message("Nenhum parágrafo identificado.");
      }
    } catch (error) {
      toast.error((error as Error).message ?? "Erro ao analisar o texto");
    } finally {
      setParsingBulk(false);
    }
  };

  const saveParagraphMode = async () => {
    if (!chapterId) return;
    const cleaned = paragraphs.map((p) => p.text.trim()).filter(Boolean);
    if (!cleaned.length) {
      toast.error("Insira ao menos um parágrafo");
      return;
    }

    setSaving(true);
    try {
      for (let i = 0; i < cleaned.length; i += 1) {
        await chaptersService.addParagraph(chapterId, cleaned[i], i + 1);
      }
      handlePostSave();
    } catch (error) {
      toast.error((error as Error).message ?? "Erro ao salvar parágrafos");
    } finally {
      setSaving(false);
    }
  };

  const saveBulkMode = async () => {
    if (!chapterId) return;
    if (!bulkText.trim()) {
      toast.error("Cole o texto completo do capítulo");
      return;
    }
    setSaving(true);
    try {
      let source = bulkParagraphs;
      if (!source.length) {
        const parsed = await chaptersService.parseParagraphPreview(bulkText);
        source = parsed.map((item) => createParagraph(item.text, item.blockType));
      }
      const cleaned = source
        .map((item) => ({ text: item.text.trim(), blockType: item.blockType }))
        .filter((item) => item.text.length > 0);
      if (!cleaned.length) {
        toast.error("Nenhum parágrafo válido para salvar");
        return;
      }
      await chaptersService.bulkInsert(chapterId, cleaned);
      handlePostSave();
    } catch (error) {
      toast.error((error as Error).message ?? "Erro ao salvar capítulo");
    } finally {
      setSaving(false);
    }
  };

  const handlePostSave = () => {
    clearWizardState();
    refreshChaptersCache();
    toast.success("Capítulo criado", {
      action: {
        label: "Ir para tradução",
        onClick: () =>
          chapterId ? router.push(`/books/${bookId}/chapters/${chapterId}`) : undefined,
      },
      cancel: {
        label: "Adicionar outro",
        onClick: () => router.push(`/books/${bookId}/chapters/new`),
      },
    });
    router.push(`/books/${bookId}`);
  };

  const updateChaptersCache = (chapter: Chapter) => {
    queryClient.setQueryData<Chapter[]>(["chapters", bookId], (current = []) => {
      if (current.some((item) => item.id === chapter.id)) {
        return current;
      }
      const next = [...current, chapter];
      return next.sort((a, b) => a.number - b.number);
    });
  };

  const removeChapterFromCache = (targetChapterId: string) => {
    queryClient.setQueryData<Chapter[]>(["chapters", bookId], (current = []) =>
      current.filter((item) => item.id !== targetChapterId),
    );
  };

  const refreshChaptersCache = () => {
    queryClient.invalidateQueries({ queryKey: ["chapters", bookId] });
  };

  const renderStep = () => {
    if (step === 0) {
      return (
        <form onSubmit={handleSubmit(handleMetaSubmit)} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Número do capítulo"
              type="number"
              error={errors.number?.message}
              {...register("number", { valueAsNumber: true })}
            />
            <Input
              label="Título do capítulo"
              error={errors.title?.message}
              {...register("title")}
            />
          </div>

          <details className="rounded-2xl border border-border bg-surface p-4">
            <summary className="cursor-pointer text-sm font-semibold text-text">
              Epígrafe (opcional)
            </summary>
            <div className="mt-4 space-y-4">
              <Textarea
                label="Texto da epígrafe"
                error={errors.epigraphText?.message}
                {...register("epigraphText")}
              />
              <Input
                label="Autor da epígrafe"
                error={errors.epigraphAuthor?.message}
                {...register("epigraphAuthor")}
              />
            </div>
          </details>

          <div className="flex justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancelWizard}
              disabled={saving}
              loading={canceling}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid || saving || canceling}>
              Continuar
            </Button>
          </div>
        </form>
      );
    }

    if (step === 1) {
      return (
        <div className="space-y-6">
          <Card className="space-y-3 border border-brand/30 bg-brand/5">
            <p className="text-sm font-semibold text-text">
              Você pode voltar e trocar o modo. Se trocar, o capítulo em andamento será recriado e os
              rascunhos de conteúdo serão reiniciados.
            </p>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                value: "paragraph",
                title: "Parágrafo a parágrafo",
                description:
                  "Insira cada parágrafo individualmente. Recomendado para textos formatados ou quando precisar de controle granular.",
              },
              {
                value: "bulk",
                title: "Texto completo",
                description:
                  "Cole todo o texto do capítulo de uma vez. O sistema dividirá automaticamente em parágrafos.",
              },
            ].map((option) => {
              const selected = mode === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`rounded-3xl border p-5 text-left transition ${
                    selected
                      ? "border-brand bg-brand/10"
                      : "border-border bg-surface hover:border-brand/50"
                  }`}
                  onClick={() => setMode(option.value as "paragraph" | "bulk")}
                >
                  <h3 className="text-base font-semibold text-text">{option.title}</h3>
                  <p className="mt-2 text-sm text-text-muted">{option.description}</p>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                type="button"
                onClick={handleCancelWizard}
                disabled={saving}
                loading={canceling}
              >
                Cancelar
              </Button>
              <Button variant="ghost" type="button" onClick={() => setStep(0)} disabled={saving || canceling}>
                Voltar
              </Button>
            </div>
            <Button
              type="button"
              disabled={!mode || canceling}
              onClick={handleContinueFromMode}
              loading={saving}
            >
              Continuar
            </Button>
          </div>
        </div>
      );
    }

    if (mode === "paragraph") {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-text">
              {paragraphs.length} parágrafo(s)
            </p>
            <Button type="button" variant="outline" onClick={handleAddParagraph}>
              Adicionar parágrafo
            </Button>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleParagraphDrag}>
            <SortableContext items={paragraphs.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {paragraphs.map((paragraph, index) => (
                  <ParagraphSortable
                    key={paragraph.id}
                    paragraph={paragraph}
                    index={index}
                    onChange={(text) =>
                      setParagraphs((current) =>
                        current.map((item) => (item.id === paragraph.id ? { ...item, text } : item)),
                      )
                    }
                    onRemove={() => handleRemoveParagraph(paragraph.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="flex justify-between">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                type="button"
                onClick={handleCancelWizard}
                disabled={saving}
                loading={canceling}
              >
                Cancelar
              </Button>
              <Button variant="ghost" type="button" onClick={handleBackFromContent} disabled={saving || canceling}>
                Voltar
              </Button>
            </div>
            <Button type="button" onClick={saveParagraphMode} loading={saving} disabled={canceling}>
              Salvar capítulo
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Textarea
          label="Texto completo"
          placeholder="Cole o texto completo do capítulo. O parser aceita quebra com Enter simples e preserva bullets."
          value={bulkText}
          onChange={(event) => {
            setBulkText(event.target.value);
            setBulkParagraphs([]);
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={handleParseBulkText} loading={parsingBulk}>
            Analisar e separar parágrafos
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setBulkParagraphs((current) => [...current, createParagraph("")])}
          >
            Adicionar parágrafo manual
          </Button>
        </div>
        <div className="rounded-3xl border border-border bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
            Preview editável ({bulkParagraphs.length} parágrafos)
          </p>
          {bulkParagraphs.length === 0 ? (
            <p className="mt-3 text-sm text-text-muted">
              Execute a análise para revisar, mover, editar e remover parágrafos antes de salvar.
            </p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleBulkParagraphDrag}>
              <SortableContext items={bulkParagraphs.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                <div className="mt-4 space-y-3 text-sm text-text">
                  {bulkParagraphs.map((paragraph, index) => (
                    <ParagraphSortable
                      key={paragraph.id}
                      paragraph={paragraph}
                      index={index}
                      onChange={(text) =>
                        setBulkParagraphs((current) =>
                          current.map((item) => (item.id === paragraph.id ? { ...item, text } : item)),
                        )
                      }
                      onRemove={() =>
                        setBulkParagraphs((current) =>
                          current.length === 1 ? current : current.filter((item) => item.id !== paragraph.id),
                        )
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
        <div className="flex justify-between">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              type="button"
              onClick={handleCancelWizard}
              disabled={saving}
              loading={canceling}
            >
              Cancelar
            </Button>
            <Button variant="ghost" type="button" onClick={handleBackFromContent} disabled={saving || canceling}>
              Voltar
            </Button>
          </div>
          <Button type="button" onClick={saveBulkMode} loading={saving} disabled={canceling}>
            Salvar capítulo
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <Stepper current={step} />
      {renderStep()}
    </div>
  );
}
