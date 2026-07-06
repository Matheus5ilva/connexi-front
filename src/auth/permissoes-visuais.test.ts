import { describe, expect, it } from "vitest";
import type { UsuarioAutenticado } from "./session";
import {
  usuarioPodeAcessarRota,
  usuarioPodeVerItemMenu,
} from "./permissoes-visuais";

function usuario(
  overrides: Partial<UsuarioAutenticado> = {},
): UsuarioAutenticado {
  return {
    id: "usuario@teste.local",
    tenantId: "tenant-teste",
    nome: "Usuario Teste",
    email: "usuario@teste.local",
    perfil: "PROFISSIONAL",
    podeAcessarFinanceiro: false,
    tenantPlano: "SOLO",
    tenantPermiteSecretaria: false,
    deveTrocarSenha: false,
    ...overrides,
  };
}

describe("permissoes visuais por perfil", () => {
  it("bloqueia rotina de secretarias para tenant SOLO", () => {
    const profissionalSolo = usuario();

    expect(usuarioPodeVerItemMenu(profissionalSolo, "secretarias")).toBe(false);
    expect(usuarioPodeAcessarRota(profissionalSolo, "/secretarias")).toBe(false);
    expect(usuarioPodeAcessarRota(profissionalSolo, "/secretarias/novo")).toBe(
      false,
    );
  });

  it("libera rotina de secretarias para PROFISSIONAL em tenant EQUIPE", () => {
    const profissionalEquipe = usuario({
      tenantPlano: "EQUIPE",
      tenantPermiteSecretaria: true,
    });

    expect(usuarioPodeVerItemMenu(profissionalEquipe, "secretarias")).toBe(true);
    expect(usuarioPodeAcessarRota(profissionalEquipe, "/secretarias")).toBe(true);
    expect(usuarioPodeAcessarRota(profissionalEquipe, "/secretarias/10")).toBe(
      true,
    );
  });

  it("libera rotina de secretarias para MASTER em tenant EQUIPE", () => {
    const masterEquipe = usuario({
      perfil: "MASTER",
      tenantPlano: "EQUIPE",
      tenantPermiteSecretaria: true,
    });

    expect(usuarioPodeVerItemMenu(masterEquipe, "secretarias")).toBe(true);
    expect(usuarioPodeAcessarRota(masterEquipe, "/secretarias/10/editar")).toBe(
      true,
    );
  });

  it("usa plano EQUIPE como fallback quando permiteSecretaria vier ausente", () => {
    const profissionalEquipe = usuario({
      tenantPlano: "EQUIPE",
      tenantPermiteSecretaria: undefined,
    });

    expect(usuarioPodeVerItemMenu(profissionalEquipe, "secretarias")).toBe(true);
  });

  it("mantem fallback seguro quando plano e permiteSecretaria vierem ausentes", () => {
    const profissionalSemContextoTenant = usuario({
      tenantPlano: undefined,
      tenantPermiteSecretaria: undefined,
    });

    expect(usuarioPodeVerItemMenu(profissionalSemContextoTenant, "secretarias")).toBe(
      false,
    );
  });

  it("bloqueia SECRETARIA na rotina de secretarias e em dados clinicos", () => {
    const secretaria = usuario({
      perfil: "SECRETARIA",
      tenantPlano: "EQUIPE",
      tenantPermiteSecretaria: true,
    });

    expect(usuarioPodeVerItemMenu(secretaria, "secretarias")).toBe(false);
    expect(usuarioPodeAcessarRota(secretaria, "/secretarias")).toBe(false);
    expect(usuarioPodeAcessarRota(secretaria, "/agenda")).toBe(true);
    expect(usuarioPodeAcessarRota(secretaria, "/consultas/10")).toBe(false);
    expect(usuarioPodeAcessarRota(secretaria, "/pacientes/10/prontuarios")).toBe(
      false,
    );
  });

  it("controla financeiro da SECRETARIA pela permissao financeira", () => {
    const secretariaSemFinanceiro = usuario({ perfil: "SECRETARIA" });
    const secretariaComFinanceiro = usuario({
      perfil: "SECRETARIA",
      podeAcessarFinanceiro: true,
    });

    expect(
      usuarioPodeVerItemMenu(secretariaSemFinanceiro, "contasReceber"),
    ).toBe(false);
    expect(
      usuarioPodeAcessarRota(
        secretariaSemFinanceiro,
        "/financeiro/contas-a-receber",
      ),
    ).toBe(false);

    expect(usuarioPodeVerItemMenu(secretariaComFinanceiro, "contasReceber")).toBe(
      true,
    );
    expect(
      usuarioPodeAcessarRota(
        secretariaComFinanceiro,
        "/financeiro/contas-a-receber",
      ),
    ).toBe(true);
    expect(
      usuarioPodeAcessarRota(secretariaComFinanceiro, "/financeiro/convenios/novo"),
    ).toBe(false);
    expect(
      usuarioPodeAcessarRota(
        secretariaComFinanceiro,
        "/financeiro/formas-pagamento/10/editar",
      ),
    ).toBe(false);
    expect(
      usuarioPodeAcessarRota(
        secretariaComFinanceiro,
        "/financeiro/servicos/10/editar",
      ),
    ).toBe(false);
  });

  it("permite catalogo minimo de agenda sem liberar financeiro completo", () => {
    const secretariaSemFinanceiro = usuario({ perfil: "SECRETARIA" });

    expect(usuarioPodeAcessarRota(secretariaSemFinanceiro, "/agenda")).toBe(true);
    expect(
      usuarioPodeAcessarRota(secretariaSemFinanceiro, "/financeiro/servicos"),
    ).toBe(true);
    expect(
      usuarioPodeAcessarRota(secretariaSemFinanceiro, "/financeiro/convenios"),
    ).toBe(false);
    expect(
      usuarioPodeAcessarRota(
        secretariaSemFinanceiro,
        "/financeiro/contas-a-receber",
      ),
    ).toBe(false);
  });

  it("bloqueia rota desconhecida para SECRETARIA sem redirecionar por fallback amplo", () => {
    const secretaria = usuario({ perfil: "SECRETARIA" });

    expect(usuarioPodeAcessarRota(secretaria, "/rota-inexistente")).toBe(false);
  });
});
