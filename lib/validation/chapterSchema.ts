import { z } from "zod";

export const chapterMetaSchema = z
  .object({
    number: z
      .number({ required_error: "Informe o número do capítulo" })
      .min(1, "Número inválido"),
    title: z.string().min(1, "Título obrigatório"),
    epigraphText: z.string().optional().or(z.literal("")),
    epigraphAuthor: z.string().optional().or(z.literal("")),
  })
  .refine((data) => {
    if (data.epigraphText && data.epigraphText.trim().length > 0) {
      return Boolean(data.epigraphAuthor && data.epigraphAuthor.trim().length > 0);
    }
    return true;
  }, {
    message: "Autor da epígrafe é obrigatório",
    path: ["epigraphAuthor"],
  });

export type ChapterMetaFormValues = z.infer<typeof chapterMetaSchema>;
