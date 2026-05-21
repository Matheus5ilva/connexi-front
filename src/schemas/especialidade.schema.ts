import { z } from "zod";
import {
  MENSAGEM_TEXTO_SEM_HTML,
  validarTextoSemHtml,
} from "./texto-seguro.schema";

function textoOpcional(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const textoNormalizado = value.trim();
  return textoNormalizado.length > 0 ? textoNormalizado : undefined;
}

export const especialidadeSchema = z.object({
  nome: z
    .string()
    .trim()
    .refine(validarTextoSemHtml, MENSAGEM_TEXTO_SEM_HTML)
    .min(3, "Nome deve ter entre 3 e 60 caracteres.")
    .max(60, "Nome deve ter entre 3 e 60 caracteres."),
  descricao: z.preprocess(
    textoOpcional,
    z
      .string()
      .trim()
      .refine(validarTextoSemHtml, MENSAGEM_TEXTO_SEM_HTML)
      .min(3, "Descrição deve ter entre 3 e 255 caracteres.")
      .max(255, "Descrição deve ter entre 3 e 255 caracteres.")
      .optional(),
  ),
});

export type EspecialidadeFormularioData = z.infer<typeof especialidadeSchema>;
