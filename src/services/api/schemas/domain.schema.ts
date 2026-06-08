import { z, type ZodTypeAny } from "zod";

import {
  MENSAGEM_TEXTO_SEM_HTML,
  validarTextoSemHtml,
} from "../../../schemas/texto-seguro.schema";

const DATA_ISO_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function toOptionalNumber(value: unknown): unknown {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}

function toOptionalBoolean(value: unknown): unknown {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") {
      return true;
    }

    if (normalized === "false" || normalized === "0") {
      return false;
    }
  }

  return value;
}

function toOptionalTrimmedString(value: unknown): unknown {
  if (value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

const optionalPositiveIntSchema = z.preprocess(
  toOptionalNumber,
  z.number().int().positive().optional(),
);

const optionalBooleanSchema = z.preprocess(
  toOptionalBoolean,
  z.boolean().optional(),
);

const optionalTrimmedStringSchema = z.preprocess(
  toOptionalTrimmedString,
  z.string().trim().optional(),
);

const optionalTrimmedStringSemHtmlSchema = z.preprocess(
  toOptionalTrimmedString,
  z
    .string()
    .trim()
    .refine(validarTextoSemHtml, MENSAGEM_TEXTO_SEM_HTML)
    .optional(),
);

function textoSemHtml(schema: z.ZodString) {
  return schema.refine(validarTextoSemHtml, MENSAGEM_TEXTO_SEM_HTML);
}

const optionalDateOnlySchema = z.preprocess(
  toOptionalTrimmedString,
  z
    .string()
    .trim()
    .regex(DATA_ISO_REGEX, "Data deve estar no formato YYYY-MM-DD.")
    .optional(),
);

const optionalEmailSchema = z.preprocess(
  toOptionalTrimmedString,
  z.string().trim().toLowerCase().email().max(100).optional(),
);

export const entityIdSchema = z
  .string()
  .trim()
  .min(1, "Identificador obrigatório.")
  .max(120, "Identificador inválido.");

export const numericIdSchema = z.number().int().positive();

export const paginatedMetaSchema = z.object({
  page: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalItems: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export function createPaginatedResponseSchema<T extends ZodTypeAny>(
  itemSchema: T,
) {
  return z.object({
    items: z.array(itemSchema),
    meta: paginatedMetaSchema,
  });
}

export const paginationRequestSchema = z.object({
  page: optionalPositiveIntSchema,
  pageSize: optionalPositiveIntSchema,
  limit: optionalPositiveIntSchema,
  search: optionalTrimmedStringSchema,
});

export const tokensAutenticacaoSchema = z.object({
  accessToken: z.string().trim().min(1).max(2048),
  expiresIn: z.number().int().positive(),
});

export const respostaLoginUsuarioSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(160),
  role: z.enum(["MASTER", "PROFISSIONAL"]),
  deveTrocarSenha: z.boolean(),
  tenantId: entityIdSchema,
});

export const respostaLoginSchema = tokensAutenticacaoSchema.extend({
  usuario: respostaLoginUsuarioSchema,
});

export const minhaContaAutenticadaSchema = z.object({
  id: entityIdSchema,
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(160),
  role: z.enum(["MASTER", "PROFISSIONAL"]),
  profissionalId: z.number().int().positive().nullable().optional(),
  deveTrocarSenha: z.boolean(),
  tenantId: entityIdSchema,
  ultimoLoginEm: z.string().trim().nullable().optional(),
});

export const tenantSchema = z.object({
  id: entityIdSchema,
  slug: z.string().trim().min(1).max(63),
  nome: z.string().trim().min(1).max(255),
  ativo: z.boolean(),
  createdAt: z.string().trim().min(1),
});

export const estadoSchema = z.object({
  id: numericIdSchema,
  nome: z.string().trim().min(1).max(120),
  sigla: z.string().trim().min(2).max(2),
});

export const cidadeSchema = z.object({
  id: numericIdSchema,
  nome: z.string().trim().min(1).max(120),
  codigoIbge: optionalTrimmedStringSchema,
  estado: z.preprocess((value) => value ?? undefined, estadoSchema.optional()),
  siglaEstado: optionalTrimmedStringSchema,
});

export const contatoSchema = z.object({
  telefone: z.string().trim().min(1).max(15),
  whatsapp: z.preprocess(
    toOptionalTrimmedString,
    z.string().trim().max(15).optional(),
  ),
  email: optionalEmailSchema,
});

export const contatoInputSchema = z.object({
  telefone: z.string().trim().min(1).max(15),
  whatsapp: z.string().trim().max(15).optional(),
  email: z.string().trim().toLowerCase().email().max(100),
});

export const enderecoSchema = z.object({
  logradouro: z.preprocess(
    toOptionalTrimmedString,
    z.string().trim().max(128).optional(),
  ),
  numero: z.preprocess(toOptionalNumber, z.number().int().optional()),
  complemento: z.preprocess(
    toOptionalTrimmedString,
    z.string().trim().max(100).optional(),
  ),
  bairro: z.preprocess(
    toOptionalTrimmedString,
    z.string().trim().max(100).optional(),
  ),
  cep: z.preprocess(
    toOptionalTrimmedString,
    z.string().trim().max(10).optional(),
  ),
});

export const enderecoInputSchema = z.object({
  logradouro: z.preprocess(
    toOptionalTrimmedString,
    textoSemHtml(z.string().trim().max(128)).optional(),
  ),
  numero: z.preprocess(toOptionalNumber, z.number().int().optional()),
  complemento: z.preprocess(
    toOptionalTrimmedString,
    textoSemHtml(z.string().trim().max(100)).optional(),
  ),
  bairro: z.preprocess(
    toOptionalTrimmedString,
    textoSemHtml(z.string().trim().max(100)).optional(),
  ),
  cep: z.preprocess(
    toOptionalTrimmedString,
    z.string().trim().max(10).optional(),
  ),
});

export const pessoaSchema = z.object({
  id: numericIdSchema,
  nome: z.string().trim().min(1).max(100),
  ativo: z.boolean(),
  contato: contatoSchema,
  endereco: z.preprocess(
    (value) => value ?? undefined,
    enderecoSchema.optional(),
  ),
  cidade: z.preprocess((value) => value ?? undefined, cidadeSchema.optional()),
});

export const pessoaInputSchema = z.object({
  nome: textoSemHtml(z.string().trim().min(3).max(100)),
  ativo: z.boolean().optional(),
  contato: contatoInputSchema,
  endereco: enderecoInputSchema.optional(),
  cidade: z.object({ id: numericIdSchema }).optional(),
});

export const pessoaProfissionalInputSchema = z.object({
  nome: textoSemHtml(z.string().trim().min(3).max(100)),
  ativo: z.boolean().optional(),
  contato: contatoInputSchema,
  endereco: enderecoInputSchema.optional(),
  cidade: z
    .object({
      codigoIbge: z.string().trim().min(1).max(10),
    })
    .optional(),
});

export const contatoPacienteInputSchema = z.object({
  telefone: z.string().trim().min(1).max(15),
  whatsapp: z.preprocess(
    toOptionalTrimmedString,
    z.string().trim().max(15).optional(),
  ),
  email: optionalEmailSchema,
});

export const pessoaPacienteInputSchema = z.object({
  nome: textoSemHtml(z.string().trim().min(3).max(100)),
  ativo: z.boolean().optional(),
  contato: contatoPacienteInputSchema,
  endereco: enderecoInputSchema.optional(),
  cidade: z
    .object({
      codigoIbge: z.string().trim().min(1).max(10),
    })
    .optional(),
});

export const pacienteSexoSchema = z.enum(["MASCULINO", "FEMININO", "OUTRO"]);

export const pacienteGeneroSchema = z.enum([
  "Cisgênero Masculino",
  "Cisgênero Feminino",
  "Transgênero Masculino",
  "Transgênero Feminino",
  "Não Binário",
  "Outro",
  "Prefiro não informar",
]);

export const pacienteListaItemSchema = z.object({
  id: numericIdSchema,
  nome: z.string().trim().min(1).max(100),
  ativo: z.boolean(),
  cpf: optionalTrimmedStringSchema,
  dataNascimento: optionalDateOnlySchema,
  telefone: optionalTrimmedStringSchema,
  email: optionalEmailSchema,
});

export const criarPacienteRequestSchema = z.object({
  pessoa: pessoaPacienteInputSchema,
  ativo: z.boolean().optional(),
  cpf: optionalTrimmedStringSchema,
  dataNascimento: optionalDateOnlySchema,
  nomeMae: z.preprocess(
    toOptionalTrimmedString,
    textoSemHtml(z.string().trim().max(100)).optional(),
  ),
  sexo: pacienteSexoSchema.optional(),
  genero: pacienteGeneroSchema.optional(),
  convenioId: z.number().int().positive().nullable().optional(),
  numeroCarteirinha: z.preprocess(
    toOptionalTrimmedString,
    textoSemHtml(z.string().trim().max(50)).optional(),
  ),
});

export const atualizarPacienteRequestSchema = z.object({
  pessoa: pessoaPacienteInputSchema.optional(),
  ativo: z.boolean().optional(),
  cpf: optionalTrimmedStringSchema,
  dataNascimento: optionalDateOnlySchema,
  nomeMae: z.preprocess(
    toOptionalTrimmedString,
    textoSemHtml(z.string().trim().max(100)).optional(),
  ),
  sexo: pacienteSexoSchema.optional(),
  genero: pacienteGeneroSchema.optional(),
  convenioId: z.number().int().positive().nullable().optional(),
  numeroCarteirinha: z
    .union([textoSemHtml(z.string().trim().max(50)), z.null()])
    .optional(),
});

export const pacienteSchema = pacienteListaItemSchema.extend({
  pessoa: pessoaSchema,
  nomeMae: z.preprocess(
    toOptionalTrimmedString,
    z.string().trim().max(100).optional(),
  ),
  sexo: z.preprocess((value) => value ?? undefined, pacienteSexoSchema.optional()),
  genero: z.preprocess(
    (value) => value ?? undefined,
    pacienteGeneroSchema.optional(),
  ),
  convenio: optionalTrimmedStringSchema,
  convenioId: z.number().int().positive().nullable().optional(),
  numeroCarteirinha: z.preprocess(
    toOptionalTrimmedString,
    z.string().trim().max(50).optional(),
  ),
});

export const listarPacientesRequestSchema = paginationRequestSchema.extend({
  nome: optionalTrimmedStringSchema,
  cpf: optionalTrimmedStringSchema,
  telefone: optionalTrimmedStringSchema,
  email: optionalTrimmedStringSchema,
  ativo: optionalBooleanSchema,
});

export const especialidadeSchema = z.object({
  id: numericIdSchema,
  nome: z.string().trim().min(3).max(60),
  descricao: optionalTrimmedStringSchema,
});

export const especialidadeListaItemSchema = especialidadeSchema.omit({
  descricao: true,
});

export const especialidadeRequestSchema = z.object({
  nome: textoSemHtml(z.string().trim().min(3).max(60)),
  descricao: optionalTrimmedStringSemHtmlSchema,
});

export const profissionalListaItemSchema = z.object({
  id: numericIdSchema,
  nome: z.string().trim().min(1).max(100),
  ativo: z.boolean(),
  tipoProfissional: optionalTrimmedStringSchema,
  numeroRegistro: optionalTrimmedStringSchema,
  especialidade: optionalTrimmedStringSchema,
  conselho: optionalTrimmedStringSchema,
});

export const profissionalApiSchema = profissionalListaItemSchema.extend({
  pessoa: pessoaSchema,
  especialidadeDetalhe: z.preprocess(
    (value) => value ?? undefined,
    especialidadeSchema.optional(),
  ),
});

export const criarProfissionalRequestSchema = z.object({
  pessoa: pessoaProfissionalInputSchema,
  tipoProfissional: optionalTrimmedStringSemHtmlSchema,
  numeroRegistro: optionalTrimmedStringSemHtmlSchema,
  especialidade: z.object({ id: numericIdSchema }),
});

export const atualizarProfissionalRequestSchema = criarProfissionalRequestSchema
  .partial()
  .extend({
    ativo: z.boolean().optional(),
  });

export const listarProfissionaisRequestSchema = paginationRequestSchema.extend({
  ativo: optionalBooleanSchema,
  especialidadeId: optionalPositiveIntSchema,
  especialidade: optionalTrimmedStringSchema,
});

const contatoConsultorioInputSchema = z.object({
  telefone: z.string().trim().min(1).max(15),
  whatsapp: z.string().trim().max(15).optional(),
  email: z.string().trim().toLowerCase().email().max(100).optional(),
});

const pessoaConsultorioInputSchema = z.object({
  nome: textoSemHtml(z.string().trim().min(3).max(100)),
  contato: contatoConsultorioInputSchema,
  endereco: enderecoInputSchema.optional(),
  cidade: z
    .object({
      codigoIbge: z.string().trim().min(1).max(10),
    })
    .optional(),
});

export const consultorioListaItemSchema = z.object({
  id: numericIdSchema,
  nome: z.string().trim().min(1).max(100),
  ativo: z.boolean(),
  cnpj: optionalTrimmedStringSchema,
  razaoSocial: optionalTrimmedStringSchema,
});

export const consultorioSchema = z.object({
  id: numericIdSchema,
  pessoa: pessoaSchema,
  ativo: z.boolean(),
  razaoSocial: optionalTrimmedStringSchema,
  cnpj: optionalTrimmedStringSchema,
});

export const criarConsultorioRequestSchema = z.object({
  pessoa: pessoaConsultorioInputSchema,
  razaoSocial: optionalTrimmedStringSemHtmlSchema,
  cnpj: optionalTrimmedStringSchema,
});

export const atualizarConsultorioRequestSchema = criarConsultorioRequestSchema
  .partial()
  .extend({
    ativo: z.boolean().optional(),
  });

export const diaSemanaSchema = z.enum([
  "SEGUNDA",
  "TERCA",
  "QUARTA",
  "QUINTA",
  "SEXTA",
  "SABADO",
  "DOMINGO",
]);

export const configuracaoPausaSchema = z.object({
  id: numericIdSchema,
  inicio: z.string().trim().min(1),
  fim: z.string().trim().min(1),
});

export const configuracaoSchema = z.object({
  id: numericIdSchema,
  horaInicio: z.string().trim().min(1),
  horaFim: z.string().trim().min(1),
  intervaloMinutos: z.number().int().positive(),
  diasAtendimento: z.array(diaSemanaSchema),
  pausas: z.array(configuracaoPausaSchema),
});

const horarioConfiguracaoSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/);

export const salvarConfiguracaoRequestSchema = z.object({
  horaInicio: horarioConfiguracaoSchema,
  horaFim: horarioConfiguracaoSchema,
  intervaloMinutos: z.number().int().min(1).max(240),
  diasAtendimento: z
    .array(diaSemanaSchema)
    .min(1)
    .refine(
      (diasAtendimento) =>
        new Set(diasAtendimento).size === diasAtendimento.length,
      "Os dias de atendimento não podem se repetir.",
    ),
  pausas: z
    .array(
      z.object({
        inicio: horarioConfiguracaoSchema,
        fim: horarioConfiguracaoSchema,
      }),
    )
    .optional(),
});

export const atualizarConfiguracaoRequestSchema =
  salvarConfiguracaoRequestSchema;

export const abrangenciaConvenioSchema = z.enum([
  "Nacional",
  "Regional",
  "Municipal",
]);

export const convenioListItemSchema = z.object({
  id: numericIdSchema,
  nome: z.string().trim().min(1).max(100),
  ativo: z.boolean(),
});

export const convenioSchema = convenioListItemSchema.extend({
  cnpj: z.string().trim().max(14),
  diasPagamento: z.number().int(),
  abrangencia: abrangenciaConvenioSchema,
  contato: contatoSchema,
});

export const criarConvenioRequestSchema = z.object({
  nome: textoSemHtml(z.string().trim().min(3).max(100)),
  cnpj: z.string().trim().max(14),
  ativo: z.boolean().optional(),
  diasPagamento: z.number().finite().optional(),
  abrangencia: abrangenciaConvenioSchema,
  contato: contatoInputSchema,
});

export const atualizarConvenioRequestSchema = criarConvenioRequestSchema;

export const recebimentoTipoSchema = z.enum(["na_hora", "prazo"]);

export const formaPagamentoSchema = z.object({
  id: numericIdSchema,
  nome: z.string().trim().min(1).max(80),
  taxaPercentual: z.number().min(0).max(100),
  recebimentoTipo: recebimentoTipoSchema,
  prazoRecebimentoDias: z.number().int().nullable().optional(),
  observacoes: z.string().trim().nullable().optional(),
  dataCadastro: z.string().trim().min(1),
});

export const criarFormaPagamentoRequestSchema = z.object({
  nome: textoSemHtml(z.string().trim().min(1).max(80)),
  taxaPercentual: z
    .number()
    .min(0)
    .max(100)
    .refine(
      (value) => Number.isInteger(value * 100),
      "Taxa percentual deve ter no máximo 2 casas decimais.",
    ),
  recebimentoTipo: recebimentoTipoSchema,
  prazoRecebimentoDias: z.number().int().min(1).max(120).optional(),
  observacoes: optionalTrimmedStringSemHtmlSchema,
});

export const atualizarFormaPagamentoRequestSchema =
  criarFormaPagamentoRequestSchema;

const valorServicoConvenioApiSchema = z.coerce
  .number()
  .min(0)
  .refine(
    (value) => Number.isInteger(value * 100),
    "Valor deve ter no máximo 2 casas decimais.",
  );

const convenioResumoServicoSchema = z
  .object({
    nome: z.string().trim().optional().nullable(),
  })
  .nullable()
  .optional();

export const servicoConvenioSchema = z
  .object({
    convenioId: numericIdSchema,
    valor: valorServicoConvenioApiSchema.optional(),
    preco: valorServicoConvenioApiSchema.optional(),
    convenioNome: z.string().trim().optional().nullable(),
    convenio: convenioResumoServicoSchema,
  })
  .transform((dados, contexto) => {
    const valor = dados.valor ?? dados.preco;

    if (valor === undefined) {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["valor"],
        message: "Valor do convênio é obrigatório.",
      });

      return z.NEVER;
    }

    return {
      convenioId: dados.convenioId,
      valor,
      convenioNome:
        dados.convenioNome?.trim() ||
        dados.convenio?.nome?.trim() ||
        `Convênio #${dados.convenioId}`,
    };
  });

