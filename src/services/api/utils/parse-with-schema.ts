import { type ZodType } from "zod";
import { ApiError, type ApiErrorKind } from "../errors/api-error";
import { frontendLogger } from "../../logger/frontend-logger";

type ParseSchemaOptions = {
  context: string;
  message: string;
  code: string;
  kind?: ApiErrorKind;
};

export function parseWithSchema<T>(
  schema: ZodType<T>,
  payload: unknown,
  options: ParseSchemaOptions,
): T {
  const parsed = schema.safeParse(payload);

  if (parsed.success) {
    return parsed.data;
  }

  frontendLogger.warn("parseWithSchema", "Falha ao validar contrato de dados", {
    contexto: options.context,
    codigo: options.code,
    issues: parsed.error.issues,
  });

  throw new ApiError({
    kind: options.kind ?? "unknown",
    message: options.message,
    code: options.code,
    details: {
      context: options.context,
      issues: parsed.error.issues,
    },
  });
}
