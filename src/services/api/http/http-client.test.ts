import { describe, expect, it, vi } from "vitest";
import { HttpClient } from "./http-client";
import type { AuthTokenStore } from "../auth/token-store";

function createTokenStore(): AuthTokenStore {
  return {
    getAccessToken: () => null,
    setAccessToken: () => undefined,
    clearAccessToken: () => undefined,
  };
}

describe("HttpClient auth cookie flow", () => {
  it("envia credenciais configuradas em todas as requisicoes", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = new HttpClient({
      baseUrl: "http://tenant.localhost:3000",
      timeoutMs: 1000,
      credentials: "include",
      tokenStore: createTokenStore(),
    });

    await client.post("/auth/refresh-token", undefined, { auth: false });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      credentials: "include",
      method: "POST",
    });

    vi.unstubAllGlobals();
  });

  it("trata 401 de refresh como erro HTTP sem repetir a requisicao", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          statusCode: 401,
          message: "refresh token ausente",
          error: "Unauthorized",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = new HttpClient({
      baseUrl: "http://tenant.localhost:3000",
      timeoutMs: 1000,
      credentials: "include",
      tokenStore: createTokenStore(),
    });

    await expect(
      client.post("/auth/refresh-token", undefined, { auth: false }),
    ).rejects.toMatchObject({
      kind: "http",
      status: 401,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });
});
