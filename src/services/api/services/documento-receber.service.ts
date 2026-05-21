import { httpClient } from "../http/http-client";
import {
  cancelarDocumentoReceberRequestSchema,
  createPaginatedResponseSchema,
  documentoReceberSchema,
  listDocumentosReceberRequestSchema,
  marcarDocumentoRecebidoRequestSchema,
  numericIdSchema,
} from "../schemas/domain.schema";
import type { ApiEnvelope, PaginatedResponse } from "../types/common";
import type {
  CancelarDocumentoReceberRequest,
  DocumentoReceber,
  ListarDocumentosReceberRequest,
  MarcarDocumentoRecebidoRequest,
} from "../types/domain";
import { parseWithSchema } from "../utils/parse-with-schema";
import { unwrapEnvelope } from "../utils/unwrap-envelope";

const DOCUMENTO_RECEBER_BASE_PATH = "/contas-receber";

const paginatedDocumentoReceberSchema = createPaginatedResponseSchema(
  documentoReceberSchema,
);

export const documentoReceberService = {
  async listar(
    query?: ListarDocumentosReceberRequest,
  ): Promise<PaginatedResponse<DocumentoReceber>> {
    const normalizedQuery = query
      ? parseWithSchema(listDocumentosReceberRequestSchema, query, {
          context: "documento-receber.list.query",
          message: "Parâmetros de busca de contas a receber inválidos.",
          code: "INVALID_DOCUMENTO_RECEBER_LIST_QUERY",
        })
      : undefined;

    const response = await httpClient.get<
      | ApiEnvelope<PaginatedResponse<DocumentoReceber>>
      | PaginatedResponse<DocumentoReceber>
    >(DOCUMENTO_RECEBER_BASE_PATH, { query: normalizedQuery });

    return parseWithSchema(
      paginatedDocumentoReceberSchema,
      unwrapEnvelope(response),
      {
        context: "documento-receber.list.response",
        message: "Resposta inesperada ao listar contas a receber.",
        code: "INVALID_DOCUMENTO_RECEBER_LIST_RESPONSE",
      },
    );
  },

  async buscarPorId(id: number): Promise<DocumentoReceber> {
    const safeId = parseWithSchema(numericIdSchema, id, {
      context: "documento-receber.get-by-id.id",
      message: "Identificador de conta a receber inválido.",
      code: "INVALID_DOCUMENTO_RECEBER_ID",
    });

    const response = await httpClient.get<
      ApiEnvelope<DocumentoReceber> | DocumentoReceber
    >(`${DOCUMENTO_RECEBER_BASE_PATH}/${safeId}`);

    return parseWithSchema(documentoReceberSchema, unwrapEnvelope(response), {
      context: "documento-receber.get-by-id.response",
      message: "Resposta inesperada ao buscar conta a receber.",
      code: "INVALID_DOCUMENTO_RECEBER_RESPONSE",
    });
  },

  async marcarComoRecebido(
    id: number,
    payload: MarcarDocumentoRecebidoRequest = {},
  ): Promise<DocumentoReceber> {
    const safeId = parseWithSchema(numericIdSchema, id, {
      context: "documento-receber.receive.id",
      message: "Identificador de conta a receber inválido.",
      code: "INVALID_DOCUMENTO_RECEBER_ID",
    });

    const normalizedPayload = parseWithSchema(
      marcarDocumentoRecebidoRequestSchema,
      payload,
      {
        context: "documento-receber.receive.payload",
        message: "Dados inválidos para registrar o recebimento.",
        code: "INVALID_DOCUMENTO_RECEBER_RECEIVE_PAYLOAD",
      },
    );

    const response = await httpClient.patch<
      ApiEnvelope<DocumentoReceber> | DocumentoReceber,
      MarcarDocumentoRecebidoRequest
    >(`${DOCUMENTO_RECEBER_BASE_PATH}/${safeId}/receber`, normalizedPayload);

    return parseWithSchema(documentoReceberSchema, unwrapEnvelope(response), {
      context: "documento-receber.receive.response",
      message: "Resposta inesperada ao registrar o recebimento.",
      code: "INVALID_DOCUMENTO_RECEBER_RECEIVE_RESPONSE",
    });
  },

  async cancelar(
    id: number,
    payload: CancelarDocumentoReceberRequest,
  ): Promise<DocumentoReceber> {
    const safeId = parseWithSchema(numericIdSchema, id, {
      context: "documento-receber.cancel.id",
      message: "Identificador de conta a receber inválido.",
      code: "INVALID_DOCUMENTO_RECEBER_ID",
    });

    const normalizedPayload = parseWithSchema(
      cancelarDocumentoReceberRequestSchema,
      payload,
      {
        context: "documento-receber.cancel.payload",
        message: "Dados inválidos para cancelar a conta.",
        code: "INVALID_DOCUMENTO_RECEBER_CANCEL_PAYLOAD",
      },
    );

    const response = await httpClient.patch<
      ApiEnvelope<DocumentoReceber> | DocumentoReceber,
      CancelarDocumentoReceberRequest
    >(`${DOCUMENTO_RECEBER_BASE_PATH}/${safeId}/cancelar`, normalizedPayload);

    return parseWithSchema(documentoReceberSchema, unwrapEnvelope(response), {
      context: "documento-receber.cancel.response",
      message: "Resposta inesperada ao cancelar a conta a receber.",
      code: "INVALID_DOCUMENTO_RECEBER_CANCEL_RESPONSE",
    });
  },

  async estornarRecebimento(id: number): Promise<DocumentoReceber> {
    const safeId = parseWithSchema(numericIdSchema, id, {
      context: "documento-receber.reverse-receipt.id",
      message: "Identificador de conta a receber inválido.",
      code: "INVALID_DOCUMENTO_RECEBER_ID",
    });

    const response = await httpClient.patch<
      ApiEnvelope<DocumentoReceber> | DocumentoReceber,
      undefined
    >(`${DOCUMENTO_RECEBER_BASE_PATH}/${safeId}/estornar-recebimento`);

    return parseWithSchema(documentoReceberSchema, unwrapEnvelope(response), {
      context: "documento-receber.reverse-receipt.response",
      message: "Resposta inesperada ao estornar o recebimento.",
      code: "INVALID_DOCUMENTO_RECEBER_REVERSE_RECEIPT_RESPONSE",
    });
  },
};
