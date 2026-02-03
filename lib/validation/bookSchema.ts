import { z } from "zod";

const optionalText = (max: number) => z.string().max(max).optional().or(z.literal(""));

export const bookSchema = z
  .object({
    title: z.string().min(3, "Mínimo de 3 caracteres").max(200, "Máximo de 200 caracteres"),
    author: z.string().min(2, "Mínimo de 2 caracteres").max(100, "Máximo de 100 caracteres"),
    sourceLanguage: z.string().min(1, "Selecione o idioma original"),
    targetLanguage: z.string().min(1, "Selecione o idioma de destino"),
    description: optionalText(1000),
    genre: z.array(z.string()).optional(),
    translationNotes: optionalText(1000),
  })
  .refine((data) => data.sourceLanguage !== data.targetLanguage, {
    message: "O idioma de destino deve ser diferente do idioma original",
    path: ["targetLanguage"],
  });

export type BookFormValues = z.infer<typeof bookSchema>;
