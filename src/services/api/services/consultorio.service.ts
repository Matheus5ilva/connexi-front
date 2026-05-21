import { z } from "zod";
import { httpClient } from "../http/http-client";
import {
  atualizarConsultorioRequestSchema,
  consultorioListaItemSchema,
  consultorioSchema,
  criarConsultorioRequestSchema,
  numericIdSchema,
} from "../schemas/domain.schema";
import type { ApiEnvelope } from "../types/common";
import type {
  AtualizarConsultorioRequest,
  Consultorio,
  ConsultorioListaItem,
  CriarConsultorioRequest,
} from "../types/domain";
import { parseWithSchema } from "../utils/parse-with-schema";
import { unwrapEnvelope } from "../utils/unwrap-envelope";

const CAMINHO_BASE_CONSULTORIOS = "/consultorios";

const listaConsultoriosSchema = z.array(consultorioListaItemSchema);

function parseConsultorioId(id: number): number {
  return parseWithSchema(numericIdSchema, id, {
    context: "consultorio.id",
    message: "Identificador de consultório inválido.",
    code: "CONSULTORIO_ID_INVALIDO",
  });
}

export const consultorioService = {
  async listar(): Promise<ConsultorioListaItem[]> {
    const response = await httpClient.get<
      ApiEnvelope<ConsultorioListaItem[]> | ConsultorioListaItem[]
    >(CAMINHO_BASE_CONSULTORIOS);

    return parseWithSchema(
      listaConsultoriosSchema,
      unwrapEnvelope(response),
      {
        context: "consultorio.listar.response",
        message: "Resposta inesperada ao listar consultórios.",
        code: "CONSULTORIO_LISTA_RESPOSTA_INVALIDA",
      },
    );
  },

  async buscarPrincipal(): Promise<Consultorio | null> {
    const consultorios = await this.listar();
    if (consultorios.length === 0) {
      return null;
    }

    return this.buscarPorId(consultorios[0].id);
  },

  async buscarPorId(id: number): Promise<Consultorio> {
    const safeId = parseConsultorioId(id);

    const response = await httpClient.get<
      ApiEnvelope<Consultorio> | Consultorio
    >(`${CAMINHO_BASE_CONSULTORIOS}/${safeId}`);

    return parseWithSchema(consultorioSchema, unwrapEnvelope(response), {
      context: "consultorio.buscar-por-id.response",
      message: "Resposta inesperada ao buscar consultório.",
      code: "CONSULTORIO_RESPOSTA_INVALIDA",
    });
  },

  async criar(payload: CriarConsultorioRequest): Promise<Consultorio> {
    const normalizedPayload = parseWithSchema(
      criarConsultorioRequestSchema,
      payload,
      {
        context: "consultorio.criar.payload",
        message: "Dados inválidos para criar consultório.",
        code: "CONSULTORIO_CRIAR_PAYLOAD_INVALIDO",
      },
    );

    const response = await httpClient.post<
      ApiEnvelope<Consultorio> | Consultorio,
      CriarConsultorioRequest
    >(CAMINHO_BASE_CONSULTORIOS, normalizedPayload);

    return parseWithSchema(consultorioSchema, unwrapEnvelope(response), {
      context: "consultorio.criar.response",
      message: "Resposta inesperada ao criar consultório.",
      code: "CONSULTORIO_CRIAR_RESPOSTA_INVALIDA",
    });
  },

  async atualizar(
    id: number,
    payload: AtualizarConsultorioRequest,
  ): Promise<Consultorio> {
    const safeId = parseConsultorioId(id);

    const normalizedPayload = parseWithSchema(
      atualizarConsultorioRequestSchema,
      payload,
      {
        context: "consultorio.atualizar.payload",
        message: "Dados inválidos para atualizar consultório.",
        code: "CONSULTORIO_ATUALIZAR_PAYLOAD_INVALIDO",
      },
    );

    const response = await httpClient.put<
      ApiEnvelope<Consultorio> | Consultorio,
      AtualizarConsultorioRequest
    >(`${CAMINHO_BASE_CONSULTORIOS}/${safeId}`, normalizedPayload);

    return parseWithSchema(consultorioSchema, unwrapEnvelope(response), {
      context: "consultorio.atualizar.response",
      message: "Resposta inesperada ao atualizar consultório.",
      code: "CONSULTORIO_ATUALIZAR_RESPOSTA_INVALIDA",
    });
  },

  async remover(id: number): Promise<void> {
    const safeId = parseConsultorioId(id);

    await httpClient.delete<void>(`${CAMINHO_BASE_CONSULTORIOS}/${safeId}`, {
      responseType: "void",
    });
  },
};
