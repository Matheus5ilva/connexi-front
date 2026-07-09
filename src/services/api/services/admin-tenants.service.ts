import { z } from "zod";
import {
  MENSAGEM_TEXTO_SEM_HTML,
  validarTextoSemHtml,
} from "../../../schemas/texto-seguro.schema";
import { httpClient } from "../http/http-client";
import type { ApiEnvelope } from "../types/common";
import { parseWithSchema } from "../utils/parse-with-schema";
import { unwrapEnvelope } from "../utils/unwrap-envelope";

const CAMINHO_BASE_ADMIN_TENANTS = "/admin/tenants";

export const nichoTenantSchema = z.enum([
  "SAUDE",
  "PET",
  "ESTETICA",
  "SERVICOS",
]);
export const planoTenantSchema = z.enum(["SOLO", "EQUIPE"]);

const textoSeguro = (schema: z.ZodString) =>
  schema.refine(validarTextoSemHtml, MENSAGEM_TEXTO_SEM_HTML);

const tenantAdministrativoSchema = z.object({
  id: z.string().trim().min(1).max(63),
  slug: z.string().trim().min(1).max(63),
  nome: z.string().trim().min(1).max(255),
  nicho: nichoTenantSchema,
  plano: planoTenantSchema.default("SOLO"),
  permiteSecretaria: z.boolean().default(false),
  ativo: z.boolean(),
  dataInativacao: z.string().trim().min(1).nullable(),
  criadoEm: z.string().trim().min(1),
  atualizadoEm: z.string().trim().min(1),
});

const criarTenantAdministrativoRequestSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(63)
    .regex(
      /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/,
      "Informe um subdomínio válido.",
    ),
  nome: textoSeguro(z.string().trim().min(1).max(255)),
  nicho: nichoTenantSchema,
  plano: planoTenantSchema.optional(),
  emailUsuarioInicial: z.string().trim().toLowerCase().email().max(160),
  nomeConsultorio: textoSeguro(z.string().trim().min(1).max(100)).optional(),
});

const atualizarTenantAdministrativoRequestSchema = z.object({
  nome: textoSeguro(z.string().trim().min(1).max(255)).optional(),
  plano: planoTenantSchema.optional(),
});

const listaTenantsAdministrativosSchema = z.array(tenantAdministrativoSchema);

export type NichoTenant = z.infer<typeof nichoTenantSchema>;
export type PlanoTenant = z.infer<typeof planoTenantSchema>;
export type TenantAdministrativo = z.infer<typeof tenantAdministrativoSchema>;
export type CriarTenantAdministrativoRequest = z.infer<
  typeof criarTenantAdministrativoRequestSchema
>;
export type AtualizarTenantAdministrativoRequest = z.infer<
  typeof atualizarTenantAdministrativoRequestSchema
>;

export type CredencialAdministrativa = {
  authorization: string;
};

function montarHeadersAdministrativos(
  credencial: CredencialAdministrativa,
): HeadersInit {
  return {
    Authorization: credencial.authorization,
  };
}

const opcoesAdministrativas = (credencial: CredencialAdministrativa) => ({
  auth: false,
  aplicarInterceptorsErro: false,
  headers: montarHeadersAdministrativos(credencial),
});

