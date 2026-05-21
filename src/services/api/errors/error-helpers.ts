import { isApiError, normalizeApiError } from "./api-error";

const STATUS_TENANT_INEXISTENTE = 422;
const MENSAGEM_TENANT_INEXISTENTE = "tenant informado nao existe";

function normalizarTexto(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function lerMensagemErro(value: unknown): string[] {
  if (!value || typeof value !== "object") {
    return [];
  }

  const candidato = value as { message?: unknown };

  if (typeof candidato.message === "string" && candidato.message.trim()) {
    return [candidato.message];
  }

  if (Array.isArray(candidato.message)) {
    return candidato.message.filter(
      (mensagem): mensagem is string =>
        typeof mensagem === "string" && mensagem.trim().length > 0,
    );
  }

  return [];
}

function lerStatusCode(value: unknown): number | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidato = value as { statusCode?: unknown; status?: unknown };
  const status = candidato.statusCode ?? candidato.status;

  return typeof status === "number" && Number.isInteger(status) ? status : null;
}

function contemMensagemTenantInexistente(mensagens: string[]): boolean {
  return mensagens.some(
    (mensagem) => normalizarTexto(mensagem) === MENSAGEM_TENANT_INEXISTENTE,
  );
}

function temErrosDeCampo(error: ReturnType<typeof normalizeApiError>): boolean {
  return Object.keys(error.fieldErrors ?? {}).length > 0;
}

export function ehErroTenantInexistente(error: unknown): boolean {
  if (
    !isApiError(error) ||
    error.status !== STATUS_TENANT_INEXISTENTE ||
    temErrosDeCampo(error)
  ) {
    return false;
  }

  const statusDetalhes = lerStatusCode(error.details);
  if (statusDetalhes !== null && statusDetalhes !== STATUS_TENANT_INEXISTENTE) {
    return false;
  }

  return contemMensagemTenantInexistente([
    error.message,
    ...lerMensagemErro(error.details),
  ]);
}
