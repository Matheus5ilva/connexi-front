import { describe, expect, it } from "vitest";
import { ApiError, createHttpApiError, toErrorMessage } from "./api-error";

describe("Mensagens amigáveis de erro da API", () => {
  it("troca erro técnico de contrato por mensagem segura", () => {
    const erro = new ApiError({
      kind: "unknown",
      message: "Resposta inesperada ao listar pacientes.",
      code: "INVALID_PACIENTE_RESPONSE",
      details: {
        issues: [{ path: ["data"], message: "Expected array" }],
      },
    });

    expect(
      toErrorMessage(
        erro,
        "Não foi possível processar os dados. Tente novamente.",
      ),
    ).toBe("Não foi possível processar os dados. Tente novamente.");
  });

  it("preserva mensagem útil de validação de negócio do backend", () => {
    const erro = createHttpApiError({
      status: 400,
      method: "POST",
      url: "/agendamentos",
      payload: {
        statusCode: 400,
        message:
          "forma de pagamento 'Convenio' nao e valida para atendimento particular",
        details: [
          "forma de pagamento 'Convenio' nao e valida para atendimento particular",
        ],
        error: "Bad Request",
      },
    });

    expect(toErrorMessage(erro)).toBe(
      'Forma de pagamento "Convênio" não é válida para atendimento particular.',
    );
  });

  it("diferencia falta de permissão de recurso não encontrado", () => {
    const erroPermissao = createHttpApiError({
      status: 403,
      method: "GET",
      url: "/pacientes/1",
      payload: { statusCode: 403, message: "Forbidden" },
    });
    const erroNaoEncontrado = createHttpApiError({
      status: 404,
      method: "GET",
      url: "/pacientes/999",
      payload: { statusCode: 404, message: "Paciente não encontrado" },
    });

    expect(toErrorMessage(erroPermissao)).not.toContain("não encontrado");
    expect(toErrorMessage(erroNaoEncontrado)).toBe("Paciente não encontrado.");
  });
});
