import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminTenants } from ".";
import {
  adminTenantsService,
  type TenantAdministrativo,
} from "../../../services/api";

vi.mock("../../../services/api", () => ({
  adminTenantLogsService: {
    baixar: vi.fn(),
  },
  adminTenantsService: {
    listar: vi.fn(),
    criar: vi.fn(),
    atualizar: vi.fn(),
    ativar: vi.fn(),
    inativar: vi.fn(),
    excluir: vi.fn(),
  },
  isApiError: vi.fn(() => false),
  toErrorMessage: vi.fn((_error: unknown, fallback: string) => fallback),
}));

const tenantHtmlName = "<script>alert('tenant')</script>";
const tenantInativo: TenantAdministrativo = {
  id: "tenant-html",
  slug: "tenant-html",
  nome: tenantHtmlName,
  nicho: "SAUDE",
  plano: "EQUIPE",
  permiteSecretaria: true,
  ativo: false,
  dataInativacao: "2026-07-03T00:00:00.000Z",
  criadoEm: "2026-07-01T00:00:00.000Z",
  atualizadoEm: "2026-07-02T00:00:00.000Z",
};

describe("AdminTenants", () => {
  afterEach(() => {
    cleanup();
    window.sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("renderiza plano sem coluna Secretaria e exige confirmacao para excluir", async () => {
    vi.mocked(adminTenantsService.listar).mockResolvedValue([tenantInativo]);
    vi.mocked(adminTenantsService.excluir).mockResolvedValue(undefined);
    window.sessionStorage.setItem(
      "connexi.admin.authorization",
      "Basic credencial-teste",
    );

    render(<AdminTenants />);

    expect(await screen.findByText(tenantHtmlName)).toBeInTheDocument();
    expect(screen.getByText("Plano")).toBeInTheDocument();
    expect(screen.getByText("Equipe")).toBeInTheDocument();
    expect(screen.queryByText("Secretária")).not.toBeInTheDocument();
    expect(document.querySelector("script")).toBeNull();

    await userEvent.click(
      screen.getByRole("button", { name: `Excluir ${tenantHtmlName}` }),
    );

    const confirmar = screen.getByRole("button", { name: "Excluir tenant" });
    expect(confirmar).toBeDisabled();

    await userEvent.type(screen.getByRole("textbox"), "tenant-html");
    expect(confirmar).toBeEnabled();
    await userEvent.click(confirmar);

    await waitFor(() => {
      expect(adminTenantsService.excluir).toHaveBeenCalledWith(
        { authorization: "Basic credencial-teste" },
        "tenant-html",
      );
    });
  });
});
