import { z } from "zod";

const internalPathRegex = /^\/(?!\/)[^\s]*$/;

function stripControlChars(value: string): string {
  return value
    .split("")
    .filter((char) => {
      const charCode = char.charCodeAt(0);
      return !(charCode <= 31 || charCode === 127);
    })
    .join("");
}

export const routeNumericIdSchema = z.coerce.number().int().positive();

export function parseRouteNumericId(value: string | undefined): number | null {
  const parsed = routeNumericIdSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export const safeSearchTextSchema = z
  .string()
  .trim()
  .max(120, "Texto acima do limite permitido.")
  .transform(stripControlChars);

export function parseOptionalSearchText(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  const parsed = safeSearchTextSchema.safeParse(value);
  return parsed.success ? parsed.data : "";
}

export const returnToPathSchema = z
  .string()
  .trim()
  .min(1)
  .max(512)
  .transform(stripControlChars)
  .refine((path: string) => internalPathRegex.test(path), {
    message: "Caminho de retorno inválido.",
  })
  .refine((path: string) => !path.includes("\\"), {
    message: "Caminho de retorno inválido.",
  });

export function parseReturnToPath(value: unknown, fallback: string): string {
  const fallbackParsed = returnToPathSchema.safeParse(fallback);
  const safeFallback = fallbackParsed.success ? fallbackParsed.data : "/";
  const parsed = returnToPathSchema.safeParse(value);
  return parsed.success ? parsed.data : safeFallback;
}
