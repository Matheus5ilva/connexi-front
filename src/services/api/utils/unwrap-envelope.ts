import { z } from "zod";
import type { ApiEnvelope } from "../types/common";

const apiEnvelopeSchema = z
  .object({
    data: z.unknown(),
    message: z.unknown().optional(),
    meta: z.unknown().optional(),
  })
  .passthrough();

function pareceEnvelopeApi(response: unknown): response is ApiEnvelope<unknown> {
  const parsedEnvelope = apiEnvelopeSchema.safeParse(response);

  if (!parsedEnvelope.success) {
    return false;
  }

  if (
    Object.prototype.hasOwnProperty.call(parsedEnvelope.data, "message") ||
    Object.prototype.hasOwnProperty.call(parsedEnvelope.data, "meta")
  ) {
    return true;
  }

  const dados = parsedEnvelope.data.data;

  return typeof dados === "object" || dados === undefined;
}

export function unwrapEnvelope<T>(response: ApiEnvelope<T> | T): T {
  if (pareceEnvelopeApi(response)) {
    return response.data as T;
  }

  return response as T;
}
