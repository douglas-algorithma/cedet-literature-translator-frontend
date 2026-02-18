"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { BookForm } from "@/components/book/BookForm";
import { Skeleton } from "@/components/common/Skeleton";
import { booksService } from "@/services/booksService";
import type { BookFormValues } from "@/lib/validation";

export function EditBookForm({ bookId }: { bookId: string }) {
  const { data: book, isLoading, error } = useQuery({
    queryKey: ["book", bookId],
    queryFn: () => booksService.get(bookId),
  });

  const handleSubmit = async (values: BookFormValues) => {
    if (!book) return;
    const normalizedApiKey = values.openrouterApiKey?.trim();
    await booksService.update(book.id, {
      title: values.title,
      author: values.author,
      sourceLanguage: values.sourceLanguage,
      targetLanguage: values.targetLanguage,
      description: values.description || undefined,
      genre: values.genre,
      translationNotes: values.translationNotes || undefined,
      llmModel: values.llmModel,
      openrouterApiKey: normalizedApiKey || undefined,
      status: book.status,
    });
    toast.success("Alterações salvas");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-36" />
      </div>
    );
  }

  if (error || !book) {
    return (
      <p className="text-sm text-danger">
        Não foi possível carregar os dados do livro. Tente novamente.
      </p>
    );
  }

  return (
    <BookForm
      submitLabel="Salvar alterações"
      initialValues={{
        title: book.title,
        author: book.author,
        sourceLanguage: book.sourceLanguage,
        targetLanguage: book.targetLanguage,
        description: book.description ?? "",
        genre: book.genre ?? [],
        translationNotes: book.translationNotes ?? "",
        llmModel: book.llmModel,
        openrouterApiKey: "",
      }}
      apiKeyMasked={book.openrouterApiKeyMasked}
      onSubmit={handleSubmit}
    />
  );
}
