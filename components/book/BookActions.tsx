"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { booksService } from "@/services/booksService";
import { cn } from "@/lib/utils";

export function BookActions({ bookId, onDeleted }: { bookId: string; onDeleted?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await booksService.delete(bookId);
      toast.success("Livro excluído com sucesso");
      onDeleted?.();
      setIsOpen(false);
    } catch (error) {
      toast.error((error as Error).message ?? "Não foi possível excluir o livro.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative">
      <details className="group">
        <summary
          className={cn(
            "flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border text-text-muted transition hover:text-text",
          )}
          aria-label="Ações do livro"
        >
          <span className="text-lg leading-none">⋯</span>
        </summary>
        <div className="absolute right-0 top-11 z-10 w-44 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-surface p-2 shadow-[var(--shadow-soft)]">
          <Link className={cn("block rounded-xl px-3 py-2 text-sm hover:bg-surface-muted")}
            href={`/books/${bookId}/edit`}
          >
            Editar
          </Link>
          <button
            type="button"
            className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-surface-muted"
            onClick={() => toast.message("Duplicação disponível em breve")}
          >
            Duplicar
          </button>
          <button
            type="button"
            className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-surface-muted"
            onClick={() => toast.message("Arquivamento disponível em breve")}
          >
            Arquivar
          </button>
          <button
            type="button"
            className="w-full rounded-xl px-3 py-2 text-left text-sm text-danger hover:bg-danger/10"
            onClick={(event) => {
              event.preventDefault();
              setIsOpen(true);
            }}
          >
            Excluir
          </button>
        </div>
      </details>

      <ConfirmDialog
        open={isOpen}
        title="Excluir livro?"
        description="Essa ação remove o livro permanentemente e não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        isDanger
        loading={isDeleting}
        onClose={() => setIsOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
