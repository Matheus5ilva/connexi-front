import { z } from "zod";
import { httpClient } from "../http/http-client";
import {
  atualizarSecretariaRequestSchema,
  atualizarStatusSecretariaRequestSchema,
  criarSecretariaRequestSchema,
  numericIdSchema,
  redefinirSenhaSecretariaRequestSchema,
  secretariaSchema,
} from "../schemas/domain.schema";
import type { ApiEnvelope } from "../types/common";
import type {
  AtualizarSecretariaRequest,
  AtualizarStatusSecretariaRequest,
  CriarSecretariaRequest,
  RedefinirSenhaSecretariaRequest,
  Secretaria,
} from "../types/domain";
import { parseWithSchema } from "../utils/parse-with-schema";
import { unwrapEnvelope } from "../utils/unwrap-envelope";

const CAMINHO_BASE_SECRETARIAS = "/secretarias";
const listaSecretariasSchema = z.array(secretariaSchema);

export const secretariaService = {
  async listar(): Promise<Secretaria[]> {
    const response = await httpClient.get<
      ApiEnvelope<Secretaria[]> | Secretaria[]
    >(CAMINHO_BASE_SECRETARIAS);

    return parseWithSchema(listaSecretariasSchema, unwrapEnvelope(response), {
      context: "secretaria.listar.response",
      message: "Resposta inesperada ao listar secretárias.",
      code: "INVALID_SECRETARIA_LIST_RESPONSE",
    });
  },

  async buscarPorId(id: number): Promise<Secretaria> {
    const safeId = parseWithSchema(numericIdSchema, id, {
      context: "secretaria.buscar-por-id.id",
      message: "Identificador de secretária inválido.",
      code: "INVALID_SECRETARIA_ID",
    });

    const response = await httpClient.get<ApiEnvelope<Secretaria> | Secretaria>(
      `${CAMINHO_BASE_SECRETARIAS}/${safeId}`,
    );

    return parseWithSchema(secretariaSchema, unwrapEnvelope(response), {
      context: "secretaria.buscar-por-id.response",
      message: "Resposta inesperada ao buscar secretária.",
      code: "INVALID_SECRETARIA_RESPONSE",
    });
  },

  async criar(payload: CriarSecretariaRequest): Promise<Secretaria> {
    const normalizedPayload = parseWithSchema(
      criarSecretariaRequestSchema,
      payload,
      {
        context: "secretaria.criar.payload",
        message: "Dados inválidos para criar secretária.",
        code: "INVALID_SECRETARIA_CREATE_PAYLOAD",
      },
    );

    const response = await httpClient.post<
      ApiEnvelope<Secretaria> | Secretaria,
      CriarSecretariaRequest
    >(CAMINHO_BASE_SECRETARIAS, normalizedPayload);

    return parseWithSchema(secretariaSchema, unwrapEnvelope(response), {
      context: "secretaria.criar.response",
      message: "Resposta inesperada ao criar secretária.",
      code: "INVALID_SECRETARIA_CREATE_RESPONSE",
    });
  },

  async atualizar(
    id: number,
    payload: AtualizarSecretariaRequest,
  ): Promise<Secretaria> {
    const safeId = parseWithSchema(numericIdSchema, id, {
      context: "secretaria.atualizar.id",
      message: "Identificador de secretária inválido.",
      code: "INVALID_SECRETARIA_ID",
    });
    const normalizedPayload = parseWithSchema(
      atualizarSecretariaRequestSchema,
      payload,
      {
        context: "secretaria.atualizar.payload",
        message: "Dados inválidos para atualizar secretária.",
        code: "INVALID_SECRETARIA_UPDATE_PAYLOAD",
      },
    );

    const response = await httpClient.put<
      ApiEnvelope<Secretaria> | Secretaria,
      AtualizarSecretariaRequest
    >(`${CAMINHO_BASE_SECRETARIAS}/${safeId}`, normalizedPayload);

    return parseWithSchema(secretariaSchema, unwrapEnvelope(response), {
      context: "secretaria.atualizar.response",
      message: "Resposta inesperada ao atualizar secretária.",
      code: "INVALID_SECRETARIA_UPDATE_RESPONSE",
    });
  },

  async atualizarStatus(
    id: number,
    payload: AtualizarStatusSecretariaRequest,
  ): Promise<Secretaria> {
    const safeId = parseWithSchema(numericIdSchema, id, {
      context: "secretaria.atualizar-status.id",
      message: "Identificador de secretária inválido.",
      code: "INVALID_SECRETARIA_ID",
    });
    const normalizedPayload = parseWithSchema(
      atualizarStatusSecretariaRequestSchema,
      payload,
      {
        context: "secretaria.atualizar-status.payload",
        message: "Dados inválidos para alterar status da secretária.",
        code: "INVALID_SECRETARIA_STATUS_PAYLOAD",
      },
    );

    const response = await httpClient.patch<
      ApiEnvelope<Secretaria> | Secretaria,
      AtualizarStatusSecretariaRequest
    >(`${CAMINHO_BASE_SECRETARIAS}/${safeId}/status`, normalizedPayload);

    return parseWithSchema(secretariaSchema, unwrapEnvelope(response), {
      context: "secretaria.atualizar-status.response",
      message: "Resposta inesperada ao alterar status da secretária.",
      code: "INVALID_SECRETARIA_STATUS_RESPONSE",
    });
  },

  async redefinirSenha(
    id: number,
    payload: RedefinirSenhaSecretariaRequest,
  ): Promise<void> {
    const safeId = parseWithSchema(numericIdSchema, id, {
      context: "secretaria.redefinir-senha.id",
      message: "Identificador de secretária inválido.",
      code: "INVALID_SECRETARIA_ID",
    });
    const normalizedPayload = parseWithSchema(
      redefinirSenhaSecretariaRequestSchema,
      payload,
      {
        context: "secretaria.redefinir-senha.payload",
        message: "Dados inválidos para redefinir senha.",
        code: "INVALID_SECRETARIA_PASSWORD_PAYLOAD",
      },
    );

    await httpClient.patch<void, RedefinirSenhaSecretariaRequest>(
      `${CAMINHO_BASE_SECRETARIAS}/${safeId}/senha`,
      normalizedPayload,
      { responseType: "void" },
    );
  },

  async inativar(id: number): Promise<void> {
    const safeId = parseWithSchema(numericIdSchema, id, {
      context: "secretaria.inativar.id",
      message: "Identificador de secretária inválido.",
      code: "INVALID_SECRETARIA_ID",
    });

    await httpClient.delete<void>(`${CAMINHO_BASE_SECRETARIAS}/${safeId}`, {
      responseType: "void",
    });
  },
};
