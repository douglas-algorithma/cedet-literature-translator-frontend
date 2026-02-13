"use client";

import Link from "next/link";

import {
  DndContext,
  DragEndEvent,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ChapterItem } from "@/components/chapter/ChapterItem";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Modal } from "@/components/common/Modal";
import { Button, buttonStyles } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { Input } from "@/components/common/Input";
import { Textarea } from "@/components/common/Textarea";
import { chaptersService } from "@/services/chaptersService";
import type { Chapter } from "@/types/chapter";

function SortableChapter({
  chapter,
  bookId,
  onEdit,
  onDelete,
}: {
  chapter: Chapter;
  bookId: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: chapter.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center gap-2">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-text-muted"
          {...attributes}
          {...listeners}
          aria-label="Arrastar capítulo"
        >
          ⋮⋮
        </div>
        <div className="flex-1">
          <ChapterItem chapter={chapter} bookId={bookId} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>
    </div>
  );
}

export function ChapterList({ bookId }: { bookId: string }) {
  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ["chapters", bookId],
    queryFn: () => chaptersService.listWithStats(bookId),
  });

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [editChapter, setEditChapter] = useState<Chapter | null>(null);
  const [deleteChapter, setDeleteChapter] = useState<Chapter | null>(null);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor));

  useEffect(() => {
    setChapters(data);
  }, [data]);

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!event.over) return;
    const activeId = String(event.active.id);
    const overId = String(event.over.id);
    if (activeId === overId) return;
    const oldIndex = chapters.findIndex((item) => item.id === activeId);
    const newIndex = chapters.findIndex((item) => item.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = [...chapters];
    const [moved] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, moved);
    const normalized = next.map((chapter, index) => ({
      ...chapter,
      number: index + 1,
    }));
    setChapters(normalized);

    try {
      await chaptersService.reorder(bookId, normalized);
      toast.success("Capítulos reordenados");
    } catch {
      toast.error("Não foi possível reordenar. Tentando restaurar...");
      setChapters(data);
    }
  };

  const handleSaveEdit = async () => {
    if (!editChapter) return;
    setSaving(true);
    try {
      await chaptersService.update(editChapter.id, {
        title: editChapter.title,
        number: editChapter.number,
        epigraph: editChapter.epigraph,
      });
      toast.success("Capítulo atualizado");
      setEditChapter(null);
      refetch();
    } catch {
      toast.error("Não foi possível atualizar o capítulo");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteChapter) return;
    setSaving(true);
    try {
      await chaptersService.delete(deleteChapter.id);
      toast.success("Capítulo excluído");
      setDeleteChapter(null);
      refetch();
    } catch {
      toast.error("Não foi possível excluir o capítulo");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-text-muted">Carregando capítulos...</p>;
  }

  return (
    <div className="space-y-4">
      {chapters.length === 0 ? (
        <EmptyState
          title="Nenhum capítulo cadastrado"
          description="Adicione o primeiro capítulo para iniciar o processo de tradução."
          action={
            <Link className={buttonStyles({})} href={`/books/${bookId}/chapters/new`}>
              Criar capítulo
            </Link>
          }
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={chapters.map((chapter) => chapter.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {chapters.map((chapter) => (
                <SortableChapter
                  key={chapter.id}
                  chapter={chapter}
                  bookId={bookId}
                  onEdit={() => setEditChapter(chapter)}
                  onDelete={() => setDeleteChapter(chapter)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Modal
        open={Boolean(editChapter)}
        onClose={() => setEditChapter(null)}
        title="Editar capítulo"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setEditChapter(null)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSaveEdit} loading={saving}>
              Salvar
            </Button>
          </div>
        }
      >
        {editChapter ? (
          <div className="space-y-4">
            <Input
              label="Número"
              type="number"
              value={editChapter.number}
              onChange={(event) =>
                setEditChapter({ ...editChapter, number: Number(event.target.value) })
              }
            />
            <Input
              label="Título"
              value={editChapter.title}
              onChange={(event) => setEditChapter({ ...editChapter, title: event.target.value })}
            />
            <Textarea
              label="Epígrafe"
              value={editChapter.epigraph?.text ?? ""}
              onChange={(event) =>
                setEditChapter({
                  ...editChapter,
                  epigraph: {
                    text: event.target.value,
                    author: editChapter.epigraph?.author ?? "",
                  },
                })
              }
            />
            <Input
              label="Autor da epígrafe"
              value={editChapter.epigraph?.author ?? ""}
              onChange={(event) =>
                setEditChapter({
                  ...editChapter,
                  epigraph: {
                    text: editChapter.epigraph?.text ?? "",
                    author: event.target.value,
                  },
                })
              }
            />
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteChapter)}
        title="Excluir capítulo?"
        description="Essa ação remove o capítulo permanentemente."
        confirmText="Excluir"
        isDanger
        loading={saving}
        onClose={() => setDeleteChapter(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
