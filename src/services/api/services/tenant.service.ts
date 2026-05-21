import { z } from "zod";
import { ehErroTenantInexistente } from "../errors/error-helpers";
import { isApiError } from "../errors/api-error";
import { httpClient } from "../http/http-client";
import { tenantSchema } from "../schemas/domain.schema";
import type { ApiEnvelope } from "../types/common";
import type { RenovarTokenRequest, Tenant } from "../types/domain";
import { parseWithSchema } from "../utils/parse-with-schema";
import { unwrapEnvelope } from "../utils/unwrap-envelope";

const AUTH_BASE_PATH = "/auth";
const TENANT_BASE_PATH = "/tenants";
const REFRESH_TOKEN_VALIDACAO_TENANT = "validacao-contexto-tenant";

const tenantListSchema = z.array(tenantSchema);

export const tenantService = {
  async obterAtual(): Promise<Tenant> {
    const response = await httpClient.get<ApiEnvelope<Tenant> | Tenant>(
      `${TENANT_BASE_PATH}/current`,
    );

    return parseWithSchema(tenantSchema, unwrapEnvelope(response), {
      context: "tenant.current.response",
      message: "Resposta inesperada ao buscar dados do tenant.",
      code: "INVALID_TENANT_CURRENT_RESPONSE",
    });
  },

  async listar(): Promise<Tenant[]> {
    const response = await httpClient.get<ApiEnvelope<Tenant[]> | Tenant[]>(
      TENANT_BASE_PATH,
    );

    return parseWithSchema(tenantListSchema, unwrapEnvelope(response), {
      context: "tenant.list.response",
      message: "Resposta inesperada ao listar tenants.",
      code: "INVALID_TENANT_LIST_RESPONSE",
    });
  },

  async validarContextoAtual(): Promise<void> {
    try {
      await httpClient.post<unknown, RenovarTokenRequest>(
        `${AUTH_BASE_PATH}/refresh-token`,
        { refreshToken: REFRESH_TOKEN_VALIDACAO_TENANT },
        {
          auth: false,
          aplicarInterceptorsErro: false,
        },
      );
    } catch (error) {
      if (ehErroTenantInexistente(error)) {
        throw error;
      }

      if (isApiError(error) && [400, 401, 403].includes(error.status ?? 0)) {
        return;
      }

      throw error;
    }
  },
};
