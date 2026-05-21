import { z } from "zod";
import { httpClient } from "../http/http-client";
import {
  formaPagamentoSchema,
  criarFormaPagamentoRequestSchema,
  numericIdSchema,
  atualizarFormaPagamentoRequestSchema,
} from "../schemas/domain.schema";
import type { ApiEnvelope } from "../types/common";
import type {
  AtualizarFormaPagamentoRequest,
  CriarFormaPagamentoRequest,
  FormaPagamento,
} from "../types/domain";
import { parseWithSchema } from "../utils/parse-with-schema";
import { unwrapEnvelope } from "../utils/unwrap-envelope";

const CAMINHO_BASE_FORMAS_PAGAMENTO = "/formas-pagamento";

const formaPagamentoListSchema = z.array(formaPagamentoSchema);

export const formaPagamentoService = {
  async listar(): Promise<FormaPagamento[]> {
    const response = await httpClient.get<
      ApiEnvelope<FormaPagamento[]> | FormaPagamento[]
    >(CAMINHO_BASE_FORMAS_PAGAMENTO);

    return parseWithSchema(formaPagamentoListSchema, unwrapEnvelope(response), {
      context: "forma-pagamento.listar.response",
      message: "Resposta inesperada ao listar formas de pagamento.",
      code: "INVALID_FORMA_PAGAMENTO_LIST_RESPONSE",
    });
  },

  async buscarPorId(id: number): Promise<FormaPagamento> {
    const safeId = parseWithSchema(numericIdSchema, id, {
      context: "forma-pagamento.buscar-por-id.id",
      message: "Identificador de forma de pagamento inválido.",
      code: "INVALID_FORMA_PAGAMENTO_ID",
    });

    const response = await httpClient.get<
      ApiEnvelope<FormaPagamento> | FormaPagamento
    >(`${CAMINHO_BASE_FORMAS_PAGAMENTO}/${safeId}`);

    return parseWithSchema(formaPagamentoSchema, unwrapEnvelope(response), {
      context: "forma-pagamento.buscar-por-id.response",
      message: "Resposta inesperada ao buscar forma de pagamento.",
      code: "INVALID_FORMA_PAGAMENTO_RESPONSE",
    });
  },

  async criar(payload: CriarFormaPagamentoRequest): Promise<FormaPagamento> {
    const normalizedPayload = parseWithSchema(
      criarFormaPagamentoRequestSchema,
      payload,
      {
        context: "forma-pagamento.criar.payload",
        message: "Dados inválidos para criar forma de pagamento.",
        code: "INVALID_FORMA_PAGAMENTO_CREATE_PAYLOAD",
      },
    );

    const response = await httpClient.post<
      ApiEnvelope<FormaPagamento> | FormaPagamento,
      CriarFormaPagamentoRequest
    >(CAMINHO_BASE_FORMAS_PAGAMENTO, normalizedPayload);

    return parseWithSchema(formaPagamentoSchema, unwrapEnvelope(response), {
      context: "forma-pagamento.criar.response",
      message: "Resposta inesperada ao criar forma de pagamento.",
      code: "INVALID_FORMA_PAGAMENTO_CREATE_RESPONSE",
    });
  },

  async atualizar(
    id: number,
    payload: AtualizarFormaPagamentoRequest,
  ): Promise<FormaPagamento> {
    const safeId = parseWithSchema(numericIdSchema, id, {
      context: "forma-pagamento.atualizar.id",
      message: "Identificador de forma de pagamento inválido.",
      code: "INVALID_FORMA_PAGAMENTO_ID",
    });

    const normalizedPayload = parseWithSchema(
      atualizarFormaPagamentoRequestSchema,
      payload,
      {
        context: "forma-pagamento.atualizar.payload",
        message: "Dados inválidos para atualizar forma de pagamento.",
        code: "INVALID_FORMA_PAGAMENTO_UPDATE_PAYLOAD",
      },
    );

    const response = await httpClient.put<
      ApiEnvelope<FormaPagamento> | FormaPagamento,
      AtualizarFormaPagamentoRequest
    >(`${CAMINHO_BASE_FORMAS_PAGAMENTO}/${safeId}`, normalizedPayload);

    return parseWithSchema(formaPagamentoSchema, unwrapEnvelope(response), {
      context: "forma-pagamento.atualizar.response",
      message: "Resposta inesperada ao atualizar forma de pagamento.",
      code: "INVALID_FORMA_PAGAMENTO_UPDATE_RESPONSE",
    });
  },

  async remover(id: number): Promise<void> {
    const safeId = parseWithSchema(numericIdSchema, id, {
      context: "forma-pagamento.remover.id",
      message: "Identificador de forma de pagamento inválido.",
      code: "INVALID_FORMA_PAGAMENTO_ID",
    });

    await httpClient.delete<void>(`${CAMINHO_BASE_FORMAS_PAGAMENTO}/${safeId}`, {
      responseType: "void",
    });
  },
};