export const servicoConvenioInputSchema = z.object({
  convenioId: numericIdSchema,
  valor: z
    .number()
    .min(0)
    .refine(
      (value) => Number.isInteger(value * 100),
      "Valor deve ter no máximo 2 casas decimais.",
    ),
});

export const servicoListItemSchema = z.object({
  id: numericIdSchema,
  nome: z.string().trim().min(1).max(100),
  ativo: z.boolean(),
  valorParticular: z.coerce.number(),
  servicosConvenios: z.array(servicoConvenioSchema),
});

export const servicoSchema = servicoListItemSchema.extend({
  descricao: z.string().trim().optional().nullable(),
  servicosConvenios: z.array(servicoConvenioSchema),
});

export const criarServicoRequestSchema = z
  .object({
    nome: textoSemHtml(z.string().trim().min(3).max(100)),
    descricao: textoSemHtml(z.string().trim().max(500)),
    ativo: z.boolean(),
    valorParticular: z.number(),
    convenios: z.array(servicoConvenioInputSchema).optional(),
  })
  .superRefine((value, context) => {
    const convenioIds = new Set<number>();

    value.convenios?.forEach((item, index) => {
      if (convenioIds.has(item.convenioId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["convenios", index, "convenioId"],
          message: "Convênios não podem se repetir no payload.",
        });
        return;
      }

      convenioIds.add(item.convenioId);
    });
  });

