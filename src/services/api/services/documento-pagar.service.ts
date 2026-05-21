import { z } from "zod";
import { httpClient } from "../http/http-client";
import {
  cancelarDocumentoPagarRequestSchema,
  createPaginatedResponseSchema,
  documentoPagarCreateRequestSchema,
  documentoPagarSchema,
  documentoPagarUpdateRequestSchema,
  listDocumentosPagarRequestSchema,
  marcarDocumentoPagarPagoRequestSchema,
  numericIdSchema,
} from "../schemas/domain.schema";
import type { ApiEnvelope, PaginatedResponse } from "../types/common";
import type {
  AtualizarDocumentoPagarRequest,
  CancelarDocumentoPagarRequest,
  CriarDocumentoPagarRequest,
  DocumentoPagar,
  ListarDocumentosPagarRequest,
  MarcarDocumentoPagarPagoRequest,
} from "../types/domain";
import { parseWithSchema } from "../utils/parse-with-schema";
import { unwrapEnvelope } from "../utils/unwrap-envelope";

const DOCUMENTO_PAGAR_BASE_PATH = "/contas-pagar";

const paginatedDocumentoPagarSchema =
  createPaginatedResponseSchema(documentoPagarSchema);
const documentoPagarArraySchema = z.array(documentoPagarSchema);
const categoriaListSchema = z.array(z.string().trim());

