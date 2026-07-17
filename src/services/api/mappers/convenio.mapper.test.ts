import { describe, expect, it } from "vitest";
import type { ConvenioFormularioData } from "../../../schemas/convenio.schema";
import { criarConvenioRequestSchema } from "../schemas/domain.schema";
import { mapFormularioConvenioParaCriarRequest } from "./convenio.mapper";

const formularioValido: ConvenioFormularioData = {
  nome: "Convenio Teste",
  cnpj: "04.252.011/0001-10",
  ativo: true,
  diasPagamento: 0,
  abrangencia: "Nacional",
  telefone: "1133000000",
  whatsapp: "",
  email: "CONVENIO@TESTE.COM",
};

describe("Mapper de convenio", () => {
  it("preserva diasPagamento zero no payload de criacao", () => {
    const payload = mapFormularioConvenioParaCriarRequest(formularioValido);

    expect(payload.diasPagamento).toBe(0);
    expect(criarConvenioRequestSchema.safeParse(payload).success).toBe(true);
  });

  it("schema de criacao exige diasPagamento", () => {
    const payload = mapFormularioConvenioParaCriarRequest(formularioValido);
    const resultado = criarConvenioRequestSchema.safeParse({
      ...payload,
      diasPagamento: undefined,
    });

    expect(resultado.success).toBe(false);
  });
});
