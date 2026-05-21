import { httpClient } from "../http/http-client";
import {
  agendamentoApiSchema,
  agendamentoListagemResponseSchema,
  atualizarAgendamentoRequestSchema,
  atualizarStatusAgendamentoRequestSchema,
  criarAgendamentoRequestSchema,
  entityIdSchema,
  listarAgendamentosRequestSchema,
} from "../schemas/domain.schema";
import type { ApiEnvelope, PaginatedResponse } from "../types/common";
import type {
  Agendamento,
  AtualizarAgendamentoRequest,
  AtualizarStatusAgendamentoRequest,
  CriarAgendamentoRequest,
  ListarAgendamentosRequest,
} from "../types/domain";
import { parseWithSchema } from "../utils/parse-with-schema";
import { normalizarRequisicaoPaginada } from "../utils/paginacao";
import { unwrapEnvelope } from "../utils/unwrap-envelope";

const AGENDAMENTOS_BASE_PATH = "/agendamentos";

function criarMetaPaginacaoAgendamento(
  totalItems: number,
  query?: ListarAgendamentosRequest,
): PaginatedResponse<Agendamento>["meta"] {
  const page = Math.max(1, query?.page ?? 1);
  const pageSizeBase = query?.pageSize ?? query?.limit ?? 10;
  const pageSize = Math.max(1, pageSizeBase);

  return {
    page,
    limit: pageSize,
    pageSize,
    total: totalItems,
    totalItems,
    totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize),
  };
}

