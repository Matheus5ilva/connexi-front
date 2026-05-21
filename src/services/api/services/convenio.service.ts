import { z } from "zod";
import { httpClient } from "../http/http-client";
import {
  atualizarConvenioRequestSchema,
  criarConvenioRequestSchema,
  convenioListItemSchema,
  convenioSchema,
  numericIdSchema,
} from "../schemas/domain.schema";
import type { ApiEnvelope } from "../types/common";
import type {
  AtualizarConvenioRequest,
  Convenio,
  ConvenioListaItem,
  CriarConvenioRequest,
} from "../types/domain";
import { parseWithSchema } from "../utils/parse-with-schema";
import { unwrapEnvelope } from "../utils/unwrap-envelope";

const CONVENIO_BASE_PATH = "/convenios";

const listaConveniosSchema = z.array(convenioListItemSchema);

export const convenioService = {
  async listar(): Promise<ConvenioListaItem[]> {
    const response = await httpClient.get<
      ApiEnvelope<ConvenioListaItem[]> | ConvenioListaItem[]
    >(CONVENIO_BASE_PATH);

    return parseWithSchema(listaConveniosSchema, unwrapEnvelope(response), {
      context: "convenio.list.response",
      message: "Resposta inesperada ao listar convênios.",
      code: "INVALID_CONVENIO_LIST_RESPONSE",
    });
  },

  async buscarPorId(id: number): Promise<Convenio> {
    const safeId = parseWithSchema(numericIdSchema, id, {
      context: "convenio.get-by-id.id",
      message: "Identificador de convênio inválido.",
      code: "INVALID_CONVENIO_ID",
    });

    const response = await httpClient.get<ApiEnvelope<Convenio> | Convenio>(
      `${CONVENIO_BASE_PATH}/${safeId}`,
    );

    return parseWithSchema(convenioSchema, unwrapEnvelope(response), {
      context: "convenio.get-by-id.response",
      message: "Resposta inesperada ao buscar convênio.",
      code: "INVALID_CONVENIO_RESPONSE",
    });
  },

  async criar(payload: CriarConvenioRequest): Promise<Convenio> {
    const payloadNormalizado = parseWithSchema(
      criarConvenioRequestSchema,
      payload,
      {
        context: "convenio.create.payload",
        message: "Dados inválidos para criar convênio.",
        code: "INVALID_CONVENIO_CREATE_PAYLOAD",
      },
    );

    const response = await httpClient.post<
      ApiEnvelope<Convenio> | Convenio,
      CriarConvenioRequest
    >(CONVENIO_BASE_PATH, payloadNormalizado);

    return parseWithSchema(convenioSchema, unwrapEnvelope(response), {
      context: "convenio.create.response",
      message: "Resposta inesperada ao criar convênio.",
      code: "INVALID_CONVENIO_CREATE_RESPONSE",
    });
  },

  async atualizar(
    id: number,
    payload: AtualizarConvenioRequest,
  ): Promise<Convenio> {
    const safeId = parseWithSchema(numericIdSchema, id, {
      context: "convenio.update.id",
      message: "Identificador de convênio inválido.",
      code: "INVALID_CONVENIO_ID",
    });

    const payloadNormalizado = parseWithSchema(
      atualizarConvenioRequestSchema,
      payload,
      {
        context: "convenio.update.payload",
        message: "Dados inválidos para atualizar convênio.",
        code: "INVALID_CONVENIO_UPDATE_PAYLOAD",
      },
    );

    const response = await httpClient.put<
      ApiEnvelope<Convenio> | Convenio,
      AtualizarConvenioRequest
    >(`${CONVENIO_BASE_PATH}/${safeId}`, payloadNormalizado);

    return parseWithSchema(convenioSchema, unwrapEnvelope(response), {
      context: "convenio.update.response",
      message: "Resposta inesperada ao atualizar convênio.",
      code: "INVALID_CONVENIO_UPDATE_RESPONSE",
    });
  },

  async remover(id: number): Promise<void> {
    const safeId = parseWithSchema(numericIdSchema, id, {
      context: "convenio.remove.id",
      message: "Identificador de convênio inválido.",
      code: "INVALID_CONVENIO_ID",
    });

    await httpClient.delete<void>(`${CONVENIO_BASE_PATH}/${safeId}`, {
      responseType: "void",
    });
  },
};
