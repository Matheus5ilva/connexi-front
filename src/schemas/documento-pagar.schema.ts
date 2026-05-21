import { z } from "zod";
import { obterDataSomenteDiaAtual } from "../domain/data-somente-dia";
import {
  MENSAGEM_TEXTO_SEM_HTML,
  validarTextoSemHtml,
} from "./texto-seguro.schema";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function toNumber(value: unknown): unknown {
  if (value === "" || value === undefined || value === null) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
}

function toBoolean(value: unknown): unknown {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "on") {
      return true;
    }

    if (normalized === "false" || normalized === "off") {
      return false;
    }
  }

  return value;
}

function toOptionalTrimmedString(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function toRequiredTrimmedString(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  return value.trim();
}

const textoSeguro = (schema: z.ZodString) =>
  schema.refine(validarTextoSemHtml, MENSAGEM_TEXTO_SEM_HTML);

const categoriaOpcionalSchema = z.preprocess(
  toOptionalTrimmedString,
  textoSeguro(
    z.string().trim().max(120, "A categoria deve ter no máximo 120 caracteres."),
  ).optional(),
);

const observacaoOpcionalSchema = z.preprocess(
  toOptionalTrimmedString,
  textoSeguro(
    z
      .string()
      .trim()
      .max(600, "A observação deve ter no máximo 600 caracteres."),
  ).optional(),
);

export const statusDocumentoPagarFormularioSchema = z.enum([
  "PENDENTE",
  "PAGO",
]);

export const situacaoDocumentoPagarFiltroSchema = z.enum([
  "todos",
  "PENDENTE",
  "PAGO",
  "ATRASADO",
  "CANCELADO",
]);

export const documentoPagarSchema = z
  .object({
    descricao: textoSeguro(
      z
        .string()
        .trim()
        .min(3, "A descrição deve ter entre 3 e 160 caracteres.")
        .max(160, "A descrição deve ter entre 3 e 160 caracteres."),
    ),
    valor: z.preprocess(
      toNumber,
      z
        .number()
        .min(0.01, "O valor deve ser maior que zero.")
        .max(100000, "O valor deve ser de no máximo R$ 100.000,00."),
    ),
    dataVencimento: z
      .string()
      .trim()
      .min(1, "A data de vencimento é obrigatória.")
      .regex(DATE_REGEX, "A data deve estar no formato YYYY-MM-DD."),
    status: statusDocumentoPagarFormularioSchema,
    categoria: categoriaOpcionalSchema,
    observacao: observacaoOpcionalSchema,
    parcelado: z.preprocess(toBoolean, z.boolean()).default(false),
    quantidadeParcelas: z.preprocess(
      toNumber,
      z
        .number()
        .int("A quantidade de parcelas deve ser um número inteiro.")
        .min(1, "A quantidade mínima de parcelas é 1.")
        .max(60, "A quantidade máxima de parcelas é 60."),
    ),
  })
  .superRefine((value, ctx) => {
    if (value.parcelado && value.quantidadeParcelas < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["quantidadeParcelas"],
        message: "Para despesa parcelada, informe pelo menos 2 parcelas.",
      });
    }
  });

export const filtrosDocumentoPagarSchema = z.object({
  busca: z.preprocess(
    toOptionalTrimmedString,
    z
      .string()
      .trim()
      .max(160, "A busca deve ter no máximo 160 caracteres.")
      .optional(),
  ),
  situacao: situacaoDocumentoPagarFiltroSchema.default("todos"),
  categoria: categoriaOpcionalSchema,
  dataVencimentoInicio: z
    .string()
    .trim()
    .regex(DATE_REGEX, "A data inicial deve estar no formato YYYY-MM-DD.")
    .optional()
    .or(z.literal("")),
  dataVencimentoFim: z
    .string()
    .trim()
    .regex(DATE_REGEX, "A data final deve estar no formato YYYY-MM-DD.")
    .optional()
    .or(z.literal("")),
});

export const marcarDocumentoPagarPagoSchema = z.object({
  dataPagamento: z
    .string()
    .trim()
    .regex(DATE_REGEX, "A data de pagamento deve estar no formato YYYY-MM-DD.")
    .refine(
      (dataPagamento) => dataPagamento <= obterDataSomenteDiaAtual(),
      "A data de pagamento não pode ser futura.",
    )
    .optional()
    .or(z.literal("")),
  observacao: observacaoOpcionalSchema,
});

export const cancelarDocumentoPagarSchema = z.object({
  motivo: z.preprocess(
    toRequiredTrimmedString,
    textoSeguro(
      z
        .string()
        .trim()
        .min(3, "Informe um motivo com pelo menos 3 caracteres.")
        .max(500, "O motivo deve ter no máximo 500 caracteres."),
    ),
  ),
});

export type DocumentoPagarFormData = z.infer<typeof documentoPagarSchema>;
export type FiltrosDocumentoPagarFormData = z.infer<
  typeof filtrosDocumentoPagarSchema
>;
export type MarcarDocumentoPagarPagoFormData = z.infer<
  typeof marcarDocumentoPagarPagoSchema
>;
export type CancelarDocumentoPagarFormData = z.infer<
  typeof cancelarDocumentoPagarSchema
>;
