import { httpClient } from "../http/http-client";
import {
  consultarPainelRequestSchema,
  painelSchema,
} from "../schemas/domain.schema";
import type { ApiEnvelope } from "../types/common";
import type { ConsultarPainelRequest, Painel } from "../types/domain";
import { parseWithSchema } from "../utils/parse-with-schema";
import { unwrapEnvelope } from "../utils/unwrap-envelope";

const CAMINHO_BASE_PAINEL = "/dashboard";

export const painelService = {
  async consultar(query?: ConsultarPainelRequest): Promise<Painel> {
    const consulta = query
      ? parseWithSchema(consultarPainelRequestSchema, query, {
          context: "painel.consultar.query",
          message: "Parâmetros inválidos para consultar o painel.",
          code: "INVALID_PAINEL_QUERY",
        })
      : undefined;

    const response = await httpClient.get<ApiEnvelope<Painel> | Painel>(
      CAMINHO_BASE_PAINEL,
      { query: consulta },
    );

    return parseWithSchema(painelSchema, unwrapEnvelope(response), {
      context: "painel.consultar.response",
      message: "Resposta inesperada ao consultar o painel.",
      code: "INVALID_PAINEL_RESPONSE",
    });
  },
};
