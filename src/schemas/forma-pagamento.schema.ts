import { z } from "zod";
import {
  MENSAGEM_TEXTO_SEM_HTML,
  validarTextoSemHtml,
} from "./texto-seguro.schema";

function paraNumero(value: unknown): unknown {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  const numero = Number(value);
  return Number.isNaN(numero) ? value : numero;
}

function paraTextoOpcional(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const textoNormalizado = value.trim();
  return textoNormalizado.length > 0 ? textoNormalizado : undefined;
}

export const recebimentoTipoEnum = z.enum(["na_hora", "prazo"]);

export const formaPagamentoSchema = z.object({
  nome: z
    .string()
    .trim()
    .refine(validarTextoSemHtml, MENSAGEM_TEXTO_SEM_HTML)
    .min(1, "Nome é obrigatório.")
    .max(80, "Nome deve ter no máximo 80 caracteres."),
  taxaPercentual: z.preprocess(
    paraNumero,
    z
      .number({ message: "Informe uma taxa válida." })
      .min(0, "Taxa percentual deve ser maior ou igual a 0.")
      .max(100, "Taxa percentual deve ser menor ou igual a 100.")
      .refine(
        (value) => Number.isInteger(value * 100),
        "Taxa percentual deve ter no máximo 2 casas decimais.",
      ),
  ),
  recebimentoTipo: recebimentoTipoEnum,
  prazoRecebimentoDias: z.preprocess(
    paraNumero,
    z
      .number({ message: "Informe um prazo válido." })
      .int("Prazo de recebimento deve ser um número inteiro.")
      .min(1, "Prazo de recebimento deve ser de no mínimo 1 dia.")
      .max(120, "Prazo de recebimento deve ser de no máximo 120 dias.")
      .optional(),
  ),
  observacoes: z.preprocess(
    paraTextoOpcional,
    z
      .string()
      .trim()
      .refine(validarTextoSemHtml, MENSAGEM_TEXTO_SEM_HTML)
      .max(300, "Observações deve ter no máximo 300 caracteres.")
      .optional(),
  ),
});

export type FormaPagamentoFormularioData = z.infer<
  typeof formaPagamentoSchema
>;