export const adminTenantsService = {
  async listar(
    credencial: CredencialAdministrativa,
  ): Promise<TenantAdministrativo[]> {
    const response = await httpClient.get<
      ApiEnvelope<TenantAdministrativo[]> | TenantAdministrativo[]
    >(CAMINHO_BASE_ADMIN_TENANTS, opcoesAdministrativas(credencial));

    return parseWithSchema(
      listaTenantsAdministrativosSchema,
      unwrapEnvelope(response),
      {
        context: "admin.tenants.listar.response",
        message: "Resposta inesperada ao listar tenants.",
        code: "ADMIN_TENANTS_LISTA_INVALIDA",
      },
    );
  },

  async criar(
    credencial: CredencialAdministrativa,
    payload: CriarTenantAdministrativoRequest,
  ): Promise<TenantAdministrativo> {
    const payloadValidado = parseWithSchema(
      criarTenantAdministrativoRequestSchema,
      payload,
      {
        context: "admin.tenants.criar.payload",
        message: "Dados inválidos para criar tenant.",
        code: "ADMIN_TENANT_CRIAR_PAYLOAD_INVALIDO",
      },
    );

    const response = await httpClient.post<
      ApiEnvelope<TenantAdministrativo> | TenantAdministrativo,
      CriarTenantAdministrativoRequest
    >(
      CAMINHO_BASE_ADMIN_TENANTS,
      payloadValidado,
      opcoesAdministrativas(credencial),
    );

    return parseWithSchema(
      tenantAdministrativoSchema,
      unwrapEnvelope(response),
      {
        context: "admin.tenants.criar.response",
        message: "Resposta inesperada ao criar tenant.",
        code: "ADMIN_TENANT_CRIAR_RESPOSTA_INVALIDA",
      },
    );
  },

  async ativar(
    credencial: CredencialAdministrativa,
    id: string,
  ): Promise<TenantAdministrativo> {
    const response = await httpClient.patch<
      ApiEnvelope<TenantAdministrativo> | TenantAdministrativo
    >(
      `${CAMINHO_BASE_ADMIN_TENANTS}/${encodeURIComponent(id)}/ativar`,
      undefined,
      opcoesAdministrativas(credencial),
    );

    return parseWithSchema(
      tenantAdministrativoSchema,
      unwrapEnvelope(response),
      {
        context: "admin.tenants.ativar.response",
        message: "Resposta inesperada ao ativar tenant.",
        code: "ADMIN_TENANT_ATIVAR_RESPOSTA_INVALIDA",
      },
    );
  },

  async atualizar(
    credencial: CredencialAdministrativa,
    id: string,
    payload: AtualizarTenantAdministrativoRequest,
  ): Promise<TenantAdministrativo> {
    const payloadValidado = parseWithSchema(
      atualizarTenantAdministrativoRequestSchema,
      payload,
      {
        context: "admin.tenants.atualizar.payload",
        message: "Dados inválidos para atualizar tenant.",
        code: "ADMIN_TENANT_ATUALIZAR_PAYLOAD_INVALIDO",
      },
    );

    const response = await httpClient.patch<
      ApiEnvelope<TenantAdministrativo> | TenantAdministrativo,
      AtualizarTenantAdministrativoRequest
    >(
      `${CAMINHO_BASE_ADMIN_TENANTS}/${encodeURIComponent(id)}`,
      payloadValidado,
      opcoesAdministrativas(credencial),
    );

    return parseWithSchema(
      tenantAdministrativoSchema,
      unwrapEnvelope(response),
      {
        context: "admin.tenants.atualizar.response",
        message: "Resposta inesperada ao atualizar tenant.",
        code: "ADMIN_TENANT_ATUALIZAR_RESPOSTA_INVALIDA",
      },
    );
  },

  async inativar(
    credencial: CredencialAdministrativa,
    id: string,
  ): Promise<TenantAdministrativo> {
    const response = await httpClient.patch<
      ApiEnvelope<TenantAdministrativo> | TenantAdministrativo
    >(
      `${CAMINHO_BASE_ADMIN_TENANTS}/${encodeURIComponent(id)}/inativar`,
      undefined,
      opcoesAdministrativas(credencial),
    );

    return parseWithSchema(
      tenantAdministrativoSchema,
      unwrapEnvelope(response),
      {
        context: "admin.tenants.inativar.response",
        message: "Resposta inesperada ao inativar tenant.",
        code: "ADMIN_TENANT_INATIVAR_RESPOSTA_INVALIDA",
      },
    );
  },

  async excluir(
    credencial: CredencialAdministrativa,
    id: string,
  ): Promise<void> {
    await httpClient.delete<unknown>(
      `${CAMINHO_BASE_ADMIN_TENANTS}/${encodeURIComponent(id)}`,
      opcoesAdministrativas(credencial),
    );
  },
};