export const atualizarServicoRequestSchema = criarServicoRequestSchema;

export const documentoPagarStatusSchema = z.enum([
  "PENDENTE",
  "PAGO",
  "CANCELADO",
]);

export const documentoPagarSituacaoSchema = z.enum([
  "PENDENTE",
  "PAGO",
  "ATRASADO",
  "CANCELADO",
]);

export const documentoPagarOrigemSchema = z.enum(["MANUAL"]);

export const documentoPagarSchema = z.object({
  id: numericIdSchema,
  descricao: z.string().trim().min(1).max(160),
  valor: z.number(),
  valorParcela: z.number(),
  valorTotal: z.number(),
  dataVencimento: z.string().trim().min(1),
  status: documentoPagarStatusSchema,
  situacao: documentoPagarSituacaoSchema,
  atrasado: z.boolean(),
  diasAtraso: z.number().int(),
  categoria: z.string().trim().nullable().optional(),
  observacao: z.string().trim().nullable().optional(),
  dataPagamento: z.string().trim().nullable().optional(),
  dataCancelamento: z.string().trim().nullable().optional(),
  motivoCancelamento: z.string().trim().nullable().optional(),
  origem: documentoPagarOrigemSchema,
  lancamentoId: z.string().trim().nullable().optional(),
  parcelaNumero: z.number().int(),
  totalParcelas: z.number().int(),
  parcelado: z.boolean(),
});

