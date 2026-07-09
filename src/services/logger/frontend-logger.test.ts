import { afterEach, describe, expect, it, vi } from "vitest";
import { frontendLogger } from "./frontend-logger";

describe("frontendLogger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("mascara tokens, senhas e dados clinicos nos logs", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    frontendLogger.warn("Teste", "Evento sensivel", {
      token: "token-secreto",
      authorization: "Bearer segredo",
      senha: "senha-real",
      prontuario: "registro clinico sensivel",
      erro: new Error("token=abc123 authorization: Bearer segredo"),
    });

    const serialized = JSON.stringify(warnSpy.mock.calls);
    expect(serialized).toContain("[removido]");
    expect(serialized).not.toContain("token-secreto");
    expect(serialized).not.toContain("senha-real");
    expect(serialized).not.toContain("registro clinico sensivel");
    expect(serialized).not.toContain("Bearer segredo");
    expect(serialized).not.toContain("abc123");
  });
});
