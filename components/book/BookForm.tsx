"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/common/Button";
import { ComboBox } from "@/components/common/ComboBox";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { Textarea } from "@/components/common/Textarea";
import { GENRE_OPTIONS, LANGUAGE_OPTIONS, LLM_MODEL_OPTIONS } from "@/config/books";
import { cn } from "@/lib/utils";
import { bookCreateSchema, bookSchema, type BookFormValues } from "@/lib/validation";

const defaultValues: BookFormValues = {
  title: "",
  author: "",
  sourceLanguage: "",
  targetLanguage: "",
  description: "",
  genre: [],
  translationNotes: "",
  llmModel: "openai/gpt-4.1",
  openrouterApiKey: "",
};

export function BookForm({
  initialValues,
  onSubmit,
  submitLabel,
  loading,
  requireApiKey = false,
  apiKeyMasked,
}: {
  initialValues?: Partial<BookFormValues>;
  submitLabel: string;
  loading?: boolean;
  requireApiKey?: boolean;
  apiKeyMasked?: string;
  onSubmit: (values: BookFormValues) => Promise<void>;
}) {
  const formDefaults = useMemo(
    () => ({ ...defaultValues, ...initialValues }),
    [initialValues],
  );
  const schema = useMemo(
    () => (requireApiKey ? bookCreateSchema : bookSchema),
    [requireApiKey],
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid, isSubmitting },
    setValue,
  } = useForm<BookFormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: formDefaults,
  });

  const genreSelection = useWatch({ control, name: "genre" }) ?? [];
  const [customGenre, setCustomGenre] = useState("");

  const languageOptions = LANGUAGE_OPTIONS.map((language) => ({
    label: language,
    value: language,
  }));
  const modelOptions = LLM_MODEL_OPTIONS.map((model) => ({
    label: model.label,
    value: model.value,
  }));
  const apiKeyHint = apiKeyMasked
    ? `Chave atual: ${apiKeyMasked}. Deixe em branco para manter.`
    : requireApiKey
      ? "Informe a chave OpenRouter deste livro."
      : "Deixe em branco para manter a chave atual.";

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

      <div className="grid gap-4 md:grid-cols-2">
        <Select
          label="Modelo LLM"
          options={modelOptions}
          error={errors.llmModel?.message}
          {...register("llmModel")}
        />
        <Input
          label="OpenRouter API Key"
          type="password"
          autoComplete="off"
          required={requireApiKey}
          placeholder={requireApiKey ? "sk-or-v1-..." : "Deixe em branco para manter"}
          error={errors.openrouterApiKey?.message}
          hint={apiKeyHint}
          {...register("openrouterApiKey")}
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
        placeholder="Use este campo para orientar a tradução quando quiser mais controle de estilo. Exemplos: tom (formal ou coloquial), público-alvo, termos que não devem ser traduzidos, preferências de adaptação cultural e nível de regionalismo."
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