export const agendamentoService = {
  async listar(
    query?: ListarAgendamentosRequest,
  ): Promise<PaginatedResponse<Agendamento>> {
    const normalizedQuery = query
      ? parseWithSchema(
          listarAgendamentosRequestSchema,
          normalizarRequisicaoPaginada(query),
          {
          context: "agendamento.listar.query",
          message: "Parâmetros de busca de agendamentos inválidos.",
          code: "INVALID_AGENDAMENTO_LIST_QUERY",
          },
        )
      : undefined;

    const response = await httpClient.get<
      ApiEnvelope<PaginatedResponse<Agendamento>> | PaginatedResponse<Agendamento>
    >(AGENDAMENTOS_BASE_PATH, { query: normalizedQuery });

    const respostaNormalizada = parseWithSchema(
      agendamentoListagemResponseSchema,
      unwrapEnvelope(response),
      {
        context: "agendamento.listar.response",
        message: "Resposta inesperada ao listar agendamentos.",
        code: "INVALID_AGENDAMENTO_LIST_RESPONSE",
      },
    );

    return {
      items: respostaNormalizada.items,
      meta:
        respostaNormalizada.meta ??
        criarMetaPaginacaoAgendamento(
          respostaNormalizada.items.length,
          normalizedQuery,
        ),
    };
  },

  async buscarPorId(id: string | number): Promise<Agendamento> {
    const safeId = parseWithSchema(entityIdSchema, String(id), {
      context: "agendamento.buscar-por-id.id",
      message: "Identificador de agendamento inválido.",
      code: "INVALID_AGENDAMENTO_ID",
    });

    const response = await httpClient.get<ApiEnvelope<Agendamento> | Agendamento>(
      `${AGENDAMENTOS_BASE_PATH}/${safeId}`,
    );

    return parseWithSchema(agendamentoApiSchema, unwrapEnvelope(response), {
      context: "agendamento.buscar-por-id.response",
      message: "Resposta inesperada ao buscar agendamento.",
      code: "INVALID_AGENDAMENTO_RESPONSE",
    });
  },

  async criar(payload: CriarAgendamentoRequest): Promise<Agendamento> {
    const normalizedPayload = parseWithSchema(
      criarAgendamentoRequestSchema,
      payload,
      {
        context: "agendamento.criar.payload",
        message: "Dados inválidos para criar agendamento.",
        code: "INVALID_AGENDAMENTO_CREATE_PAYLOAD",
      },
    );

    const response = await httpClient.post<
      ApiEnvelope<Agendamento> | Agendamento,
      CriarAgendamentoRequest
    >(AGENDAMENTOS_BASE_PATH, normalizedPayload);

    return parseWithSchema(agendamentoApiSchema, unwrapEnvelope(response), {
      context: "agendamento.criar.response",
      message: "Resposta inesperada ao criar agendamento.",
      code: "INVALID_AGENDAMENTO_CREATE_RESPONSE",
    });
  },

  async criarConsultaAvulsa(
    payload: CriarAgendamentoRequest,
  ): Promise<Agendamento> {
    const normalizedPayload = parseWithSchema(
      criarAgendamentoRequestSchema,
      payload,
      {
        context: "agendamento.criar-consulta-avulsa.payload",
        message: "Dados inválidos para iniciar consulta avulsa.",
        code: "INVALID_AGENDAMENTO_WALK_IN_PAYLOAD",
      },
    );

    const response = await httpClient.post<
      ApiEnvelope<Agendamento> | Agendamento,
      CriarAgendamentoRequest
    >(`${AGENDAMENTOS_BASE_PATH}/consulta-avulsa`, normalizedPayload);

    return parseWithSchema(agendamentoApiSchema, unwrapEnvelope(response), {
      context: "agendamento.criar-consulta-avulsa.response",
      message: "Resposta inesperada ao iniciar consulta avulsa.",
      code: "INVALID_AGENDAMENTO_WALK_IN_RESPONSE",
    });
  },

  async atualizar(
    id: string | number,
    payload: AtualizarAgendamentoRequest,
  ): Promise<Agendamento> {
    const safeId = parseWithSchema(entityIdSchema, String(id), {
      context: "agendamento.atualizar.id",
      message: "Identificador de agendamento inválido.",
      code: "INVALID_AGENDAMENTO_ID",
    });

    const normalizedPayload = parseWithSchema(
      atualizarAgendamentoRequestSchema,
      payload,
      {
        context: "agendamento.atualizar.payload",
        message: "Dados inválidos para atualizar agendamento.",
        code: "INVALID_AGENDAMENTO_UPDATE_PAYLOAD",
      },
    );

    const response = await httpClient.put<
      ApiEnvelope<Agendamento> | Agendamento,
      AtualizarAgendamentoRequest
    >(`${AGENDAMENTOS_BASE_PATH}/${safeId}`, normalizedPayload);

    return parseWithSchema(agendamentoApiSchema, unwrapEnvelope(response), {
      context: "agendamento.atualizar.response",
      message: "Resposta inesperada ao atualizar agendamento.",
      code: "INVALID_AGENDAMENTO_UPDATE_RESPONSE",
    });
  },

  async atualizarStatus(
    id: string | number,
    payload: AtualizarStatusAgendamentoRequest,
  ): Promise<Agendamento> {
    const safeId = parseWithSchema(entityIdSchema, String(id), {
      context: "agendamento.atualizar-status.id",
      message: "Identificador de agendamento inválido.",
      code: "INVALID_AGENDAMENTO_ID",
    });

    const normalizedPayload = parseWithSchema(
      atualizarStatusAgendamentoRequestSchema,
      payload,
      {
        context: "agendamento.atualizar-status.payload",
        message: "Dados inválidos para atualizar o status do agendamento.",
        code: "INVALID_AGENDAMENTO_STATUS_PAYLOAD",
      },
    );

    const response = await httpClient.patch<
      ApiEnvelope<Agendamento> | Agendamento,
      AtualizarStatusAgendamentoRequest
    >(`${AGENDAMENTOS_BASE_PATH}/${safeId}/status`, normalizedPayload);

    return parseWithSchema(agendamentoApiSchema, unwrapEnvelope(response), {
      context: "agendamento.atualizar-status.response",
      message: "Resposta inesperada ao atualizar o status do agendamento.",
      code: "INVALID_AGENDAMENTO_STATUS_RESPONSE",
    });
  },
};
