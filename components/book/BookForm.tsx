"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/common/Button";
import { ComboBox } from "@/components/common/ComboBox";
import { Input } from "@/components/common/Input";
import { Textarea } from "@/components/common/Textarea";
import { GENRE_OPTIONS, LANGUAGE_OPTIONS } from "@/config/books";
import { cn } from "@/lib/utils";
import { bookSchema, type BookFormValues } from "@/lib/validation";

const defaultValues: BookFormValues = {
  title: "",
  author: "",
  sourceLanguage: "",
  targetLanguage: "",
  description: "",
  genre: [],
  translationNotes: "",
};

export function BookForm({
  initialValues,
  onSubmit,
  submitLabel,
  loading,
}: {
  initialValues?: Partial<BookFormValues>;
  submitLabel: string;
  loading?: boolean;
  onSubmit: (values: BookFormValues) => Promise<void>;
}) {
  const formDefaults = useMemo(
    () => ({ ...defaultValues, ...initialValues }),
    [initialValues],
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid, isSubmitting },
    setValue,
  } = useForm<BookFormValues>({
    resolver: zodResolver(bookSchema),
    mode: "onChange",
    defaultValues: formDefaults,
  });

  const genreSelection = useWatch({ control, name: "genre" }) ?? [];
  const [customGenre, setCustomGenre] = useState("");

  const languageOptions = LANGUAGE_OPTIONS.map((language) => ({
    label: language,
    value: language,
  }));

  const toggleGenre = (value: string) => {
    const exists = genreSelection.includes(value);
    const next = exists
      ? genreSelection.filter((item) => item !== value)
      : [...genreSelection, value];
    setValue("genre", next, { shouldValidate: true });
  };

  const addCustomGenre = () => {
    const normalized = customGenre.trim();
    if (!normalized) return;
    if (genreSelection.includes(normalized)) {
      setCustomGenre("");
      return;
    }
    setValue("genre", [...genreSelection, normalized], { shouldValidate: true });
    setCustomGenre("");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Título do Livro"
          placeholder="Ex: O nome do vento"
          error={errors.title?.message}
          {...register("title")}
        />
        <Input
          label="Autor"
          placeholder="Ex: Patrick Rothfuss"
          error={errors.author?.message}
          {...register("author")}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ComboBox
          label="Idioma Original"
          placeholder="Selecione"
          options={languageOptions}
          error={errors.sourceLanguage?.message}
          {...register("sourceLanguage")}
        />
        <ComboBox
          label="Idioma de Destino"
          placeholder="Selecione"
          options={languageOptions}
          error={errors.targetLanguage?.message}
          {...register("targetLanguage")}
        />
      </div>

      <Textarea
        label="Descrição"
        placeholder="Contexto, notas ou observações sobre a obra"
        error={errors.description?.message}
        showCount
        maxLength={1000}
        {...register("description")}
      />

      <div>
        <p className="text-sm font-medium text-text">Gênero/Categoria</p>
        <p className="text-xs text-text-muted">Selecione um ou mais gêneros</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {GENRE_OPTIONS.map((genre) => {
            const active = genreSelection.includes(genre);
            return (
              <button
                key={genre}
                type="button"
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition",
                  active
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-border bg-surface text-text-muted hover:text-text",
                )}
                onClick={() => toggleGenre(genre)}
              >
                {genre}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            value={customGenre}
            onChange={(event) => setCustomGenre(event.target.value)}
            placeholder="Adicionar categoria personalizada"
          />
          <Button type="button" variant="outline" onClick={addCustomGenre}>
            Adicionar
          </Button>
        </div>
      </div>

      <Textarea
        label="Notas para Tradução"
        placeholder="Instruções específicas sobre tom, público-alvo ou adaptações"
        error={errors.translationNotes?.message}
        showCount
        maxLength={1000}
        {...register("translationNotes")}
      />

      <div className="flex justify-end">
        <Button type="submit" disabled={!isValid || isSubmitting || loading} loading={isSubmitting || loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