export const documentoPagarCreateRequestSchema = z.object({
  descricao: textoSemHtml(z.string().trim().min(1).max(160)),
  valor: z.number().min(0.01).max(100000),
  vencimento: optionalDateOnlySchema,
  dataVencimento: optionalDateOnlySchema,
  statusInicial: documentoPagarStatusSchema.optional(),
  statusBase: documentoPagarStatusSchema.optional(),
  categoria: optionalTrimmedStringSemHtmlSchema,
  observacao: optionalTrimmedStringSemHtmlSchema,
  observacoes: optionalTrimmedStringSemHtmlSchema,
  parcelado: z.boolean().optional(),
  quantidadeParcelas: z.number().int().min(1).max(60).optional(),
});

export const documentoPagarUpdateRequestSchema = z.object({
  descricao: textoSemHtml(z.string().trim().min(1).max(160)).optional(),
  valor: z.number().min(0.01).max(100000).optional(),
  vencimento: optionalDateOnlySchema,
  dataVencimento: optionalDateOnlySchema,
  status: documentoPagarStatusSchema.optional(),
  statusBase: documentoPagarStatusSchema.optional(),
  categoria: optionalTrimmedStringSemHtmlSchema,
  observacao: optionalTrimmedStringSemHtmlSchema,
  observacoes: optionalTrimmedStringSemHtmlSchema,
});

