import type { ApiErrorResponse, FieldErrors } from "../types/common";

export type ApiErrorKind =
  | "http"
  | "network"
  | "timeout"
  | "aborted"
  | "unknown";

const STATUS_MESSAGES: Record<number, string> = {
  400: "A requisição enviada é inválida.",
  401: "Sua sessão expirou. Faça login novamente.",
  403: "Você não tem permissão para executar esta ação.",
  404: "Recurso não encontrado.",
  409: "Conflito de dados. Verifique as informações enviadas.",
  422: "Existem campos inválidos no formulário.",
  429: "Muitas requisições em sequência. Tente novamente em instantes.",
  500: "Erro interno no servidor.",
  502: "Serviço temporariamente indisponível.",
  503: "Serviço em manutenção. Tente novamente mais tarde.",
  504: "Tempo limite de resposta do servidor excedido.",
};

function defaultMessageForStatus(status?: number): string {
  if (!status) {
    return "Falha inesperada ao se comunicar com o servidor.";
  }

  return STATUS_MESSAGES[status] || "Não foi possível concluir a requisição.";
}

export function normalizarTextoErroServidor(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function dividirMensagensErro(mensagem: string): string[] {
  return mensagem
    .split(";")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function formatarMensagemAmigavelServidor(mensagem: string): string {
  const mensagemComAcentos = mensagem
    .trim()
    .replace(/'/g, '"')
    .replace(/\bnao e valida\b/gi, "não é válida")
    .replace(/\bnao e valido\b/gi, "não é válido")
    .replace(/\be valida\b/gi, "é válida")
    .replace(/\be valido\b/gi, "é válido")
    .replace(/\bConvenio\b/g, "Convênio")
    .replace(/\bconvenio\b/g, "convênio")
    .replace(/\bnao\b/gi, "não")
    .replace(/\binvalida\b/gi, "inválida")
    .replace(/\binvalido\b/gi, "inválido")
    .replace(/\btransicao\b/gi, "transição")
    .replace(/\bpossivel\b/gi, "possível")
    .replace(/\bhorario\b/gi, "horário")
    .replace(/\bduracao\b/gi, "duração")
    .replace(/\bconfiguracao\b/gi, "configuração")
    .replace(/\bservico\b/gi, "serviço")
    .replace(/\bja\b/gi, "já")
    .replace(/\brequisicao\b/gi, "requisição");

  const mensagemCapitalizada =
    mensagemComAcentos.charAt(0).toUpperCase() + mensagemComAcentos.slice(1);

  return /[.!?]$/.test(mensagemCapitalizada)
    ? mensagemCapitalizada
    : `${mensagemCapitalizada}.`;
}

function lerMensagensDeDetalhes(details: unknown): string[] {
  if (Array.isArray(details)) {
    return details.filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0,
    );
  }

  if (!details || typeof details !== "object") {
    return [];
  }

  const candidato = details as { message?: unknown };

  if (
    typeof candidato.message === "string" &&
    candidato.message.trim().length > 0
  ) {
    return dividirMensagensErro(candidato.message);
  }

  if (Array.isArray(candidato.message)) {
    return candidato.message.filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0,
    );
  }

  return [];
}

export function listarMensagensDetalhadasErroApi(error: ApiError): string[] {
  const mensagens = new Set<string>();

  dividirMensagensErro(error.message).forEach((mensagem) =>
    mensagens.add(mensagem),
  );
  lerMensagensDeDetalhes(error.details).forEach((mensagem) =>
    mensagens.add(mensagem),
  );

  Object.values(error.fieldErrors ?? {}).forEach((listaMensagens) => {
    listaMensagens
      .filter((mensagem) => mensagem.trim().length > 0)
      .forEach((mensagem) => mensagens.add(mensagem));
  });

  return Array.from(mensagens);
}

export function ehMensagemTecnicaDeValidacao(mensagem: string): boolean {
  const textoNormalizado = normalizarTextoErroServidor(mensagem);
  const textoOriginal = mensagem.trim();

  return (
    /^[a-zA-Z0-9_]+(?:[.[\]][a-zA-Z0-9_\]]*)+\s/.test(textoOriginal) ||
    textoNormalizado.includes("should not be empty") ||
    (textoNormalizado.includes("property") &&
      textoNormalizado.includes("should not exist")) ||
    textoNormalizado.includes("must be shorter than or equal to") ||
    textoNormalizado.includes("must be longer than or equal to") ||
    textoNormalizado.includes("must be an email") ||
    textoNormalizado.includes("must be a string") ||
    textoNormalizado.includes("must be an integer") ||
    textoNormalizado.includes("must be a number") ||
    textoNormalizado.includes("must be one of the following values")
  );
}