export const documentoPagarService = {
  async listar(
    query?: ListarDocumentosPagarRequest,
  ): Promise<PaginatedResponse<DocumentoPagar>> {
    const normalizedQuery = query
      ? parseWithSchema(listDocumentosPagarRequestSchema, query, {
          context: "documento-pagar.list.query",
          message: "Parâmetros de busca de contas a pagar inválidos.",
          code: "INVALID_DOCUMENTO_PAGAR_LIST_QUERY",
        })
      : undefined;

    const response = await httpClient.get<
      | ApiEnvelope<PaginatedResponse<DocumentoPagar>>
      | PaginatedResponse<DocumentoPagar>
    >(DOCUMENTO_PAGAR_BASE_PATH, { query: normalizedQuery });

    return parseWithSchema(
      paginatedDocumentoPagarSchema,
      unwrapEnvelope(response),
      {
        context: "documento-pagar.list.response",
        message: "Resposta inesperada ao listar contas a pagar.",
        code: "INVALID_DOCUMENTO_PAGAR_LIST_RESPONSE",
      },
    );
  },

  async listarCategorias(): Promise<string[]> {
    const response = await httpClient.get<ApiEnvelope<string[]> | string[]>(
      `${DOCUMENTO_PAGAR_BASE_PATH}/categorias`,
    );

    return parseWithSchema(categoriaListSchema, unwrapEnvelope(response), {
      context: "documento-pagar.categorias.response",
      message: "Resposta inesperada ao listar categorias de contas a pagar.",
      code: "INVALID_DOCUMENTO_PAGAR_CATEGORIAS_RESPONSE",
    });
  },

  async buscarPorId(id: number): Promise<DocumentoPagar> {
    const safeId = parseWithSchema(numericIdSchema, id, {
      context: "documento-pagar.get-by-id.id",
      message: "Identificador de conta a pagar inválido.",
      code: "INVALID_DOCUMENTO_PAGAR_ID",
    });

    const response = await httpClient.get<
      ApiEnvelope<DocumentoPagar> | DocumentoPagar
    >(`${DOCUMENTO_PAGAR_BASE_PATH}/${safeId}`);

    return parseWithSchema(documentoPagarSchema, unwrapEnvelope(response), {
      context: "documento-pagar.get-by-id.response",
      message: "Resposta inesperada ao buscar conta a pagar.",
      code: "INVALID_DOCUMENTO_PAGAR_RESPONSE",
    });
  },

  async criar(payload: CriarDocumentoPagarRequest): Promise<DocumentoPagar[]> {
    const normalizedPayload = parseWithSchema(
      documentoPagarCreateRequestSchema,
      payload,
      {
        context: "documento-pagar.create.payload",
        message: "Dados inválidos para criar conta a pagar.",
        code: "INVALID_DOCUMENTO_PAGAR_CREATE_PAYLOAD",
      },
    );

    const response = await httpClient.post<
      ApiEnvelope<DocumentoPagar[]> | DocumentoPagar[],
      CriarDocumentoPagarRequest
    >(DOCUMENTO_PAGAR_BASE_PATH, normalizedPayload);

    return parseWithSchema(
      documentoPagarArraySchema,
      unwrapEnvelope(response),
      {
        context: "documento-pagar.create.response",
        message: "Resposta inesperada ao criar conta a pagar.",
        code: "INVALID_DOCUMENTO_PAGAR_CREATE_RESPONSE",
      },
    );
  },

  async atualizar(
    id: number,
    payload: AtualizarDocumentoPagarRequest,
  ): Promise<DocumentoPagar> {
    const safeId = parseWithSchema(numericIdSchema, id, {
      context: "documento-pagar.update.id",
      message: "Identificador de conta a pagar inválido.",
      code: "INVALID_DOCUMENTO_PAGAR_ID",
    });

    const normalizedPayload = parseWithSchema(
      documentoPagarUpdateRequestSchema,
      payload,
      {
        context: "documento-pagar.update.payload",
        message: "Dados inválidos para atualizar conta a pagar.",
        code: "INVALID_DOCUMENTO_PAGAR_UPDATE_PAYLOAD",
      },
    );

    const response = await httpClient.put<
      ApiEnvelope<DocumentoPagar> | DocumentoPagar,
      AtualizarDocumentoPagarRequest
    >(`${DOCUMENTO_PAGAR_BASE_PATH}/${safeId}`, normalizedPayload);

    return parseWithSchema(documentoPagarSchema, unwrapEnvelope(response), {
      context: "documento-pagar.update.response",
      message: "Resposta inesperada ao atualizar conta a pagar.",
      code: "INVALID_DOCUMENTO_PAGAR_UPDATE_RESPONSE",
    });
  },

  async marcarComoPago(
    id: number,
    payload: MarcarDocumentoPagarPagoRequest = {},
  ): Promise<DocumentoPagar> {
    const safeId = parseWithSchema(numericIdSchema, id, {
      context: "documento-pagar.pay.id",
      message: "Identificador de conta a pagar inválido.",
      code: "INVALID_DOCUMENTO_PAGAR_ID",
    });

    const normalizedPayload = parseWithSchema(
      marcarDocumentoPagarPagoRequestSchema,
      payload,
      {
        context: "documento-pagar.pay.payload",
        message: "Dados inválidos para marcar a conta como paga.",
        code: "INVALID_DOCUMENTO_PAGAR_PAYLOAD",
      },
    );

    const response = await httpClient.patch<
      ApiEnvelope<DocumentoPagar> | DocumentoPagar,
      MarcarDocumentoPagarPagoRequest
    >(`${DOCUMENTO_PAGAR_BASE_PATH}/${safeId}/pagar`, normalizedPayload);

    return parseWithSchema(documentoPagarSchema, unwrapEnvelope(response), {
      context: "documento-pagar.pay.response",
      message: "Resposta inesperada ao marcar a conta como paga.",
      code: "INVALID_DOCUMENTO_PAGAR_PAY_RESPONSE",
    });
  },

  async cancelar(
    id: number,
    payload: CancelarDocumentoPagarRequest,
  ): Promise<DocumentoPagar> {
    const safeId = parseWithSchema(numericIdSchema, id, {
      context: "documento-pagar.cancel.id",
      message: "Identificador de conta a pagar inválido.",
      code: "INVALID_DOCUMENTO_PAGAR_ID",
    });

    const normalizedPayload = parseWithSchema(
      cancelarDocumentoPagarRequestSchema,
      payload,
      {
        context: "documento-pagar.cancel.payload",
        message: "Dados inválidos para cancelar a conta.",
        code: "INVALID_DOCUMENTO_PAGAR_CANCEL_PAYLOAD",
      },
    );

    const response = await httpClient.patch<
      ApiEnvelope<DocumentoPagar> | DocumentoPagar,
      CancelarDocumentoPagarRequest
    >(`${DOCUMENTO_PAGAR_BASE_PATH}/${safeId}/cancelar`, normalizedPayload);

    return parseWithSchema(documentoPagarSchema, unwrapEnvelope(response), {
      context: "documento-pagar.cancel.response",
      message: "Resposta inesperada ao cancelar a conta.",
      code: "INVALID_DOCUMENTO_PAGAR_CANCEL_RESPONSE",
    });
  },

  async estornarPagamento(id: number): Promise<DocumentoPagar> {
    const safeId = parseWithSchema(numericIdSchema, id, {
      context: "documento-pagar.estornar-pagamento.id",
      message: "Identificador de conta a pagar inválido.",
      code: "INVALID_DOCUMENTO_PAGAR_ID",
    });

    const response = await httpClient.patch<
      ApiEnvelope<DocumentoPagar> | DocumentoPagar,
      undefined
    >(`${DOCUMENTO_PAGAR_BASE_PATH}/${safeId}/estornar-pagamento`, undefined);

    return parseWithSchema(documentoPagarSchema, unwrapEnvelope(response), {
      context: "documento-pagar.estornar-pagamento.response",
      message: "Resposta inesperada ao estornar pagamento da conta.",
      code: "INVALID_DOCUMENTO_PAGAR_ESTORNO_RESPONSE",
    });
  },

  async remover(id: number): Promise<void> {
    const safeId = parseWithSchema(numericIdSchema, id, {
      context: "documento-pagar.remove.id",
      message: "Identificador de conta a pagar inválido.",
      code: "INVALID_DOCUMENTO_PAGAR_ID",
    });

    await httpClient.delete<void>(`${DOCUMENTO_PAGAR_BASE_PATH}/${safeId}`, {
      responseType: "void",
    });
  },
};
