import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  salvarUltimaRotaPrivada,
  type UsuarioAutenticado,
} from "../auth/session";
import { useSessaoAutenticada } from "../auth/use-auth-session";
import { ExigirAutenticacao, RedirecionarSeAutenticado } from "./auth-guards";

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

function renderizarLoginComSessao(user: UsuarioAutenticado) {
  useSessaoAutenticadaMock.mockReturnValue({
    accessToken: "access-token",
    isAuthenticated: true,
    user,
  });

  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route element={<RedirecionarSeAutenticado />}>
          <Route path="/login" element={<div>Login</div>} />
        </Route>
        <Route path="/agenda" element={<div>Agenda</div>} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
        <Route path="/pacientes" element={<div>Pacientes</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ExigirAutenticacao", () => {
  afterEach(() => {
    cleanup();
    window.sessionStorage.clear();
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

  it("bloqueia telas administrativas de catalogos para SECRETARIA sem permissao financeira", () => {
    renderizarRota("/financeiro/formas-pagamento", usuario());

    expect(screen.getByText("Acesso negado")).toBeInTheDocument();
    cleanup();

    renderizarRota("/financeiro/convenios", usuario());

    expect(screen.getByText("Acesso negado")).toBeInTheDocument();
  });

  it("bloqueia escrita em catalogos para SECRETARIA sem permissao financeira", () => {
    renderizarRota("/financeiro/formas-pagamento/novo", usuario());

    expect(screen.getByText("Acesso negado")).toBeInTheDocument();
    cleanup();

    renderizarRota("/financeiro/convenios/10/editar", usuario());

    expect(screen.getByText("Acesso negado")).toBeInTheDocument();
  });

  it("permite financeiro para SECRETARIA com permissao financeira", () => {
    renderizarRota(
      "/financeiro/contas-a-receber",
      usuario({ podeAcessarFinanceiro: true }),
    );

    expect(screen.getByText("Rota permitida")).toBeInTheDocument();
  });

  it("permite consulta de catalogos para SECRETARIA com permissao financeira", () => {
    const secretariaComFinanceiro = usuario({ podeAcessarFinanceiro: true });

    renderizarRota("/financeiro/formas-pagamento", secretariaComFinanceiro);

    expect(screen.getByText("Rota permitida")).toBeInTheDocument();
    cleanup();

    renderizarRota("/financeiro/convenios", secretariaComFinanceiro);

    expect(screen.getByText("Rota permitida")).toBeInTheDocument();
  });

  it("bloqueia escrita em catalogos para SECRETARIA com permissao financeira", () => {
    const secretariaComFinanceiro = usuario({ podeAcessarFinanceiro: true });

    renderizarRota("/financeiro/formas-pagamento/novo", secretariaComFinanceiro);

    expect(screen.getByText("Acesso negado")).toBeInTheDocument();
    cleanup();

    renderizarRota("/financeiro/convenios/10/editar", secretariaComFinanceiro);

    expect(screen.getByText("Acesso negado")).toBeInTheDocument();
  });

  it("envia rota proibida ou inexistente para acesso negado, nao para agenda", () => {
    renderizarRota("/rota-inexistente", usuario());

    expect(screen.getByText("Acesso negado")).toBeInTheDocument();
    expect(screen.queryByText("Agenda")).not.toBeInTheDocument();
  });

  it("redireciona SECRETARIA autenticada no login para agenda", () => {
    salvarUltimaRotaPrivada("/pacientes");

    renderizarLoginComSessao(usuario());

    expect(screen.getByText("Agenda")).toBeInTheDocument();
  });

  it("redireciona PROFISSIONAL autenticado no login para dashboard", () => {
    salvarUltimaRotaPrivada("/pacientes");

    renderizarLoginComSessao(usuario({ perfil: "PROFISSIONAL" }));

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("redireciona MASTER autenticado no login para ultima rota valida", () => {
    salvarUltimaRotaPrivada("/pacientes");

    renderizarLoginComSessao(usuario({ perfil: "MASTER" }));

    expect(screen.getByText("Pacientes")).toBeInTheDocument();
  });

  it("redireciona MASTER autenticado no login para dashboard sem ultima rota valida", () => {
    salvarUltimaRotaPrivada("/acesso-negado");

    renderizarLoginComSessao(usuario({ perfil: "MASTER" }));

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });
});
