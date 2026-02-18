import { z } from "zod";

const optionalText = (max: number) => z.string().max(max).optional().or(z.literal(""));
const llmModelSchema = z.enum([
  "openai/gpt-4.1",
  "openai/gpt-4.1-mini",
  "anthropic/claude-sonnet-4.6",
]);

const bookBaseSchema = z
  .object({
    title: z.string().min(3, "Mínimo de 3 caracteres").max(200, "Máximo de 200 caracteres"),
    author: z.string().min(2, "Mínimo de 2 caracteres").max(100, "Máximo de 100 caracteres"),
    sourceLanguage: z.string().min(1, "Selecione o idioma original"),
    targetLanguage: z.string().min(1, "Selecione o idioma de destino"),
    description: optionalText(1000),
    genre: z.array(z.string()).optional(),
    translationNotes: optionalText(1000),
    llmModel: llmModelSchema.default("openai/gpt-4.1"),
    openrouterApiKey: z.string().max(512).optional().or(z.literal("")),
  })
  .refine((data) => data.sourceLanguage !== data.targetLanguage, {
    message: "O idioma de destino deve ser diferente do idioma original",
    path: ["targetLanguage"],
  });

export const bookSchema = bookBaseSchema;
export const bookCreateSchema = bookBaseSchema.refine(
  (data) => Boolean(data.openrouterApiKey?.trim()),
  {
    message: "Informe a chave OpenRouter",
    path: ["openrouterApiKey"],
  },
);

export type BookFormValues = z.infer<typeof bookSchema>;
