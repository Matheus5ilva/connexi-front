import { httpClient } from "../http/http-client";
import {
  atualizarPacienteRequestSchema,
  createPaginatedResponseSchema,
  criarPacienteRequestSchema,
  numericIdSchema,
  listarPacientesRequestSchema,
  pacienteListaItemSchema,
  pacienteSchema,
} from "../schemas/domain.schema";
import type { ApiEnvelope, PaginatedResponse } from "../types/common";
import type {
  AtualizarPacienteRequest,
  CriarPacienteRequest,
  ListarPacientesRequest,
  Paciente,
  PacienteListaItem,
} from "../types/domain";
import { parseWithSchema } from "../utils/parse-with-schema";
import { unwrapEnvelope } from "../utils/unwrap-envelope";

const PACIENTES_BASE_PATH = "/pacientes";

const paginatedPacienteListaSchema = createPaginatedResponseSchema(
  pacienteListaItemSchema,
);

export const pacienteService = {
  async listar(
    query?: ListarPacientesRequest,
  ): Promise<PaginatedResponse<PacienteListaItem>> {
    const normalizedQuery = query
      ? parseWithSchema(listarPacientesRequestSchema, query, {
          context: "paciente.listar.query",
          message: "Parâmetros de busca de pacientes inválidos.",
          code: "PACIENTE_LISTA_PARAMETROS_INVALIDOS",
        })
      : undefined;

    const response = await httpClient.get<
      | ApiEnvelope<PaginatedResponse<PacienteListaItem>>
      | PaginatedResponse<PacienteListaItem>
    >(PACIENTES_BASE_PATH, { query: normalizedQuery });

    return parseWithSchema(
      paginatedPacienteListaSchema,
      unwrapEnvelope(response),
      {
        context: "paciente.listar.response",
        message: "Resposta inesperada ao listar pacientes.",
        code: "PACIENTE_LISTA_RESPOSTA_INVALIDA",
      },
    );
  },

  async buscarPorId(id: number): Promise<Paciente> {
    const safeId = parseWithSchema(numericIdSchema, id, {
      context: "paciente.buscar-por-id.id",
      message: "Identificador de paciente inválido.",
      code: "PACIENTE_ID_INVALIDO",
    });

    const response = await httpClient.get<ApiEnvelope<Paciente> | Paciente>(
      `${PACIENTES_BASE_PATH}/${safeId}`,
    );

    return parseWithSchema(pacienteSchema, unwrapEnvelope(response), {
      context: "paciente.buscar-por-id.response",
      message: "Resposta inesperada ao buscar paciente.",
      code: "PACIENTE_RESPOSTA_INVALIDA",
    });
  },

  async criar(payload: CriarPacienteRequest): Promise<Paciente> {
    const normalizedPayload = parseWithSchema(
      criarPacienteRequestSchema,
      payload,
      {
        context: "paciente.criar.payload",
        message: "Dados inválidos para criar paciente.",
        code: "PACIENTE_CRIAR_PAYLOAD_INVALIDO",
      },
    );

    const response = await httpClient.post<
      ApiEnvelope<Paciente> | Paciente,
      CriarPacienteRequest
    >(PACIENTES_BASE_PATH, normalizedPayload);

    return parseWithSchema(pacienteSchema, unwrapEnvelope(response), {
      context: "paciente.criar.response",
      message: "Resposta inesperada ao criar paciente.",
      code: "PACIENTE_CRIAR_RESPOSTA_INVALIDA",
    });
  },

  async atualizar(
    id: number,
    payload: AtualizarPacienteRequest,
  ): Promise<Paciente> {
    const safeId = parseWithSchema(numericIdSchema, id, {
      context: "paciente.atualizar.id",
      message: "Identificador de paciente inválido.",
      code: "PACIENTE_ID_INVALIDO",
    });

    const normalizedPayload = parseWithSchema(
      atualizarPacienteRequestSchema,
      payload,
      {
        context: "paciente.atualizar.payload",
        message: "Dados inválidos para atualizar paciente.",
        code: "PACIENTE_ATUALIZAR_PAYLOAD_INVALIDO",
      },
    );

    const response = await httpClient.put<
      ApiEnvelope<Paciente> | Paciente,
      AtualizarPacienteRequest
    >(`${PACIENTES_BASE_PATH}/${safeId}`, normalizedPayload);

    return parseWithSchema(pacienteSchema, unwrapEnvelope(response), {
      context: "paciente.atualizar.response",
      message: "Resposta inesperada ao atualizar paciente.",
      code: "PACIENTE_ATUALIZAR_RESPOSTA_INVALIDA",
    });
  },

  async remover(id: number): Promise<void> {
    const safeId = parseWithSchema(numericIdSchema, id, {
      context: "paciente.remover.id",
      message: "Identificador de paciente inválido.",
      code: "PACIENTE_ID_INVALIDO",
    });

    await httpClient.delete<void>(`${PACIENTES_BASE_PATH}/${safeId}`, {
      responseType: "void",
    });
  },
};
