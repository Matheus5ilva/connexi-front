import { describe, expect, it } from "vitest";
import { getLabel, getSegmentoLabels, isSegmento } from "./segmento-labels";

describe("segmento-labels", () => {
  it("usa labels de SAUDE como fallback quando segmento nao for informado", () => {
    expect(getSegmentoLabels().pessoas).toBe("Pacientes");
    expect(getSegmentoLabels().negocio).toBe("Consultório");
    expect(getSegmentoLabels().parcerias).toBe("Convênios");
    expect(getLabel(undefined, "pessoa")).toBe("Paciente");
  });

  it("usa labels de ESTETICA para estética e bem-estar", () => {
    expect(getLabel("ESTETICA", "pessoa")).toBe("Cliente");
    expect(getLabel("ESTETICA", "pessoas")).toBe("Clientes");
    expect(getLabel("ESTETICA", "parcerias")).toBe("Parcerias");
    expect(getLabel("ESTETICA", "servico")).toBe("Procedimento");
    expect(getLabel("ESTETICA", "servicos")).toBe("Procedimentos");
    expect(getLabel("ESTETICA", "negocio")).toBe("Meu Negócio");
    expect(getLabel("ESTETICA", "consulta")).toBe("Atendimento");
    expect(getLabel("ESTETICA", "proximoAgendamento")).toBe(
      "Próximo atendimento",
    );
  });

  it("mantem PET e SERVICOS sem alteracao visual nesta fase", () => {
    expect(getLabel("PET", "pessoas")).toBe("Pacientes");
    expect(getLabel("PET", "parcerias")).toBe("Convênios");
    expect(getLabel("PET", "negocio")).toBe("Consultório");
    expect(getLabel("SERVICOS", "pessoas")).toBe("Pacientes");
    expect(getLabel("SERVICOS", "parcerias")).toBe("Convênios");
    expect(getLabel("SERVICOS", "negocio")).toBe("Consultório");
  });

  it("volta para SAUDE quando o segmento for desconhecido", () => {
    expect(isSegmento("EDUCACAO")).toBe(false);
    expect(isSegmento("WELLNESS")).toBe(false);
    expect(getLabel("EDUCACAO", "parceria")).toBe("Convênio");
    expect(getLabel("WELLNESS", "pessoas")).toBe("Pacientes");
  });

  it("retorna a chave quando o label nao existir", () => {
    expect(getLabel("SAUDE", "label-inexistente")).toBe("label-inexistente");
  });
});
