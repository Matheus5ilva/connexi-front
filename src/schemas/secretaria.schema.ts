import { z } from "zod";
import {
  MENSAGEM_TEXTO_SEM_HTML,
  validarTextoSemHtml,
} from "./texto-seguro.schema";

function paraNumeroOpcional(value: unknown): unknown {
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

  const texto = value.trim();
  return texto.length > 0 ? texto : undefined;
}

const textoSeguro = (schema: z.ZodString) =>
  schema.refine(validarTextoSemHtml, MENSAGEM_TEXTO_SEM_HTML);

export const senhaProvisoriaSecretariaFormularioSchema = z
  .string()
  .trim()
  .min(6, "Senha provisória deve ter no mínimo 6 caracteres.")
  .max(120, "Senha provisória deve ter no máximo 120 caracteres.")
  .regex(/(?=.*[A-Za-z])(?=.*\d)/, {
    message: "Senha provisória deve conter letras e números.",
  });

export const secretariaFormularioSchema = z.object({
  nome: textoSeguro(z.string().trim().min(3).max(100)),
  telefone: z.string().trim().min(1).max(15),
  whatsapp: z.preprocess(
    paraTextoOpcional,
    z.string().trim().max(15).optional(),
  ),
  email: z.string().trim().toLowerCase().email().max(100),
  logradouro: z.preprocess(
    paraTextoOpcional,
    textoSeguro(z.string().trim().max(128)).optional(),
  ),
  numero: z.preprocess(paraNumeroOpcional, z.number().int().optional()),
  complemento: z.preprocess(
    paraTextoOpcional,
    textoSeguro(z.string().trim().max(100)).optional(),
  ),
  bairro: z.preprocess(
    paraTextoOpcional,
    textoSeguro(z.string().trim().max(100)).optional(),
  ),
  nomeCidade: z.preprocess(
    paraTextoOpcional,
    textoSeguro(z.string().trim().max(120)).optional(),
  ),
  uf: z.preprocess(
    paraTextoOpcional,
    z.string().trim().length(2).optional(),
  ),
  cep: z.preprocess(
    paraTextoOpcional,
    z.string().trim().max(10).optional(),
  ),
  codigoIbgeCidade: z.preprocess(
    paraTextoOpcional,
    z.string().trim().max(10).optional(),
  ),
  podeAcessarFinanceiro: z.boolean(),
  senhaProvisoria: z.preprocess(
    paraTextoOpcional,
    senhaProvisoriaSecretariaFormularioSchema.optional(),
  ),
});

export const secretariaCriacaoFormularioSchema =
  secretariaFormularioSchema.extend({
    senhaProvisoria: senhaProvisoriaSecretariaFormularioSchema,
  });

export type SecretariaFormularioData = z.infer<
  typeof secretariaFormularioSchema
>;

export type SecretariaCriacaoFormularioData = z.infer<
  typeof secretariaCriacaoFormularioSchema
>;
