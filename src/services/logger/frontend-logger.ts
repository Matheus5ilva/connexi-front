import { apiConfig } from "../api/config/api.config";

type NivelLog = "error" | "warn" | "info" | "debug";

type DetalhesLog = Record<string, unknown>;

const CHAVES_SENSIVEIS = [
  "authorization",
  "cookie",
  "cpf",
  "senha",
  "password",
  "token",
  "jwt",
  "accessToken",
  "refreshToken",
  "payload",
  "body",
  "formData",
  "prontuario",
  "anamnese",
  "diagnostico",
  "conduta",
  "evolucao",
];

const PROFUNDIDADE_MAXIMA = 3;

function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function chaveSensivel(chave: string): boolean {
  const normalizada = chave.trim().toLowerCase();
  return CHAVES_SENSIVEIS.some((sensivel) =>
    normalizada.includes(sensivel.toLowerCase()),
  );
}

function mascararEmail(texto: string): string {
  return texto.replace(
    /\b([a-zA-Z0-9._%+-])([a-zA-Z0-9._%+-]*?)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g,
    (_email, primeiraLetra: string, _restante: string, dominio: string) =>
      `${primeiraLetra}***@${dominio}`,
  );
}

function sanitizarTexto(texto: string): string {
  return mascararEmail(texto)
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "***.***.***-**")
    .replace(/(token=)[^&\s]+/gi, "$1[removido]")
    .replace(/(authorization:\s*bearer\s+)[^\s]+/gi, "$1[removido]")
    .replace(/\bBearer\s+[A-Za-z0-9._-]+/g, "Bearer [removido]");
}

function sanitizarErro(erro: Error): DetalhesLog {
  return {
    nome: erro.name,
    mensagem: sanitizarTexto(erro.message),
    stack: import.meta.env.DEV ? sanitizarTexto(erro.stack ?? "") : undefined,
  };
}

function sanitizarValor(
  valor: unknown,
  chave = "",
  profundidade = 0,
): unknown {
  if (chave && chaveSensivel(chave)) {
    return "[removido]";
  }

  if (valor instanceof Error) {
    return sanitizarErro(valor);
  }

  if (typeof valor === "string") {
    return sanitizarTexto(valor);
  }

  if (
    typeof valor === "number" ||
    typeof valor === "boolean" ||
    valor === null ||
    valor === undefined
  ) {
    return valor;
  }

  if (profundidade >= PROFUNDIDADE_MAXIMA) {
    return "[objeto omitido]";
  }

  if (Array.isArray(valor)) {
    return valor
      .slice(0, 10)
      .map((item) => sanitizarValor(item, chave, profundidade + 1));
  }

  if (!ehRegistro(valor)) {
    return "[valor não serializável]";
  }

  return Object.fromEntries(
    Object.entries(valor).map(([chaveAtual, valorAtual]) => [
      chaveAtual,
      sanitizarValor(valorAtual, chaveAtual, profundidade + 1),
    ]),
  );
}

function obterConsole(nivel: NivelLog): (...data: unknown[]) => void {
  const consoleGlobal = globalThis.console;

  if (nivel === "error") {
    return consoleGlobal.error.bind(consoleGlobal);
  }

  if (nivel === "warn") {
    return consoleGlobal.warn.bind(consoleGlobal);
  }

  if (nivel === "debug") {
    return consoleGlobal.debug.bind(consoleGlobal);
  }

  return consoleGlobal.info.bind(consoleGlobal);
}

class FrontendLogger {
  error(contexto: string, acao: string, detalhes?: DetalhesLog): void {
    this.registrar("error", contexto, acao, detalhes);
  }

  warn(contexto: string, acao: string, detalhes?: DetalhesLog): void {
    this.registrar("warn", contexto, acao, detalhes);
  }

  info(contexto: string, acao: string, detalhes?: DetalhesLog): void {
    this.registrar("info", contexto, acao, detalhes);
  }

  debug(contexto: string, acao: string, detalhes?: DetalhesLog): void {
    this.registrar("debug", contexto, acao, detalhes);
  }

  private registrar(
    nivel: NivelLog,
    contexto: string,
    acao: string,
    detalhes?: DetalhesLog,
  ): void {
    if (nivel === "debug" && !import.meta.env.DEV) {
      return;
    }

    const tenant = apiConfig.tenantSubdomain ?? "sem-tenant";
    const mensagem = `[${contexto}] ${acao} | tenant=${tenant}`;
    const detalhesSeguros = detalhes
      ? sanitizarValor(detalhes, "detalhes")
      : undefined;
    const escrever = obterConsole(nivel);

    if (detalhesSeguros === undefined) {
      escrever(mensagem);
      return;
    }

    escrever(mensagem, detalhesSeguros);
  }
}

export const frontendLogger = new FrontendLogger();