export const marcarDocumentoPagarPagoRequestSchema = z.object({
  dataPagamento: optionalDateOnlySchema,
  observacao: optionalTrimmedStringSemHtmlSchema,
});

export const cancelarDocumentoPagarRequestSchema = z.object({
  motivo: z
      .string()
      .trim()
      .refine(validarTextoSemHtml, MENSAGEM_TEXTO_SEM_HTML)
      .min(3, "Informe um motivo com pelo menos 3 caracteres.")
    .max(500, "O motivo deve ter no máximo 500 caracteres."),
});

export const listDocumentosPagarRequestSchema = paginationRequestSchema.extend({
  busca: optionalTrimmedStringSchema,
  status: documentoPagarStatusSchema.optional(),
  situacao: documentoPagarSituacaoSchema.optional(),
  categoria: optionalTrimmedStringSchema,
  dataVencimentoInicio: optionalDateOnlySchema,
  dataVencimentoFim: optionalDateOnlySchema,
  dataPagamentoInicio: optionalDateOnlySchema,
  dataPagamentoFim: optionalDateOnlySchema,
  somenteAtrasados: optionalBooleanSchema,
});

export const documentoReceberStatusSchema = z.enum([
  "PREVISTO",
  "RECEBIDO",
  "CANCELADO",
]);

export const documentoReceberSituacaoSchema = z.enum([
  "PREVISTO",
  "RECEBIDO",
  "CANCELADO",
  "ATRASADO",
]);

export const documentoReceberSchema = z.object({
  id: numericIdSchema,
  agendamentoId: numericIdSchema,
  pacienteId: numericIdSchema,
  pacienteNome: z.string().trim().min(1).max(160),
  servicoId: numericIdSchema,
  servicoNome: z.string().trim().min(1).max(200),
  convenioId: z.number().int().positive().nullable().optional(),
  convenioNome: z.string().trim().nullable().optional(),
  descricao: z.string().trim().min(1).max(255),
  tipoAtendimento: z.enum(["PARTICULAR", "CONVENIO"]),
  formaPagamentoId: numericIdSchema,
  formaPagamento: z.string().trim().min(1).max(80),
  recebimentoTipo: recebimentoTipoSchema,
  prazoRecebimentoDias: z.number().int().nonnegative(),
  status: documentoReceberStatusSchema,
  situacao: documentoReceberSituacaoSchema,
  atrasado: z.boolean(),
  parcelaNumero: z.number().int().positive(),
  totalParcelas: z.number().int().positive(),
  dataAtendimento: z.string().trim().min(1),
  dataPrevistaRecebimento: z.string().trim().min(1),
  dataRecebimento: z.string().trim().nullable().optional(),
  dataCancelamento: z.string().trim().nullable().optional(),
  valorOriginal: z.number().finite(),
  valorDesconto: z.number().finite(),
  valorBruto: z.number().finite(),
  percentualTaxa: z.number().finite(),
  valorTaxa: z.number().finite(),
  valorLiquido: z.number().finite(),
  observacao: z.string().trim().nullable().optional(),
  motivoCancelamento: z.string().trim().nullable().optional(),
});

