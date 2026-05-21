import { httpClient } from "../http/http-client";
import {
  especialidadeListaItemSchema,
  especialidadeSchema,
  especialidadeRequestSchema,
} from "../schemas/domain.schema";
import type { ApiEnvelope } from "../types/common";
import type {
  AtualizarEspecialidadeRequest,
  CriarEspecialidadeRequest,
  Especialidade,
  EspecialidadeListaItem,
} from "../types/domain";
import { parseWithSchema } from "../utils/parse-with-schema";
import { unwrapEnvelope } from "../utils/unwrap-envelope";

const ESPECIALIDADES_BASE_PATH = "/especialidades";

const listaEspecialidadeResponseSchema = especialidadeListaItemSchema.array();

function parseEspecialidadeId(id: number): number {
  return parseWithSchema(especialidadeSchema.shape.id, id, {
    context: "especialidade.id",
    message: "Identificador de especialidade inválido.",
    code: "ESPECIALIDADE_ID_INVALIDO",
  });
}

export const especialidadeService = {
  async listar(): Promise<EspecialidadeListaItem[]> {
    const response = await httpClient.get<
      ApiEnvelope<EspecialidadeListaItem[]> | EspecialidadeListaItem[]
    >(ESPECIALIDADES_BASE_PATH);

    return parseWithSchema(
      listaEspecialidadeResponseSchema,
      unwrapEnvelope(response),
      {
        context: "especialidade.listar.response",
        message: "Resposta inesperada ao listar especialidades.",
        code: "ESPECIALIDADE_LISTA_RESPOSTA_INVALIDA",
      },
    );
  },

  async buscarPorId(id: number): Promise<Especialidade> {
    const safeId = parseEspecialidadeId(id);

    const response = await httpClient.get<
      ApiEnvelope<Especialidade> | Especialidade
    >(`${ESPECIALIDADES_BASE_PATH}/${safeId}`);

    return parseWithSchema(especialidadeSchema, unwrapEnvelope(response), {
      context: "especialidade.buscar-por-id.response",
      message: "Resposta inesperada ao buscar especialidade.",
      code: "ESPECIALIDADE_RESPOSTA_INVALIDA",
    });
  },

  async criar(payload: CriarEspecialidadeRequest): Promise<Especialidade> {
    const normalizedPayload = parseWithSchema(
      especialidadeRequestSchema,
      payload,
      {
        context: "especialidade.criar.payload",
        message: "Dados inválidos para criar especialidade.",
        code: "ESPECIALIDADE_CRIAR_PAYLOAD_INVALIDO",
      },
    );

    const response = await httpClient.post<
      ApiEnvelope<Especialidade> | Especialidade,
      CriarEspecialidadeRequest
    >(ESPECIALIDADES_BASE_PATH, normalizedPayload);

    return parseWithSchema(especialidadeSchema, unwrapEnvelope(response), {
      context: "especialidade.criar.response",
      message: "Resposta inesperada ao criar especialidade.",
      code: "ESPECIALIDADE_CRIAR_RESPOSTA_INVALIDA",
    });
  },

  async atualizar(
    id: number,
    payload: AtualizarEspecialidadeRequest,
  ): Promise<Especialidade> {
    const safeId = parseEspecialidadeId(id);

    const normalizedPayload = parseWithSchema(
      especialidadeRequestSchema,
      payload,
      {
        context: "especialidade.atualizar.payload",
        message: "Dados inválidos para atualizar especialidade.",
        code: "ESPECIALIDADE_ATUALIZAR_PAYLOAD_INVALIDO",
      },
    );

    const response = await httpClient.put<
      ApiEnvelope<Especialidade> | Especialidade,
      AtualizarEspecialidadeRequest
    >(`${ESPECIALIDADES_BASE_PATH}/${safeId}`, normalizedPayload);

    return parseWithSchema(especialidadeSchema, unwrapEnvelope(response), {
      context: "especialidade.atualizar.response",
      message: "Resposta inesperada ao atualizar especialidade.",
      code: "ESPECIALIDADE_ATUALIZAR_RESPOSTA_INVALIDA",
    });
  },

  async remover(id: number): Promise<void> {
    const safeId = parseEspecialidadeId(id);

    await httpClient.delete<void>(`${ESPECIALIDADES_BASE_PATH}/${safeId}`, {
      responseType: "void",
    });
  },
};
