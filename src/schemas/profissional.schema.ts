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

function numeroOpcional() {
  return z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }

    const convertido = Number(value);
    return Number.isNaN(convertido) ? value : convertido;
  }, z.number().int().positive().optional());
}

const especialidadeIdSchema = z
  .preprocess((value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }

    const convertido = Number(value);
    return Number.isNaN(convertido) ? value : convertido;
  }, z.number().int().positive().optional())
  .refine((value) => value !== undefined, "Selecione uma especialidade.");

const textoCadastroOpcional = (maximo?: number, mensagem?: string) => {
  const schema = z
    .string()
    .trim()
    .refine(validarTextoSemHtml, MENSAGEM_TEXTO_SEM_HTML);

  return z.preprocess(
    vazioParaUndefined,
    (maximo ? schema.max(maximo, mensagem) : schema).optional(),
  );
};

export const profissionalSchema = z.object({
  nome: z
    .string()
    .trim()
    .refine(validarTextoSemHtml, MENSAGEM_TEXTO_SEM_HTML)
    .min(3, "O nome deve ter entre 3 e 100 caracteres.")
    .max(100, "O nome deve ter entre 3 e 100 caracteres."),

  ativo: z.boolean(),

  telefone: z
    .string()
    .trim()
    .min(1, "Informe o telefone.")
    .max(15, "O telefone deve ter no máximo 15 caracteres."),

  whatsapp: z.preprocess(
    vazioParaUndefined,
    z
      .string()
      .trim()
      .max(15, "O WhatsApp deve ter no máximo 15 caracteres.")
      .optional(),
  ),

  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .max(100, "O e-mail deve ter no máximo 100 caracteres."),

  cep: z.preprocess(
    vazioParaUndefined,
    z
      .string()
      .trim()
      .max(10, "O CEP deve ter no máximo 10 caracteres.")
      .optional(),
  ),

  logradouro: textoCadastroOpcional(
    128,
    "O logradouro deve ter no máximo 128 caracteres.",
  ),

  numero: numeroOpcional(),

  complemento: textoCadastroOpcional(
    100,
    "O complemento deve ter no máximo 100 caracteres.",
  ),

  bairro: textoCadastroOpcional(
    100,
    "O bairro deve ter no máximo 100 caracteres.",
  ),

  nomeCidade: textoCadastroOpcional(
    120,
    "O nome da cidade deve ter no máximo 120 caracteres.",
  ),

  codigoIbgeCidade: z.preprocess(
    vazioParaUndefined,
    z.string().trim().optional(),
  ),

  tipoProfissional: textoCadastroOpcional(),

  numeroRegistro: textoCadastroOpcional(),

  especialidadeId: especialidadeIdSchema,
});

export type ProfissionalFormData = z.infer<typeof profissionalSchema>;