export const listDocumentosReceberRequestSchema =
  paginationRequestSchema.extend({
    busca: optionalTrimmedStringSchema,
    agendamentoId: optionalPositiveIntSchema,
    pacienteId: optionalPositiveIntSchema,
    convenioId: optionalPositiveIntSchema,
    status: documentoReceberStatusSchema.optional(),
    formaPagamentoId: optionalPositiveIntSchema,
    recebimentoTipo: recebimentoTipoSchema.optional(),
    dataAtendimentoInicio: optionalDateOnlySchema,
    dataAtendimentoFim: optionalDateOnlySchema,
    dataPrevistaInicio: optionalDateOnlySchema,
    dataPrevistaFim: optionalDateOnlySchema,
    somenteAtrasados: optionalBooleanSchema,
  });

export const marcarDocumentoRecebidoRequestSchema = z.object({
  dataRecebimento: optionalDateOnlySchema,
  observacao: optionalTrimmedStringSemHtmlSchema,
});

export const cancelarDocumentoReceberRequestSchema = z.object({
  motivo: textoSemHtml(z.string().trim().min(1).max(500)),
});

export const origemFluxoCaixaSchema = z.enum(["CONTA_RECEBER", "CONTA_PAGAR"]);

export const tipoMovimentacaoFluxoCaixaSchema = z.enum(["ENTRADA", "SAIDA"]);

export const statusFluxoCaixaSchema = z.enum([
  "LIQUIDADO",
  "PENDENTE",
  "ATRASADO",
]);

export const tipoFiltroFluxoCaixaSchema = z.enum(["TODOS", "ENTRADA", "SAIDA"]);

export const statusFiltroFluxoCaixaSchema = z.enum([
  "TODOS",
  "LIQUIDADO",
  "PENDENTE",
  "ATRASADO",
]);

export const consultarFluxoCaixaRequestSchema = z.object({
  busca: optionalTrimmedStringSchema,
  dataInicio: optionalDateOnlySchema,
  dataFim: optionalDateOnlySchema,
  tipo: tipoFiltroFluxoCaixaSchema.optional(),
  status: statusFiltroFluxoCaixaSchema.optional(),
  categoria: z.preprocess(
    toOptionalTrimmedString,
    z.string().trim().max(120).optional(),
  ),
  formaPagamentoId: optionalPositiveIntSchema,
  origemTipo: origemFluxoCaixaSchema.optional(),
});

export const resumoFluxoCaixaSchema = z.object({
  saldoInicial: z.number().finite(),
  saldoPeriodo: z.number().finite(),
  entradasLiquidasPeriodo: z.number().finite(),
  saidasPeriodo: z.number().finite(),
  saldoLiquidado: z.number().finite(),
  atrasadoPeriodo: z.number().finite(),
});

export const filtrosAplicadosFluxoCaixaSchema = z.object({
  dataInicio: z
    .string()
    .trim()
    .regex(DATA_ISO_REGEX, "Data deve estar no formato YYYY-MM-DD.")
    .nullable()
    .optional(),
  dataFim: z
    .string()
    .trim()
    .regex(DATA_ISO_REGEX, "Data deve estar no formato YYYY-MM-DD.")
    .nullable()
    .optional(),
  busca: z.string().trim().nullable().optional(),
  tipo: tipoFiltroFluxoCaixaSchema,
  status: statusFiltroFluxoCaixaSchema,
  categoria: z.string().trim().nullable().optional(),
  formaPagamentoId: z.number().int().positive().nullable().optional(),
  origemTipo: origemFluxoCaixaSchema.nullable().optional(),
});

export const movimentacaoFluxoCaixaSchema = z.object({
  id: z.string().trim().min(1).max(120),
  origemId: numericIdSchema,
  origemTipo: origemFluxoCaixaSchema,
  dataMovimentacao: z
    .string()
    .trim()
    .regex(DATA_ISO_REGEX, "Data deve estar no formato YYYY-MM-DD."),
  dataVencimento: z
    .string()
    .trim()
    .regex(DATA_ISO_REGEX, "Data deve estar no formato YYYY-MM-DD."),
  dataLiquidacao: z
    .string()
    .trim()
    .regex(DATA_ISO_REGEX, "Data deve estar no formato YYYY-MM-DD.")
    .nullable()
    .optional(),
  descricao: z.string().trim().min(1),
  descricaoSecundaria: z.string().trim().optional(),
  tipoMovimentacao: tipoMovimentacaoFluxoCaixaSchema,
  valor: z.number().finite(),
  status: statusFluxoCaixaSchema,
  saldoAcumulado: z.number().finite(),
  formaPagamentoId: z.number().int().positive().optional(),
  categoria: z.string().trim().optional(),
  grupoFinanceiro: z.string().trim().optional(),
  formaPagamentoDescricao: z.string().trim().optional(),
  observacaoResumida: z.string().trim().optional(),
  valorBruto: z.number().finite().optional(),
  valorDesconto: z.number().finite().optional(),
  valorTaxa: z.number().finite().optional(),
  valorLiquido: z.number().finite().optional(),
  indicaAtraso: z.boolean(),
  indicaLiquidado: z.boolean(),
});

