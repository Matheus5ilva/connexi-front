import { describe, expect, it } from "vitest";
import type { PacienteFormData } from "../../../schemas/paciente.schema";
import {
  mapPacienteFormToCreateRequest,
  mapPacienteFormToUpdateRequest,
} from "./paciente.mapper";

const formData: PacienteFormData = {
  nome: "Cliente Teste",
  ativo: true,
  telefone: "(31) 99999-9999",
  whatsapp: "",
  email: "cliente@teste.com",
  cep: "",
  logradouro: "",
  complemento: "",
  bairro: "",
  nomeCidade: "",
  codigoIbgeCidade: "",
  cpf: "",
  dataNascimento: "",
  nomeMae: "",
  numeroCarteirinha: "",
};

describe("Paciente mapper", () => {
  it("nao envia pessoa.ativo no cadastro de paciente", () => {
    const payload = mapPacienteFormToCreateRequest(formData);

    expect(payload.ativo).toBe(true);
    expect(payload.pessoa).not.toHaveProperty("ativo");
  });

  it("nao envia pessoa.ativo na atualizacao de paciente", () => {
    const payload = mapPacienteFormToUpdateRequest(formData);

    expect(payload.ativo).toBe(true);
    expect(payload.pessoa).not.toHaveProperty("ativo");
  });

  it("nao propaga campos internos contaminados no formulario", () => {
    const payload = mapPacienteFormToCreateRequest({
      ...formData,
      role: "MASTER",
      tenantId: "evil",
      permissions: ["*"],
      profissionalId: 999,
      usuarioId: 999,
      pessoa: { ativo: false },
    } as unknown as PacienteFormData);
    const serialized = JSON.stringify(payload);

    expect(serialized).not.toContain("MASTER");
    expect(serialized).not.toContain("evil");
    expect(serialized).not.toContain("permissions");
    expect(serialized).not.toContain("profissionalId");
    expect(serialized).not.toContain("usuarioId");
    expect(payload.pessoa).not.toHaveProperty("ativo");
  });
});
