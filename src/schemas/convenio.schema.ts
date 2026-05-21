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

function toOptionalTrimmedString(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

export const abrangenciaConvenioEnum = z.enum([
  "Nacional",
  "Regional",
  "Municipal",
]);

export const formularioConvenioSchema = z.object({
  nome: z
    .string()
    .trim()
    .refine(validarTextoSemHtml, MENSAGEM_TEXTO_SEM_HTML)
    .min(3, "Nome deve ter entre 3 e 100 caracteres.")
    .max(100, "Nome deve ter entre 3 e 100 caracteres."),
  cnpj: z
    .string()
    .trim()
    .refine((value) => /^[0-9./-]*$/.test(value), {
      message: "CNPJ deve conter apenas números e pontuação válida.",
    })
    .refine((value) => value.replace(/\D/g, "").length <= 14, {
      message: "CNPJ deve ter no máximo 14 caracteres.",
    }),
  ativo: z.boolean(),
  diasPagamento: z.preprocess(
    toNumber,
    z.number({ message: "Informe um número válido." }).finite().optional(),
  ),
  abrangencia: abrangenciaConvenioEnum,
  telefone: z
    .string()
    .trim()
    .min(1, "Telefone é obrigatório.")
    .max(15, "Telefone deve ter no máximo 15 caracteres."),
  whatsapp: z.preprocess(
    toOptionalTrimmedString,
    z
      .string()
      .trim()
      .max(15, "WhatsApp deve ter no máximo 15 caracteres.")
      .optional(),
  ),
  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .max(100, "E-mail deve ter no máximo 100 caracteres."),
});

export type ConvenioFormularioData = z.infer<typeof formularioConvenioSchema>;
