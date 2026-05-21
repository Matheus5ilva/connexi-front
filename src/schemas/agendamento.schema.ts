import { z } from "zod";
import {
  MENSAGEM_TEXTO_SEM_HTML,
  validarTextoSemHtml,
} from "./texto-seguro.schema";

function vazioParaUndefined(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return value;
}

function numeroObrigatorio(message: string) {
  return z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }

    const convertido = Number(value);
    return Number.isNaN(convertido) ? value : convertido;
  }, z.number().int().positive(message));
}

function numeroOpcional() {
  return z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }

    const convertido = Number(value);
    return Number.isNaN(convertido) ? value : convertido;
  }, z.number().int().positive().optional());
}

const dataAgendamentoSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data no formato YYYY-MM-DD.");

const horarioAgendamentoSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Informe o horário no formato HH:mm.");

const tipoAtendimentoSchema = z.enum(["PARTICULAR", "CONVENIO"]);
const tipoConsultaSchema = z.enum([
  "Consulta",
  "Retorno",
  "Primeira Vez",
  "Urgência",
]);

const observacaoAgendamentoSchema = z.preprocess(
  vazioParaUndefined,
  z
    .string()
    .trim()
    .refine(validarTextoSemHtml, MENSAGEM_TEXTO_SEM_HTML)
    .max(2000, "A observação deve ter no máximo 2000 caracteres.")
    .optional(),
);

export const formularioAgendamentoSchema = z
  .object({
    pacienteId: numeroObrigatorio("Selecione um paciente."),
    data: dataAgendamentoSchema,
    horario: horarioAgendamentoSchema,
    duracaoMinutos: z
      .number()
      .int("Informe uma duração válida.")
      .min(5, "A duração mínima é de 5 minutos.")
      .max(240, "A duração máxima é de 240 minutos."),
    tipoAtendimento: tipoAtendimentoSchema,
    convenioId: numeroOpcional(),
    servicoId: numeroObrigatorio("Selecione um serviço."),
    formaPagamentoId: numeroOpcional(),
    tipoConsulta: z.preprocess(vazioParaUndefined, tipoConsultaSchema.optional()),
    observacao: observacaoAgendamentoSchema,
  })
  .superRefine((value, ctx) => {
    if (value.tipoAtendimento === "CONVENIO" && !value.convenioId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["convenioId"],
        message: "Selecione o convênio para este atendimento.",
      });
    }
  });

export const formularioRemarcacaoAgendamentoSchema = z
  .object({
    data: dataAgendamentoSchema,
    horario: horarioAgendamentoSchema,
    duracaoMinutos: z
      .number()
      .int("Informe uma duração válida.")
      .min(5, "A duração mínima é de 5 minutos.")
      .max(240, "A duração máxima é de 240 minutos."),
    tipoAtendimento: tipoAtendimentoSchema,
    convenioId: numeroOpcional(),
    formaPagamentoId: numeroOpcional(),
    tipoConsulta: z.preprocess(vazioParaUndefined, tipoConsultaSchema.optional()),
    observacao: observacaoAgendamentoSchema,
  })
  .superRefine((value, ctx) => {
    if (value.tipoAtendimento === "CONVENIO" && !value.convenioId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["convenioId"],
        message: "Selecione o convênio para este atendimento.",
      });
    }
  });

export type AgendamentoFormularioData = z.infer<
  typeof formularioAgendamentoSchema
>;
export type RemarcacaoAgendamentoFormularioData = z.infer<
  typeof formularioRemarcacaoAgendamentoSchema
>;
