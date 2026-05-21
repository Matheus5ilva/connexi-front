import { z } from "zod";
import {
  MENSAGEM_TEXTO_SEM_HTML,
  validarTextoSemHtml,
} from "./texto-seguro.schema";

function vazioParaUndefined(valor: unknown) {
  if (valor === "" || valor === null || valor === undefined) {
    return undefined;
  }

  return valor;
}

function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

function numeroOpcional() {
  return z.preprocess((valor) => {
    if (valor === "" || valor === null || valor === undefined) {
      return undefined;
    }

    const convertido = Number(valor);
    return Number.isNaN(convertido) ? valor : convertido;
  }, z.number().int().positive().optional());
}

const telefoneSchema = z
  .string()
  .trim()
  .refine((valor) => somenteDigitos(valor).length >= 8, "Informe o telefone.")
  .refine(
    (valor) => somenteDigitos(valor).length <= 15,
    "O telefone deve ter no máximo 15 dígitos.",
  );

const whatsappSchema = z.preprocess(
  vazioParaUndefined,
  z
    .string()
    .trim()
    .refine(
      (valor) => somenteDigitos(valor).length >= 8,
      "Informe um WhatsApp válido.",
    )
    .refine(
      (valor) => somenteDigitos(valor).length <= 15,
      "O WhatsApp deve ter no máximo 15 dígitos.",
    )
    .optional(),
);

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

export const pacienteSchema = z.object({
  nome: z
    .string()
    .trim()
    .refine(validarTextoSemHtml, MENSAGEM_TEXTO_SEM_HTML)
    .min(3, "O nome deve ter entre 3 e 100 caracteres.")
    .max(100, "O nome deve ter entre 3 e 100 caracteres."),

  ativo: z.boolean(),

  telefone: telefoneSchema,

  whatsapp: whatsappSchema,

  email: z.preprocess(
    vazioParaUndefined,
    z
      .string()
      .trim()
      .email("Informe um e-mail válido.")
      .max(100, "O e-mail deve ter no máximo 100 caracteres.")
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

  cpf: z.preprocess(
    vazioParaUndefined,
    z
      .string()
      .trim()
      .refine((valor) => somenteDigitos(valor).length === 11, {
        message: "O CPF deve conter 11 dígitos.",
      })
      .optional(),
  ),

  dataNascimento: z.preprocess(
    vazioParaUndefined,
    z.string().trim().optional(),
  ),

  nomeMae: textoCadastroOpcional(
    100,
    "O nome da mãe deve ter no máximo 100 caracteres.",
  ),

  sexo: z.preprocess(
    vazioParaUndefined,
    z.enum(["MASCULINO", "FEMININO", "OUTRO"]).optional(),
  ),

  genero: z.preprocess(
    vazioParaUndefined,
    z
      .enum([
        "Cisgênero Masculino",
        "Cisgênero Feminino",
        "Transgênero Masculino",
        "Transgênero Feminino",
        "Não Binário",
        "Outro",
        "Prefiro não informar",
      ])
      .optional(),
  ),

  convenioId: numeroOpcional(),

  numeroCarteirinha: textoCadastroOpcional(
    50,
    "O número da carteirinha deve ter no máximo 50 caracteres.",
  ),
});

export type PacienteFormData = z.infer<typeof pacienteSchema>;
