import { z } from "zod";
import { obterDataSomenteDiaAtual } from "../domain/data-somente-dia";
import {
  MENSAGEM_TEXTO_SEM_HTML,
  validarTextoSemHtml,
} from "./texto-seguro.schema";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function paraNumeroOpcional(value: unknown): unknown {
  if (value === "" || value === undefined || value === null) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
}

function paraTextoOpcionalSemEspacos(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function paraTextoObrigatorioSemEspacos(value: unknown): unknown {
  return typeof value === "string" ? value.trim() : value;
}

const textoSeguro = (schema: z.ZodString) =>
  schema.refine(validarTextoSemHtml, MENSAGEM_TEXTO_SEM_HTML);

export const situacaoDocumentoReceberFiltroSchema = z.enum([
  "todos",
  "PREVISTO",
  "RECEBIDO",
  "ATRASADO",
  "CANCELADO",
]);

export const filtrosDocumentoReceberSchema = z.object({
  busca: z.preprocess(
    paraTextoOpcionalSemEspacos,
    z
      .string()
      .trim()
      .max(160, "A busca deve ter no máximo 160 caracteres.")
      .optional(),
  ),
  situacao: situacaoDocumentoReceberFiltroSchema.default("todos"),
  formaPagamentoId: z.preprocess(
    paraNumeroOpcional,
    z
      .number()
      .int()
      .positive("Selecione uma forma de pagamento válida.")
      .optional(),
  ),
  dataPrevistaInicio: z
    .string()
    .trim()
    .regex(DATE_REGEX, "A data inicial deve estar no formato YYYY-MM-DD.")
    .optional()
    .or(z.literal("")),
  dataPrevistaFim: z
    .string()
    .trim()
    .regex(DATE_REGEX, "A data final deve estar no formato YYYY-MM-DD.")
    .optional()
    .or(z.literal("")),
});

export const marcarDocumentoRecebidoSchema = z.object({
  dataRecebimento: z
    .string()
    .trim()
    .regex(DATE_REGEX, "A data de recebimento deve estar no formato YYYY-MM-DD.")
    .refine(
      (dataRecebimento) => dataRecebimento <= obterDataSomenteDiaAtual(),
      "A data de recebimento não pode ser futura.",
    )
    .optional()
    .or(z.literal("")),
  observacao: z.preprocess(
    paraTextoOpcionalSemEspacos,
    textoSeguro(
      z
        .string()
        .trim()
        .max(500, "A observação deve ter no máximo 500 caracteres."),
    ).optional(),
  ),
});

export const cancelarDocumentoReceberSchema = z.object({
  motivo: z.preprocess(
    paraTextoObrigatorioSemEspacos,
    textoSeguro(
      z
        .string()
        .trim()
        .min(1, "Informe o motivo do cancelamento.")
        .max(500, "O motivo deve ter no máximo 500 caracteres."),
    ),
  ),
});

export type FiltrosDocumentoReceberFormData = z.infer<
  typeof filtrosDocumentoReceberSchema
>;
export type MarcarDocumentoRecebidoFormData = z.infer<
  typeof marcarDocumentoRecebidoSchema
>;
export type CancelarDocumentoReceberFormData = z.infer<
  typeof cancelarDocumentoReceberSchema
>;
