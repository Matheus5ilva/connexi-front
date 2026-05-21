import { httpClient } from "../http/http-client";
import {
  consultarFluxoCaixaRequestSchema,
  fluxoCaixaSchema,
} from "../schemas/domain.schema";
import type { ApiEnvelope } from "../types/common";
import type { ConsultarFluxoCaixaRequest, FluxoCaixa } from "../types/domain";
import { parseWithSchema } from "../utils/parse-with-schema";
import { unwrapEnvelope } from "../utils/unwrap-envelope";

const CAMINHO_BASE_FLUXO_CAIXA = "/financeiro/fluxo-caixa";

export const fluxoCaixaService = {
  async consultar(query?: ConsultarFluxoCaixaRequest): Promise<FluxoCaixa> {
    const normalizedQuery = query
      ? parseWithSchema(consultarFluxoCaixaRequestSchema, query, {
          context: "fluxo-caixa.consultar.query",
          message: "Parâmetros inválidos para consultar o fluxo de caixa.",
          code: "INVALID_FLUXO_CAIXA_QUERY",
        })
      : undefined;

    const response = await httpClient.get<ApiEnvelope<FluxoCaixa> | FluxoCaixa>(
      CAMINHO_BASE_FLUXO_CAIXA,
      { query: normalizedQuery },
    );

    return parseWithSchema(fluxoCaixaSchema, unwrapEnvelope(response), {
      context: "fluxo-caixa.consultar.response",
      message: "Resposta inesperada ao consultar o fluxo de caixa.",
      code: "INVALID_FLUXO_CAIXA_RESPONSE",
    });
  },
};
