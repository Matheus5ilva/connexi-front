import { z } from "zod";
import { httpClient } from "../http/http-client";
import { parseWithSchema } from "../utils/parse-with-schema";
import type { CredencialAdministrativa } from "./admin-tenants.service";

const tenantIdSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(63)
  .regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/);

const dataLogSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/);

function opcoesAdministrativas(credencial: CredencialAdministrativa) {
  return {
    auth: false,
    aplicarInterceptorsErro: false,
    headers: {
      Authorization: credencial.authorization,
    },
    responseType: "blob" as const,
  };
}

export const adminTenantLogsService = {
  async baixar(
    credencial: CredencialAdministrativa,
    tenantId: string,
    data: string,
  ): Promise<Blob> {
    const tenantSeguro = parseWithSchema(tenantIdSchema, tenantId, {
      context: "admin.tenant-logs.tenant-id",
      message: "Tenant inválido para download de log.",
      code: "ADMIN_TENANT_LOG_TENANT_INVALIDO",
    });
    const dataSegura = parseWithSchema(dataLogSchema, data, {
      context: "admin.tenant-logs.data",
      message: "Data inválida para download de log.",
      code: "ADMIN_TENANT_LOG_DATA_INVALIDA",
    });

    return httpClient.get<Blob>(
      `/admin/tenants/${encodeURIComponent(tenantSeguro)}/logs/${dataSegura}/download`,
      opcoesAdministrativas(credencial),
    );
  },
};
