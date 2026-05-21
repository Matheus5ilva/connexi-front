import { httpClient } from "../http/http-client";
import {
  atualizarProfissionalRequestSchema,
  createPaginatedResponseSchema,
  criarProfissionalRequestSchema,
  entityIdSchema,
  listarProfissionaisRequestSchema,
  profissionalApiSchema,
  profissionalListaItemSchema,
} from "../schemas/domain.schema";
import type { ApiEnvelope, PaginatedResponse } from "../types/common";
import type {
  AtualizarProfissionalRequest,
  CriarProfissionalRequest,
  ListarProfissionaisRequest,
  Profissional,
  ProfissionalListaItem,
} from "../types/domain";
import { parseWithSchema } from "../utils/parse-with-schema";
import { unwrapEnvelope } from "../utils/unwrap-envelope";

const PROFISSIONAIS_BASE_PATH = "/profissionais";

const paginatedProfissionalSchema = createPaginatedResponseSchema(
  profissionalListaItemSchema,
);

export const profissionalService = {
  async listar(
    query?: ListarProfissionaisRequest,
  ): Promise<PaginatedResponse<ProfissionalListaItem>> {
    const normalizedQuery = query
      ? parseWithSchema(listarProfissionaisRequestSchema, query, {
          context: "profissional.listar.query",
          message: "Parâmetros de busca de profissionais inválidos.",
          code: "PROFISSIONAL_LISTA_PARAMETROS_INVALIDOS",
        })
      : undefined;

    const response = await httpClient.get<
      | ApiEnvelope<PaginatedResponse<ProfissionalListaItem>>
      | PaginatedResponse<ProfissionalListaItem>
    >(PROFISSIONAIS_BASE_PATH, { query: normalizedQuery });

    return parseWithSchema(
      paginatedProfissionalSchema,
      unwrapEnvelope(response),
      {
        context: "profissional.listar.response",
        message: "Resposta inesperada ao listar profissionais.",
        code: "PROFISSIONAL_LISTA_RESPOSTA_INVALIDA",
      },
    );
  },

  async buscarPorId(id: string | number): Promise<Profissional> {
    const safeId = parseWithSchema(entityIdSchema, String(id), {
      context: "profissional.buscar-por-id.id",
      message: "Identificador de profissional inválido.",
      code: "PROFISSIONAL_ID_INVALIDO",
    });

    const response = await httpClient.get<
      ApiEnvelope<Profissional> | Profissional
    >(`${PROFISSIONAIS_BASE_PATH}/${safeId}`);

    return parseWithSchema(profissionalApiSchema, unwrapEnvelope(response), {
      context: "profissional.buscar-por-id.response",
      message: "Resposta inesperada ao buscar profissional.",
      code: "PROFISSIONAL_RESPOSTA_INVALIDA",
    });
  },

  async criar(payload: CriarProfissionalRequest): Promise<Profissional> {
    const normalizedPayload = parseWithSchema(
      criarProfissionalRequestSchema,
      payload,
      {
        context: "profissional.criar.payload",
        message: "Dados inválidos para criar profissional.",
        code: "PROFISSIONAL_CRIAR_PAYLOAD_INVALIDO",
      },
    );

    const response = await httpClient.post<
      ApiEnvelope<Profissional> | Profissional,
      CriarProfissionalRequest
    >(PROFISSIONAIS_BASE_PATH, normalizedPayload);

    return parseWithSchema(profissionalApiSchema, unwrapEnvelope(response), {
      context: "profissional.criar.response",
      message: "Resposta inesperada ao criar profissional.",
      code: "PROFISSIONAL_CRIAR_RESPOSTA_INVALIDA",
    });
  },

  async atualizar(
    id: string | number,
    payload: AtualizarProfissionalRequest,
  ): Promise<Profissional> {
    const safeId = parseWithSchema(entityIdSchema, String(id), {
      context: "profissional.atualizar.id",
      message: "Identificador de profissional inválido.",
      code: "PROFISSIONAL_ID_INVALIDO",
    });

    const normalizedPayload = parseWithSchema(
      atualizarProfissionalRequestSchema,
      payload,
      {
        context: "profissional.atualizar.payload",
        message: "Dados inválidos para atualizar profissional.",
        code: "PROFISSIONAL_ATUALIZAR_PAYLOAD_INVALIDO",
      },
    );

    const response = await httpClient.put<
      ApiEnvelope<Profissional> | Profissional,
      AtualizarProfissionalRequest
    >(`${PROFISSIONAIS_BASE_PATH}/${safeId}`, normalizedPayload);

    return parseWithSchema(profissionalApiSchema, unwrapEnvelope(response), {
      context: "profissional.atualizar.response",
      message: "Resposta inesperada ao atualizar profissional.",
      code: "PROFISSIONAL_ATUALIZAR_RESPOSTA_INVALIDA",
    });
  },

  async remover(id: string | number): Promise<void> {
    const safeId = parseWithSchema(entityIdSchema, String(id), {
      context: "profissional.remover.id",
      message: "Identificador de profissional inválido.",
      code: "PROFISSIONAL_ID_INVALIDO",
    });

    await httpClient.delete<void>(`${PROFISSIONAIS_BASE_PATH}/${safeId}`, {
      responseType: "void",
    });
  },
};
