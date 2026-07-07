import { afterEach, describe, expect, it } from "vitest";
import {
  atualizarSessaoComMinhaConta,
  encerrarSessaoAutenticada,
  iniciarSessaoApi,
  obterContextoAcessoUsuarioAutenticado,
  obterUltimaRotaPrivada,
  obterUsuarioAutenticado,
  salvarUltimaRotaPrivada,
} from "./session";

const ACCESS_TOKEN_KEY = "connexi.access-token";
const AUTH_USER_KEY = "connexi.auth-user";

describe("auth session storage", () => {
  afterEach(() => {
    window.sessionStorage.clear();
  });

  it("salva somente accessToken e dados publicos do usuario apos login", () => {
    const usuario = iniciarSessaoApi({
      accessToken: "access-token-de-teste",
      expiresIn: 3600,
      usuario: {
        name: " Usuario Teste ",
        email: "USUARIO@TESTE.LOCAL",
        role: "MASTER",
        deveTrocarSenha: false,
        tenantId: "tenant-teste",
      },
    });

    expect(usuario).toEqual({
      id: "usuario@teste.local",
      tenantId: "tenant-teste",
      nome: "Usuario Teste",
      email: "usuario@teste.local",
      perfil: "MASTER",
      podeAcessarFinanceiro: false,
      deveTrocarSenha: false,
    });
    expect(window.sessionStorage.getItem(ACCESS_TOKEN_KEY)).toBe(
      "access-token-de-teste",
    );
    expect(window.sessionStorage.getItem(AUTH_USER_KEY)).toContain(
      "usuario@teste.local",
    );
    expect(JSON.stringify(window.sessionStorage)).not.toContain("refreshToken");
    expect(JSON.stringify(window.sessionStorage)).not.toContain(
      "refresh-token",
    );
  });

  it("complementa sessao com minha conta sem armazenar refreshToken", () => {
    atualizarSessaoComMinhaConta({
      id: "1",
      tenantId: "tenant-teste",
      nome: "Profissional Teste",
      email: "profissional@teste.local",
      perfil: "PROFISSIONAL",
      profissionalId: 10,
      podeAcessarFinanceiro: false,
      deveTrocarSenha: false,
    });

    expect(obterUsuarioAutenticado()).toEqual({
      id: "profissional@teste.local",
      tenantId: "tenant-teste",
      nome: "Profissional Teste",
      email: "profissional@teste.local",
      perfil: "PROFISSIONAL",
      profissionalId: 10,
      podeAcessarFinanceiro: false,
      deveTrocarSenha: false,
    });
    expect(JSON.stringify(window.sessionStorage)).not.toContain("refreshToken");
  });

  it("mantem permissao financeira da secretaria na sessao", () => {
    atualizarSessaoComMinhaConta({
      id: "2",
      tenantId: "tenant-teste",
      nome: "Secretaria Teste",
      email: "secretaria@teste.local",
      perfil: "SECRETARIA",
      secretariaId: 20,
      podeAcessarFinanceiro: true,
      deveTrocarSenha: false,
    });

    expect(obterUsuarioAutenticado()).toEqual({
      id: "secretaria@teste.local",
      tenantId: "tenant-teste",
      nome: "Secretaria Teste",
      email: "secretaria@teste.local",
      perfil: "SECRETARIA",
      secretariaId: 20,
      podeAcessarFinanceiro: true,
      deveTrocarSenha: false,
    });
    expect(JSON.stringify(window.sessionStorage)).not.toContain("refreshToken");
  });

  it("nao exige profissional vinculado para secretaria", () => {
    const user = atualizarSessaoComMinhaConta({
      id: "2",
      tenantId: "tenant-teste",
      nome: "Secretaria Teste",
      email: "secretaria@teste.local",
      perfil: "SECRETARIA",
      secretariaId: 20,
      podeAcessarFinanceiro: false,
      deveTrocarSenha: false,
    });

    expect(
      obterContextoAcessoUsuarioAutenticado({
        isAuthenticated: true,
        user,
      }).exigeProfissionalVinculado,
    ).toBe(false);
  });

  it("limpa accessToken e usuario autenticado ao encerrar sessao", () => {
    iniciarSessaoApi({
      accessToken: "access-token-de-teste",
      expiresIn: 3600,
      usuario: {
        name: "Usuario Teste",
        email: "usuario@teste.local",
        role: "MASTER",
        deveTrocarSenha: false,
        tenantId: "tenant-teste",
      },
    });

    encerrarSessaoAutenticada();

    expect(window.sessionStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(window.sessionStorage.getItem(AUTH_USER_KEY)).toBeNull();
  });

  it("salva e le ultima rota privada", () => {
    salvarUltimaRotaPrivada("/pacientes/10?tab=dados");

    expect(obterUltimaRotaPrivada()).toBe("/pacientes/10?tab=dados");
  });

  it("nao persiste campos sensiveis extras da resposta de login", () => {
    iniciarSessaoApi({
      accessToken: "access-token-de-teste",
      expiresIn: 3600,
      refreshToken: "refresh-token-nao-deve-armazenar",
      usuario: {
        name: "Usuario Teste",
        email: "usuario@teste.local",
        role: "SECRETARIA",
        deveTrocarSenha: false,
        tenantId: "tenant-teste",
        senhaHash: "$2a$fake",
        prontuario: "registro clinico",
        registroConsulta: "conteudo clinico",
      },
    } as Parameters<typeof iniciarSessaoApi>[0]);

    const storage = JSON.stringify(window.sessionStorage);
    expect(storage).not.toContain("refresh-token-nao-deve-armazenar");
    expect(storage).not.toContain("senhaHash");
    expect(storage).not.toContain("$2a$fake");
    expect(storage).not.toContain("registro clinico");
    expect(storage).not.toContain("conteudo clinico");
  });
});