function ehErroDeContratoDaResposta(error: ApiError): boolean {
  return (
    error.kind === "unknown" &&
    (error.code?.startsWith("INVALID_") === true ||
      (typeof error.details === "object" &&
        error.details !== null &&
        "issues" in error.details))
  );
}

function resolverMensagemSegura(
  error: ApiError,
  fallbackMessage?: string,
): string {
  const mensagens = listarMensagensDetalhadasErroApi(error);
  const possuiMensagemTecnica = mensagens.some(ehMensagemTecnicaDeValidacao);
  const primeiraMensagemUtil =
    mensagens.find((mensagem) => !ehMensagemTecnicaDeValidacao(mensagem)) ??
    error.message;

  if (ehErroDeContratoDaResposta(error)) {
    return (
      fallbackMessage || "Não foi possível processar os dados. Tente novamente."
    );
  }

  if (possuiMensagemTecnica && (error.status === 400 || error.status === 422)) {
    return (
      fallbackMessage || "Verifique os campos informados e tente novamente."
    );
  }

  return formatarMensagemAmigavelServidor(primeiraMensagemUtil);
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly code?: string;
  readonly details?: unknown;
  readonly fieldErrors?: FieldErrors;
  readonly url?: string;
  readonly method?: string;
  readonly isRetryable: boolean;

  constructor(params: {
    kind: ApiErrorKind;
    message: string;
    status?: number;
    code?: string;
    details?: unknown;
    fieldErrors?: FieldErrors;
    url?: string;
    method?: string;
    cause?: unknown;
  }) {
    super(params.message);
    this.name = "ApiError";
    this.kind = params.kind;
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
    this.fieldErrors = params.fieldErrors;
    this.url = params.url;
    this.method = params.method;
    this.isRetryable =
      params.kind === "timeout" ||
      params.kind === "network" ||
      (typeof params.status === "number" && params.status >= 500);

    if (params.cause !== undefined) {
      // Preserve low-level details for observability.
      (this as Error & { cause?: unknown }).cause = params.cause;
    }
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function createHttpApiError(params: {
  status: number;
  payload?: ApiErrorResponse | unknown;
  url: string;
  method: string;
}): ApiError {
  const payload = params.payload as ApiErrorResponse | undefined;
  const payloadMessage = Array.isArray(payload?.message)
    ? payload.message.find((message) => message.trim().length > 0)
    : payload?.message;
  const message =
    payloadMessage?.trim() || defaultMessageForStatus(params.status);

  return new ApiError({
    kind: "http",
    message,
    status: params.status,
    code: payload?.code,
    details: payload?.details ?? payload,
    fieldErrors: payload?.errors,
    url: params.url,
    method: params.method,
  });
}

export function normalizeApiError(
  error: unknown,
  fallbackMessage = "Não foi possível concluir a operação.",
): ApiError {
  if (isApiError(error)) {
    return error;
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return new ApiError({
      kind: "aborted",
      message: "Requisição cancelada.",
      cause: error,
    });
  }

  if (error instanceof TypeError) {
    return new ApiError({
      kind: "network",
      message: "Falha de rede. Verifique sua conexão e tente novamente.",
      cause: error,
    });
  }

  return new ApiError({
    kind: "unknown",
    message: fallbackMessage,
    cause: error,
  });
}

export function toErrorMessage(error: unknown, fallback?: string): string {
  return resolverMensagemSegura(normalizeApiError(error, fallback), fallback);
}
