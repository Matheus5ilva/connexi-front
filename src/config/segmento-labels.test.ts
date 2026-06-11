import { describe, expect, it } from "vitest";
import {
  getCamposPacienteVisiveis,
  getLabel,
  getSegmentoLabels,
  isCampoPacienteVisivel,
  isSegmento,
} from "./segmento-labels";

describe("segmento-labels", () => {
  it("usa labels de SAUDE como fallback quando segmento nao for informado", () => {
    expect(getSegmentoLabels().pessoas).toBe("Pacientes");
    expect(getSegmentoLabels().negocio).toBe("Consultório");
    expect(getSegmentoLabels().negocioEntidade).toBe("consultório");
    expect(getSegmentoLabels().parcerias).toBe("Convênios");
    expect(getSegmentoLabels().numeroCarteirinha).toBe(
      "Número da carteirinha",
    );
    expect(getLabel(undefined, "pessoa")).toBe("Paciente");
  });

  it("usa labels de ESTETICA para estética e bem-estar", () => {
    expect(getLabel("ESTETICA", "pessoa")).toBe("Cliente");
    expect(getLabel("ESTETICA", "pessoas")).toBe("Clientes");
    expect(getLabel("ESTETICA", "parceria")).toBe("Parceria");
    expect(getLabel("ESTETICA", "parcerias")).toBe("Parcerias");
    expect(getLabel("ESTETICA", "numeroCarteirinha")).toBe(
      "Código/identificação da parceria",
    );
    expect(getLabel("ESTETICA", "servico")).toBe("Procedimento");
    expect(getLabel("ESTETICA", "servicos")).toBe("Procedimentos");
    expect(getLabel("ESTETICA", "negocio")).toBe("Meu Negócio");
    expect(getLabel("ESTETICA", "negocioEntidade")).toBe("negócio");
    expect(getLabel("ESTETICA", "consulta")).toBe("Atendimento");
    expect(getLabel("ESTETICA", "proximoAgendamento")).toBe(
      "Próximo atendimento",
    );
  });

  it("mantem PET e SERVICOS sem alteracao visual nesta fase", () => {
    expect(getLabel("PET", "pessoas")).toBe("Pacientes");
    expect(getLabel("PET", "parcerias")).toBe("Convênios");
    expect(getLabel("PET", "negocio")).toBe("Consultório");
    expect(getLabel("PET", "negocioEntidade")).toBe("consultório");
    expect(getLabel("SERVICOS", "pessoas")).toBe("Pacientes");
    expect(getLabel("SERVICOS", "parcerias")).toBe("Convênios");
    expect(getLabel("SERVICOS", "negocio")).toBe("Consultório");
    expect(getLabel("SERVICOS", "negocioEntidade")).toBe("consultório");
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

  it("mantem todos os campos especificos visiveis para SAUDE", () => {
    expect(getCamposPacienteVisiveis("SAUDE")).toEqual({
      nomeMae: true,
      convenio: true,
      numeroCarteirinha: true,
    });
  });

  it("oculta campos especificos de saude para ESTETICA", () => {
    expect(getCamposPacienteVisiveis("ESTETICA")).toEqual({
      nomeMae: false,
      convenio: false,
      numeroCarteirinha: false,
    });
  });

  it("usa visibilidade de SAUDE como fallback", () => {
    expect(isCampoPacienteVisivel("WELLNESS", "nomeMae")).toBe(true);
    expect(isCampoPacienteVisivel(undefined, "convenio")).toBe(true);
  });
});
