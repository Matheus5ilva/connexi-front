import { z } from "zod";
import { emailNormalizadoSchema } from "../schemas/auth.schema";
import { apiConfig } from "../services/api/config/api.config";
import type { ApiError } from "../services/api/errors/api-error";
import { ehErroTenantInexistente } from "../services/api/errors/error-helpers";
import { httpClient } from "../services/api/http/http-client";
import type {
  MinhaConta,
  PerfilUsuario,
  RespostaLogin,
} from "../services/api/types/domain";

const CHAVE_STORAGE_USUARIO_AUTENTICADO = "connexi.auth-user";
const ROTA_TENANT_INEXISTENTE = "/tenant-inexistente";
const ouvintesSessaoAutenticada = new Set<() => void>();
let snapshotSessaoAutenticadaAtual: SnapshotSessaoAutenticada | null = null;

export type UsuarioAutenticado = {
  id: string;
  tenantId: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  profissionalId?: number;
  deveTrocarSenha: boolean;
};

export type SnapshotSessaoAutenticada = {
  accessToken: string | null;
  isAuthenticated: boolean;
  user: UsuarioAutenticado | null;
};

export type ContextoAcessoUsuarioAutenticado = {
  perfil: PerfilUsuario | null;
  profissionalId: number | null;
  possuiAcessoGlobal: boolean;
  exigeProfissionalVinculado: boolean;
  sessaoValidaNoTenantAtual: boolean;
};

export function usuarioEhMaster(
  usuario: Pick<UsuarioAutenticado, "perfil"> | null | undefined,
): boolean {
  return usuario?.perfil === "MASTER";
}

export function possuiSessaoNoTenantAtual(params: {
  isAuthenticated: boolean;
  user: Pick<UsuarioAutenticado, "tenantId"> | null;
}): boolean {
  if (!params.isAuthenticated || !params.user) {
    return false;
  }

  if (!apiConfig.tenantSubdomain) {
    return true;
  }

  return params.user.tenantId === apiConfig.tenantSubdomain;
}

export function obterContextoAcessoUsuarioAutenticado(params: {
  isAuthenticated: boolean;
  user: UsuarioAutenticado | null;
}): ContextoAcessoUsuarioAutenticado {
  const sessaoValidaNoTenantAtual = possuiSessaoNoTenantAtual({
    isAuthenticated: params.isAuthenticated,
    user: params.user,
  });

  if (!sessaoValidaNoTenantAtual || !params.user) {
    return {
      perfil: null,
      profissionalId: null,
      possuiAcessoGlobal: false,
      exigeProfissionalVinculado: false,
      sessaoValidaNoTenantAtual: false,
    };
  }

  const possuiAcessoGlobal = usuarioEhMaster(params.user);

  return {
    perfil: params.user.perfil,
    profissionalId: params.user.profissionalId ?? null,
    possuiAcessoGlobal,
    exigeProfissionalVinculado: !possuiAcessoGlobal,
    sessaoValidaNoTenantAtual,
  };
}

const usuarioAutenticadoSchema = z.object({
  id: z.string().trim().min(1).max(120),
  tenantId: z.string().trim().min(1).max(120),
  nome: z.string().trim().min(1).max(120),
  email: emailNormalizadoSchema,
  perfil: z.enum(["MASTER", "PROFISSIONAL"]),
  profissionalId: z.number().int().positive().optional(),
  deveTrocarSenha: z.boolean(),
});

function podeUsarStorage(): boolean {
  return typeof window !== "undefined";
}

function snapshotsSaoIguais(
  atual: SnapshotSessaoAutenticada,
  proximo: SnapshotSessaoAutenticada,
): boolean {
  return (
    atual.accessToken === proximo.accessToken &&
    atual.isAuthenticated === proximo.isAuthenticated &&
    atual.user?.id === proximo.user?.id &&
    atual.user?.tenantId === proximo.user?.tenantId &&
    atual.user?.nome === proximo.user?.nome &&
    atual.user?.email === proximo.user?.email &&
    atual.user?.perfil === proximo.user?.perfil &&
    atual.user?.profissionalId === proximo.user?.profissionalId &&
    atual.user?.deveTrocarSenha === proximo.user?.deveTrocarSenha
  );
}

function notificarMudancaSessaoAutenticada(): void {
  atualizarSnapshotSessaoAutenticada();
  ouvintesSessaoAutenticada.forEach((listener) => listener());
}

function lerAccessTokenArmazenado(): string | null {
  if (!podeUsarStorage()) {
    return null;
  }

  try {
    const rawToken = window.sessionStorage.getItem(apiConfig.authTokenStorageKey);
    const tokenNormalizado = rawToken?.trim() || "";
    return tokenNormalizado.length > 0 ? tokenNormalizado : null;
  } catch {
    return null;
  }
}

