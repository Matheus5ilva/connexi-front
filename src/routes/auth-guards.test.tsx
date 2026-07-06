import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { UsuarioAutenticado } from "../auth/session";
import { useSessaoAutenticada } from "../auth/use-auth-session";
import { ExigirAutenticacao } from "./auth-guards";

vi.mock("../auth/use-auth-session", () => ({
  useSessaoAutenticada: vi.fn(),
}));

const useSessaoAutenticadaMock = vi.mocked(useSessaoAutenticada);

function usuario(
  overrides: Partial<UsuarioAutenticado> = {},
): UsuarioAutenticado {
  return {
    id: "usuario@teste.local",
    tenantId: "tenant-teste",
    nome: "Usuario Teste",
    email: "usuario@teste.local",
    perfil: "SECRETARIA",
    podeAcessarFinanceiro: false,
    deveTrocarSenha: false,
    ...overrides,
  };
}

function renderizarRota(pathname: string, user: UsuarioAutenticado | null) {
  useSessaoAutenticadaMock.mockReturnValue({
    accessToken: user ? "access-token" : null,
    isAuthenticated: Boolean(user),
    user,
  });

  render(
    <MemoryRouter initialEntries={[pathname]}>
      <Routes>
        <Route element={<ExigirAutenticacao />}>
          <Route path="*" element={<div>Rota permitida</div>} />
        </Route>
        <Route path="/login" element={<div>Login</div>} />
        <Route path="/acesso-negado" element={<div>Acesso negado</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ExigirAutenticacao", () => {
  afterEach(() => {
    cleanup();
  });

  it("redireciona usuario sem sessao para login", () => {
    renderizarRota("/agenda", null);

    expect(screen.getByText("Login")).toBeInTheDocument();
  });

  it("permite SECRETARIA acessar agenda", () => {
    renderizarRota("/agenda", usuario());

    expect(screen.getByText("Rota permitida")).toBeInTheDocument();
  });

  it("envia SECRETARIA sem permissao para acesso negado", () => {
    renderizarRota("/secretarias", usuario());

    expect(screen.getByText("Acesso negado")).toBeInTheDocument();
  });

  it("bloqueia financeiro para SECRETARIA sem permissao financeira", () => {
    renderizarRota("/financeiro/contas-a-receber", usuario());

    expect(screen.getByText("Acesso negado")).toBeInTheDocument();
  });

  it("permite financeiro para SECRETARIA com permissao financeira", () => {
    renderizarRota(
      "/financeiro/contas-a-receber",
      usuario({ podeAcessarFinanceiro: true }),
    );

    expect(screen.getByText("Rota permitida")).toBeInTheDocument();
  });

  it("envia rota proibida ou inexistente para acesso negado, nao para agenda", () => {
    renderizarRota("/rota-inexistente", usuario());

    expect(screen.getByText("Acesso negado")).toBeInTheDocument();
    expect(screen.queryByText("Agenda")).not.toBeInTheDocument();
  });
});