export const fluxoCaixaSchema = z.object({
  resumo: resumoFluxoCaixaSchema,
  filtros: filtrosAplicadosFluxoCaixaSchema,
  movimentacoes: z.array(movimentacaoFluxoCaixaSchema),
});

export const statusAgendamentoSchema = z.enum([
  "AGUARDANDO",
  "CONFIRMADO",
  "CANCELADO",
  "EM_ATENDIMENTO",
  "REALIZADO",
  "FALTOU",
]);

const numeroFinanceiroPainelSchema = z.union([
  z.number().finite(),
  z
    .string()
    .trim()
    .regex(/^-?\d+(\.\d+)?$/)
    .transform(Number)
    .pipe(z.number().finite()),
]);

const horarioPainelSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/)
  .transform((valor) => valor.slice(0, 5));

export const consultarPainelRequestSchema = z.object({
  mes: z.preprocess(
    toOptionalNumber,
    z.number().int().min(1).max(12).optional(),
  ),
  ano: z.preprocess(
    toOptionalNumber,
    z.number().int().min(2000).max(2100).optional(),
  ),
});

export const resumoFinanceiroPainelSchema = z.object({
  entradas: numeroFinanceiroPainelSchema,
  saidas: numeroFinanceiroPainelSchema,
  saldoDoMes: numeroFinanceiroPainelSchema,
  saldoAtual: numeroFinanceiroPainelSchema,
  mesReferencia: z.number().int().min(1).max(12),
  anoReferencia: z.number().int().min(2000).max(2100),
});

export const proximaConsultaPainelSchema = z.object({
  horario: horarioPainelSchema,
  nomePaciente: z.string().trim().min(1),
  nomeServico: z.string().trim().min(1),
  status: statusAgendamentoSchema,
});

export const operacaoDeHojePainelSchema = z.object({
  consultasHoje: z.number().int().nonnegative(),
  pendentes: z.number().int().nonnegative(),
  emAtendimento: z.number().int().nonnegative(),
  proximaConsulta: proximaConsultaPainelSchema.nullable(),
});

export const itemFilaAtendimentoPainelSchema = z.object({
  id: entityIdSchema,
  horario: horarioPainelSchema,
  nomePaciente: z.string().trim().min(1),
  nomeServico: z.string().trim().min(1),
  status: statusAgendamentoSchema,
});

export const painelSchema = z.object({
  resumoFinanceiro: resumoFinanceiroPainelSchema,
  operacaoDeHoje: operacaoDeHojePainelSchema,
  filaDeAtendimento: z.array(itemFilaAtendimentoPainelSchema),
});

export const tipoAtendimentoSchema = z.enum(["PARTICULAR", "CONVENIO"]);
export const tipoConsultaSchema = z.enum([
  "Consulta",
  "Retorno",
  "Primeira Vez",
  "Urgência",
]);

const identificadorApiSchema = z
  .union([entityIdSchema, numericIdSchema])
  .transform((valor) => String(valor));

const horarioAgendamentoApiSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/)
  .transform((valor) => valor.slice(0, 5));

export const agendamentoApiSchema = z.object({
  id: identificadorApiSchema,
  agendaId: numericIdSchema,
  data: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/),
  horario: horarioAgendamentoApiSchema,
  horarioFim: horarioAgendamentoApiSchema,
  inicio: z.string().trim().min(1),
  fim: z.string().trim().min(1),
  duracaoMinutos: z.number().int().min(5).max(240),
  status: statusAgendamentoSchema,
  tipoAtendimento: tipoAtendimentoSchema,
  tipoConsulta: tipoConsultaSchema,
  valorServico: z.coerce.number().finite(),
  observacao: z.string().trim().nullable().optional(),
  pacienteId: identificadorApiSchema,
  paciente: z.string().trim().min(1),
  servicoId: numericIdSchema,
  servico: z.string().trim().min(1),
  procedimento: z.string().trim().min(1),
  convenioId: z.number().int().nullable().optional(),
  convenio: z.string().trim().nullable().optional(),
  formaPagamentoId: numericIdSchema,
  formaPagamento: z.string().trim().min(1),
  profissionalId: identificadorApiSchema,
  profissional: z.preprocess(
    toOptionalTrimmedString,
    z.string().trim().min(1).optional(),
  ),
});

export const agendamentoListagemResponseSchema = z.object({
  items: z.array(agendamentoApiSchema),
  meta: paginatedMetaSchema.optional(),
});

export const criarAgendamentoRequestSchema = z.object({
  agendaId: z.number().int().positive().optional(),
  data: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  profissionalId: z.number().int().positive().optional(),
  pacienteId: z.number().int().positive(),
  servicoId: z.number().int().positive(),
  tipoAtendimento: tipoAtendimentoSchema,
  convenioId: z.number().int().positive().optional(),
  formaPagamentoId: z.number().int().positive().optional(),
  horario: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  duracaoMinutos: z.number().int().min(5).max(240),
  tipoConsulta: tipoConsultaSchema.optional(),
  observacao: z.preprocess(
    toOptionalTrimmedString,
    textoSemHtml(z.string().trim().max(2000)).optional(),
  ),
}).strict();