function salvarUsuarioAutenticado(user: UsuarioAutenticado): void {
  if (!podeUsarStorage()) {
    return;
  }

  const usuarioValidado = usuarioAutenticadoSchema.safeParse(user);
  if (!usuarioValidado.success) {
    return;
  }

  try {
    window.sessionStorage.setItem(
      CHAVE_STORAGE_USUARIO_AUTENTICADO,
      JSON.stringify(usuarioValidado.data),
    );
  } catch {
    // Mantém o fluxo estável mesmo quando o storage está indisponível.
  }
}

function limparUsuarioAutenticadoArmazenado(): void {
  if (!podeUsarStorage()) {
    return;
  }

  try {
    window.sessionStorage.removeItem(CHAVE_STORAGE_USUARIO_AUTENTICADO);
  } catch {
    // Mantém o fluxo estável mesmo quando o storage está indisponível.
  }
}

export function obterUsuarioAutenticado(): UsuarioAutenticado | null {
  if (!podeUsarStorage()) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(CHAVE_STORAGE_USUARIO_AUTENTICADO);
    if (!raw) {
      return null;
    }

    const usuarioValidado = usuarioAutenticadoSchema.safeParse(JSON.parse(raw));
    return usuarioValidado.success ? usuarioValidado.data : null;
  } catch {
    return null;
  }
}

export function obterSnapshotSessaoAutenticada(): SnapshotSessaoAutenticada {
  const accessToken = lerAccessTokenArmazenado();

  const proximoSnapshot = {
    accessToken,
    isAuthenticated: Boolean(accessToken),
    user: obterUsuarioAutenticado(),
  };

  if (
    snapshotSessaoAutenticadaAtual &&
    snapshotsSaoIguais(snapshotSessaoAutenticadaAtual, proximoSnapshot)
  ) {
    return snapshotSessaoAutenticadaAtual;
  }

  snapshotSessaoAutenticadaAtual = proximoSnapshot;
  return snapshotSessaoAutenticadaAtual;
}

function atualizarSnapshotSessaoAutenticada(): void {
  snapshotSessaoAutenticadaAtual = null;
  obterSnapshotSessaoAutenticada();
}

export function inscreverSessaoAutenticada(listener: () => void): () => void {
  ouvintesSessaoAutenticada.add(listener);

  return () => {
    ouvintesSessaoAutenticada.delete(listener);
  };
}

export function iniciarSessaoApi(
  respostaLogin: RespostaLogin,
): UsuarioAutenticado {
  const accessToken = respostaLogin.accessToken.trim();
  if (accessToken) {
    httpClient.setAuthToken(accessToken);
  }

  const usuarioAutenticado: UsuarioAutenticado = {
    id: respostaLogin.usuario.email.trim().toLowerCase(),
    tenantId: respostaLogin.usuario.tenantId,
    nome: respostaLogin.usuario.name.trim(),
    email: respostaLogin.usuario.email.trim().toLowerCase(),
    perfil: respostaLogin.usuario.role,
    deveTrocarSenha: respostaLogin.usuario.deveTrocarSenha,
  };

  salvarUsuarioAutenticado(usuarioAutenticado);
  notificarMudancaSessaoAutenticada();

  return usuarioAutenticado;
}

export function atualizarSessaoComMinhaConta(
  minhaConta: MinhaConta,
): UsuarioAutenticado {
  const usuarioAutenticado: UsuarioAutenticado = {
    id: minhaConta.email.trim().toLowerCase(),
    tenantId: minhaConta.tenantId,
    nome: minhaConta.nome.trim(),
    email: minhaConta.email.trim().toLowerCase(),
    perfil: minhaConta.perfil,
    profissionalId: minhaConta.profissionalId ?? undefined,
    deveTrocarSenha: minhaConta.deveTrocarSenha,
  };

  salvarUsuarioAutenticado(usuarioAutenticado);
  notificarMudancaSessaoAutenticada();

  return usuarioAutenticado;
}

export function encerrarSessaoAutenticada(): void {
  httpClient.clearAuthToken();
  limparUsuarioAutenticadoArmazenado();
  notificarMudancaSessaoAutenticada();
}

function tratarErroNaoAutorizado(error: ApiError): ApiError {
  if (error.status === 401) {
    encerrarSessaoAutenticada();
  }

  return error;
}

function redirecionarTenantInexistente(error: ApiError): ApiError {
  if (!ehErroTenantInexistente(error) || typeof window === "undefined") {
    return error;
  }

  encerrarSessaoAutenticada();

  if (window.location.pathname !== ROTA_TENANT_INEXISTENTE) {
    window.location.replace(ROTA_TENANT_INEXISTENTE);
  }

  return error;
}

httpClient.useErrorInterceptor(redirecionarTenantInexistente);
httpClient.useErrorInterceptor(tratarErroNaoAutorizado);
