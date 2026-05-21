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

const textoCadastroOpcional = (maximo: number, mensagem: string) =>
  z.preprocess(
    vazioParaUndefined,
    z
      .string()
      .trim()
      .refine(validarTextoSemHtml, MENSAGEM_TEXTO_SEM_HTML)
      .max(maximo, mensagem)
      .optional(),
  );

export const consultorioSchema = z.object({
  nome: z
    .string()
    .trim()
    .refine(validarTextoSemHtml, MENSAGEM_TEXTO_SEM_HTML)
    .min(3, "O nome deve ter entre 3 e 100 caracteres.")
    .max(100, "O nome deve ter entre 3 e 100 caracteres."),

  ativo: z.boolean(),

  razaoSocial: textoCadastroOpcional(
    255,
    "A razão social deve ter no máximo 255 caracteres.",
  ),

  cnpj: z.preprocess(
    vazioParaUndefined,
    z
      .string()
      .trim()
      .max(18, "O CNPJ deve ter no máximo 18 caracteres.")
      .optional(),
  ),

  email: z.preprocess(
    vazioParaUndefined,
    z
      .string()
      .trim()
      .email("Informe um e-mail válido.")
      .max(100, "O e-mail deve ter no máximo 100 caracteres.")
      .optional(),
  ),

  telefone: z
    .string()
    .trim()
    .min(8, "Informe o telefone.")
    .max(15, "O telefone deve ter no máximo 15 caracteres."),

  whatsapp: z.preprocess(
    vazioParaUndefined,
    z
      .string()
      .trim()
      .max(15, "O WhatsApp deve ter no máximo 15 caracteres.")
      .optional(),
  ),

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
    z
      .string()
      .trim()
      .min(7, "Código IBGE inválido.")
      .max(10, "Código IBGE inválido.")
      .optional(),
  ),
});

export type ConsultorioFormularioData = z.infer<typeof consultorioSchema>;
