"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { BookForm } from "@/components/book/BookForm";
import { booksService } from "@/services/booksService";
import type { BookFormValues } from "@/lib/validation";

export function NewBookForm() {
  const router = useRouter();

  const handleSubmit = async (values: BookFormValues) => {
    try {
      const book = await booksService.create({
        title: values.title,
        author: values.author,
        sourceLanguage: values.sourceLanguage,
        targetLanguage: values.targetLanguage,
        description: values.description || undefined,
        genre: values.genre,
        translationNotes: values.translationNotes || undefined,
        llmModel: values.llmModel,
        openrouterApiKey: values.openrouterApiKey?.trim(),
        status: "draft",
      });

      toast.success("Livro criado com sucesso");
      router.push(`/books/${book.id}`);
    } catch (error) {
      toast.error((error as Error).message ?? "Não foi possível criar o livro.");
    }
  };

  return <BookForm submitLabel="Criar Livro" onSubmit={handleSubmit} requireApiKey />;
}
