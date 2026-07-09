import { z } from "zod";
import { httpClient } from "../http/http-client";
import {
  atualizarConfiguracaoRequestSchema,
  configuracaoSchema,
  numericIdSchema,
  salvarConfiguracaoRequestSchema,
} from "../schemas/domain.schema";
import type { ApiEnvelope } from "../types/common";
import type {
  AtualizarConfiguracaoRequest,
  Configuracao,
  SalvarConfiguracaoRequest,
} from "../types/domain";
import { parseWithSchema } from "../utils/parse-with-schema";
import { unwrapEnvelope } from "../utils/unwrap-envelope";

const CAMINHO_BASE_CONFIGURACOES = "/configuracoes";
const CAMINHO_CONFIGURACOES_AGENDA = "/configuracoes/agenda";

const listaConfiguracoesSchema = z.array(configuracaoSchema);

export const configuracaoService = {
  async listar(): Promise<Configuracao[]> {
    const response = await httpClient.get<
      ApiEnvelope<Configuracao[]> | Configuracao[]
    >(CAMINHO_BASE_CONFIGURACOES);

    return parseWithSchema(listaConfiguracoesSchema, unwrapEnvelope(response), {
      context: "configuracao.listar.response",
      message: "Resposta inesperada ao listar configurações.",
      code: "INVALID_CONFIGURACAO_LIST_RESPONSE",
    });
  },

  async buscarPrincipal(): Promise<Configuracao | null> {
    const configuracoes = await this.listar();
    return configuracoes[0] ?? null;
  },

  async buscarPrincipalAgenda(): Promise<Configuracao | null> {
    const response = await httpClient.get<
      ApiEnvelope<Configuracao[]> | Configuracao[]
    >(CAMINHO_CONFIGURACOES_AGENDA);
    const configuracoes = parseWithSchema(
      listaConfiguracoesSchema,
      unwrapEnvelope(response),
      {
        context: "configuracao.agenda.response",
        message: "Resposta inesperada ao listar configuracoes da agenda.",
        code: "INVALID_CONFIGURACAO_AGENDA_RESPONSE",
      },
    );

    return configuracoes[0] ?? null;
  },

  async salvar(payload: SalvarConfiguracaoRequest): Promise<Configuracao> {
    const payloadNormalizado = parseWithSchema(
      salvarConfiguracaoRequestSchema,
      payload,
      {
        context: "configuracao.salvar.payload",
        message: "Dados inválidos para salvar a configuração.",
        code: "INVALID_CONFIGURACAO_CREATE_PAYLOAD",
      },
    );

    const response = await httpClient.post<
      ApiEnvelope<Configuracao> | Configuracao,
      SalvarConfiguracaoRequest
    >(CAMINHO_BASE_CONFIGURACOES, payloadNormalizado);

    return parseWithSchema(configuracaoSchema, unwrapEnvelope(response), {
      context: "configuracao.salvar.response",
      message: "Resposta inesperada ao salvar a configuração.",
      code: "INVALID_CONFIGURACAO_CREATE_RESPONSE",
    });
  },

  async atualizar(
    id: number,
    payload: AtualizarConfiguracaoRequest,
  ): Promise<Configuracao> {
    const safeId = parseWithSchema(numericIdSchema, id, {
      context: "configuracao.atualizar.id",
      message: "Identificador de configuração inválido.",
      code: "INVALID_CONFIGURACAO_ID",
    });

    const payloadNormalizado = parseWithSchema(
      atualizarConfiguracaoRequestSchema,
      payload,
      {
        context: "configuracao.atualizar.payload",
        message: "Dados inválidos para atualizar a configuração.",
        code: "INVALID_CONFIGURACAO_UPDATE_PAYLOAD",
      },
    );

    const response = await httpClient.put<
      ApiEnvelope<Configuracao> | Configuracao,
      AtualizarConfiguracaoRequest
    >(`${CAMINHO_BASE_CONFIGURACOES}/${safeId}`, payloadNormalizado);

    return parseWithSchema(configuracaoSchema, unwrapEnvelope(response), {
      context: "configuracao.atualizar.response",
      message: "Resposta inesperada ao atualizar a configuração.",
      code: "INVALID_CONFIGURACAO_UPDATE_RESPONSE",
    });
  },
};
