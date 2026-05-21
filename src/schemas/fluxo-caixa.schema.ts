import { z } from "zod";

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

function paraOrigemTipoOpcional(value: unknown): unknown {
  if (value === "" || value === undefined || value === null) {
    return undefined;
  }

  return value;
}

export const tipoFiltroFluxoCaixaSchema = z.enum(["TODOS", "ENTRADA", "SAIDA"]);

export const statusFiltroFluxoCaixaSchema = z.enum([
  "TODOS",
  "LIQUIDADO",
  "PENDENTE",
  "ATRASADO",
]);

export const origemTipoFluxoCaixaSchema = z.enum([
  "CONTA_RECEBER",
  "CONTA_PAGAR",
]);

export const filtrosFluxoCaixaSchema = z
  .object({
    busca: z.preprocess(
      paraTextoOpcionalSemEspacos,
      z
        .string()
        .trim()
        .max(160, "A busca deve ter no máximo 160 caracteres.")
        .optional(),
    ),
    tipo: tipoFiltroFluxoCaixaSchema.default("TODOS"),
    status: statusFiltroFluxoCaixaSchema.default("TODOS"),
    dataInicio: z
      .string()
      .trim()
      .regex(DATE_REGEX, "A data inicial deve estar no formato YYYY-MM-DD.")
      .optional()
      .or(z.literal("")),
    dataFim: z
      .string()
      .trim()
      .regex(DATE_REGEX, "A data final deve estar no formato YYYY-MM-DD.")
      .optional()
      .or(z.literal("")),
    categoria: z.preprocess(
      paraTextoOpcionalSemEspacos,
      z
        .string()
        .trim()
        .max(120, "A categoria deve ter no máximo 120 caracteres.")
        .optional(),
    ),
    formaPagamentoId: z.preprocess(
      paraNumeroOpcional,
      z
        .number()
        .int()
        .positive("Selecione uma forma de pagamento válida.")
        .optional(),
    ),
    origemTipo: z.preprocess(
      paraOrigemTipoOpcional,
      origemTipoFluxoCaixaSchema.optional(),
    ),
  })
  .superRefine((value, ctx) => {
    if (value.dataInicio && value.dataFim && value.dataInicio > value.dataFim) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dataFim"],
        message: "A data final deve ser maior ou igual à data inicial.",
      });
    }
  });

export type FiltrosFluxoCaixaFormData = z.infer<typeof filtrosFluxoCaixaSchema>;
