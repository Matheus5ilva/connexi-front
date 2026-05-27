import { afterEach, describe, expect, it } from "vitest";
import {
  atualizarSessaoComMinhaConta,
  encerrarSessaoAutenticada,
  iniciarSessaoApi,
  obterUsuarioAutenticado,
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
      deveTrocarSenha: false,
    });

    expect(obterUsuarioAutenticado()).toEqual({
      id: "profissional@teste.local",
      tenantId: "tenant-teste",
      nome: "Profissional Teste",
      email: "profissional@teste.local",
      perfil: "PROFISSIONAL",
      profissionalId: 10,
      deveTrocarSenha: false,
    });
    expect(JSON.stringify(window.sessionStorage)).not.toContain("refreshToken");
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
});
