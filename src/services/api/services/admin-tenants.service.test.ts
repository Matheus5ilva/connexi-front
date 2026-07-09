import { afterEach, describe, expect, it, vi } from "vitest";
import { httpClient } from "../http/http-client";
import {
  adminTenantsService,
  type CriarTenantAdministrativoRequest,
  type AtualizarTenantAdministrativoRequest,
} from "./admin-tenants.service";

const credencial = { authorization: "Basic teste" };

function tenantResponse(plano: "SOLO" | "EQUIPE") {
  return {
    id: "tenant-teste",
    slug: "tenant-teste",
    nome: "Tenant Teste",
    nicho: "SAUDE",
    plano,
    permiteSecretaria: plano === "EQUIPE",
    ativo: true,
    dataInativacao: null,
    criadoEm: "2026-07-03T00:00:00.000Z",
    atualizadoEm: "2026-07-03T00:00:00.000Z",
  };
}

describe("Admin tenants service", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("envia plano no create sem permiteSecretaria", async () => {
    const postSpy = vi
      .spyOn(httpClient, "post")
      .mockResolvedValue({ data: tenantResponse("EQUIPE") });
    const payload = {
      slug: "tenant-teste",
      nome: "Tenant Teste",
      nicho: "SAUDE",
      plano: "EQUIPE",
      permiteSecretaria: false,
      emailUsuarioInicial: "usuario@teste.com",
    } as unknown as CriarTenantAdministrativoRequest;

    await adminTenantsService.criar(credencial, payload);

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy.mock.calls[0]?.[1]).toMatchObject({ plano: "EQUIPE" });
    expect(postSpy.mock.calls[0]?.[1]).not.toHaveProperty(
      "permiteSecretaria",
    );
  });

  it("remove campos internos no create de tenant", async () => {
    const postSpy = vi
      .spyOn(httpClient, "post")
      .mockResolvedValue({ data: tenantResponse("SOLO") });
    const payload = {
      slug: "tenant-teste",
      nome: "Tenant Teste",
      nicho: "SAUDE",
      plano: "SOLO",
      emailUsuarioInicial: "usuario@teste.com",
      role: "MASTER",
      tenantId: "evil",
      schema: "public",
      permissions: ["*"],
      permiteSecretaria: true,
    } as unknown as CriarTenantAdministrativoRequest;

    await adminTenantsService.criar(credencial, payload);

    expect(postSpy.mock.calls[0]?.[1]).toEqual({
      slug: "tenant-teste",
      nome: "Tenant Teste",
      nicho: "SAUDE",
      plano: "SOLO",
      emailUsuarioInicial: "usuario@teste.com",
    });
  });

  it("envia plano no update sem permiteSecretaria", async () => {
    const patchSpy = vi
      .spyOn(httpClient, "patch")
      .mockResolvedValue({ data: tenantResponse("SOLO") });
    const payload = {
      plano: "SOLO",
      permiteSecretaria: true,
    } as unknown as AtualizarTenantAdministrativoRequest;

    await adminTenantsService.atualizar(credencial, "tenant-teste", payload);

    expect(patchSpy).toHaveBeenCalledTimes(1);
    expect(patchSpy.mock.calls[0]?.[1]).toEqual({ plano: "SOLO" });
    expect(patchSpy.mock.calls[0]?.[1]).not.toHaveProperty(
      "permiteSecretaria",
    );
  });

  it("remove campos internos no update de tenant", async () => {
    const patchSpy = vi
      .spyOn(httpClient, "patch")
      .mockResolvedValue({ data: tenantResponse("EQUIPE") });
    const payload = {
      nome: "Tenant Atualizado",
      plano: "EQUIPE",
      role: "MASTER",
      tenantId: "evil",
      schema: "public",
      permissions: ["*"],
      permiteSecretaria: false,
    } as unknown as AtualizarTenantAdministrativoRequest;

    await adminTenantsService.atualizar(credencial, "tenant-teste", payload);

    expect(patchSpy.mock.calls[0]?.[1]).toEqual({
      nome: "Tenant Atualizado",
      plano: "EQUIPE",
    });
  });
});
