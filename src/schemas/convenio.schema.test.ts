import { describe, expect, it } from "vitest";
import { formularioConvenioSchema } from "./convenio.schema";

const formularioValido = {
  nome: "Convenio Teste",
  cnpj: "04252011000110",
  ativo: true,
  diasPagamento: 30,
  abrangencia: "Nacional",
  telefone: "1133000000",
  whatsapp: "11994440000",
  email: "convenio@teste.com",
};

describe("Schema do formulario de convenio", () => {
  it.each([
    ["vazio", ""],
    ["negativo", -1],
    ["decimal", 1.5],
    ["texto", "abc"],
  ])("rejeita diasPagamento %s", (_caseName, diasPagamento) => {
    const resultado = formularioConvenioSchema.safeParse({
      ...formularioValido,
      diasPagamento,
    });

    expect(resultado.success).toBe(false);
  });

  it.each([0, 30])("aceita diasPagamento inteiro: %s", (diasPagamento) => {
    const resultado = formularioConvenioSchema.safeParse({
      ...formularioValido,
      diasPagamento,
    });

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.diasPagamento).toBe(diasPagamento);
    }
  });
});