export const atualizarAgendamentoRequestSchema =
  criarAgendamentoRequestSchema.partial();

export const listarAgendamentosRequestSchema = paginationRequestSchema.extend({
  agendaId: optionalPositiveIntSchema,
  data: z.preprocess(
    toOptionalTrimmedString,
    z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  ),
  profissionalId: optionalPositiveIntSchema,
  pacienteId: optionalPositiveIntSchema,
  status: statusAgendamentoSchema.optional(),
  tipoAtendimento: tipoAtendimentoSchema.optional(),
  busca: z.preprocess(
    toOptionalTrimmedString,
    z.string().trim().max(120).optional(),
  ),
});

export const registrarRecebimentoAgendamentoRequestSchema = z.object({
  formaPagamentoId: z.number().int().positive().optional(),
  numeroParcelas: z.number().int().min(1).max(36).optional(),
  intervaloParcelasDias: z.number().int().min(1).max(365).optional(),
  descontoValor: z.number().min(0).optional(),
  observacao: optionalTrimmedStringSemHtmlSchema,
});

export const atualizarStatusAgendamentoRequestSchema = z.object({
  status: statusAgendamentoSchema,
  recebimento: registrarRecebimentoAgendamentoRequestSchema.optional(),
});

export const consultaStatusSchema = z.enum([
  "EM_ATENDIMENTO",
  "FINALIZADO",
  "CANCELADO",
]);

export const prontuarioAnexoSchema = z.object({
  id: numericIdSchema,
  nomeArquivo: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
  tamanhoBytes: z.number().int().nonnegative(),
  dataUpload: z.string().trim().min(1),
  visualizacaoUrl: z.string().trim().min(1),
  downloadUrl: z.string().trim().min(1),
});

export const prontuarioPacienteResumoSchema = z.object({
  id: numericIdSchema,
  nome: z.string().trim().min(1),
  cpf: z.string().trim().nullable().optional(),
  telefone: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().email().nullable().optional(),
});

export const prontuarioHistoricoItemSchema = z.object({
  id: numericIdSchema,
  agendamentoId: numericIdSchema,
  dataConsulta: z.string().trim().min(1),
  horaConsulta: z.string().trim().min(1),
  statusConsulta: consultaStatusSchema,
  resumo: z.string().trim().min(1),
  profissionalNome: z.string().trim().min(1),
  servicoNome: z.string().trim().min(1),
  tipoAtendimento: z.string().trim().min(1),
});

export const consultaResumoSchema = z.object({
  agendamentoId: numericIdSchema,
  dataConsulta: z.string().trim().min(1),
  horaConsulta: z.string().trim().min(1),
  tempoConsultaMinutos: z.number().int().min(1),
  statusConsulta: consultaStatusSchema,
  agendamentoStatus: z.string().trim().min(1).optional(),
  profissionalId: numericIdSchema,
  profissionalNome: z.string().trim().min(1),
  servicoId: numericIdSchema,
  servicoNome: z.string().trim().min(1),
  tipoAtendimento: z.string().trim().min(1),
  tipoConsulta: z.string().trim().nullable().optional(),
});

export const prontuarioDetalheSchema = z.object({
  id: numericIdSchema,
  statusConsulta: consultaStatusSchema,
  registroConsulta: z.string().trim(),
  observacoes: z.string().trim().nullable().optional(),
  receitaDigitada: z.string().trim().nullable().optional(),
  queixaPrincipal: z.string().trim().nullable().optional(),
  conduta: z.string().trim().nullable().optional(),
  createdAt: z.string().trim().min(1),
  updatedAt: z.string().trim().min(1),
  anexos: z.array(prontuarioAnexoSchema),
});

export const contextoConsultaSchema = z.object({
  paciente: prontuarioPacienteResumoSchema,
  consulta: consultaResumoSchema,
  prontuario: prontuarioDetalheSchema.nullable(),
  historico: z.array(prontuarioHistoricoItemSchema),
});

export const prontuariosPacienteRespostaSchema = z.object({
  paciente: prontuarioPacienteResumoSchema,
  prontuarios: z.array(prontuarioHistoricoItemSchema),
});

export const prontuarioPacienteDetalheRespostaSchema = z.object({
  paciente: prontuarioPacienteResumoSchema,
  consulta: consultaResumoSchema,
  prontuario: prontuarioDetalheSchema,
});

export const salvarConsultaRequestSchema = z.object({
  tempoConsultaMinutos: z.number().int().min(1).max(480).optional(),
  queixaPrincipal: z.string().trim().max(500).optional(),
  registroConsulta: z.string().trim().max(20000).optional(),
  conduta: z.string().trim().max(5000).optional(),
  observacoes: z.string().trim().max(5000).optional(),
  receitaDigitada: z.string().trim().max(5000).optional(),
});

export const finalizarConsultaRequestSchema =
  salvarConsultaRequestSchema.extend({
    recebimento: registrarRecebimentoAgendamentoRequestSchema.optional(),
  });
