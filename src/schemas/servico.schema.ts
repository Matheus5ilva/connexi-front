import { z } from "zod";
import {
  MENSAGEM_TEXTO_SEM_HTML,
  validarTextoSemHtml,
} from "./texto-seguro.schema";

function toNumber(value: unknown): unknown {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
}

const convenioServicoSchema = z.object({
  convenioId: z.number().int().positive(),
  valor: z.preprocess(
    toNumber,
    z
      .number()
      .min(0, "O valor do convênio não pode ser negativo.")
      .refine(
        (value) => Number.isInteger(value * 100),
        "O valor do convênio deve ter no máximo 2 casas decimais.",
      ),
  ),
});

export const formularioServicoSchema = z
  .object({
    nome: z
      .string()
      .trim()
      .refine(validarTextoSemHtml, MENSAGEM_TEXTO_SEM_HTML)
      .min(3, "Nome deve ter entre 3 e 100 caracteres.")
      .max(100, "Nome deve ter entre 3 e 100 caracteres."),
    valorParticular: z.preprocess(
      toNumber,
      z
        .number({ message: "Informe um valor particular válido." })
        .refine(
          (value) => Number.isInteger(value * 100),
          "O valor particular deve ter no máximo 2 casas decimais.",
        ),
    ),
    ativo: z.boolean(),
    descricao: z
      .string()
      .trim()
      .refine(validarTextoSemHtml, MENSAGEM_TEXTO_SEM_HTML)
      .max(500, "Descrição deve ter no máximo 500 caracteres."),
    convenios: z.array(convenioServicoSchema).optional().default([]),
  })
  .superRefine((value, context) => {
    const ids = new Set<number>();

    value.convenios.forEach((item, index) => {
      if (ids.has(item.convenioId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Convênios não podem se repetir no formulário.",
          path: ["convenios", index, "convenioId"],
        });
        return;
      }

      ids.add(item.convenioId);
    });
  });

export type ServicoFormularioData = z.infer<typeof formularioServicoSchema>;
