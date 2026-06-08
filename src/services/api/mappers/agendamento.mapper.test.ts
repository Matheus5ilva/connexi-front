import { describe, expect, it } from "vitest";
import type { AgendamentoFormularioData } from "../../../schemas/agendamento.schema";
import { criarAgendamentoRequestSchema } from "../schemas/domain.schema";
import { mapFormularioAgendamentoParaCriarRequest } from "./agendamento.mapper";

const agendamentoBase: AgendamentoFormularioData = {
  pacienteId: 1,
  data: "2026-06-01",
  horario: "09:00",
  duracaoMinutos: 30,
  tipoAtendimento: "PARTICULAR",
  servicoId: 5,
  formaPagamentoId: 2,
};

describe("Mapper de agendamento", () => {
  it("mantem agendamento futuro sem status explicito", () => {
    const payload = mapFormularioAgendamentoParaCriarRequest(
      {
        ...agendamentoBase,
        data: "2026-06-02",
        horario: "09:00",
      },
      {
        profissionalId: 10,
        agora: new Date(2026, 5, 1, 8, 30, 0),
      },
    );

    expect(payload).toMatchObject({
      data: "2026-06-02",
      horario: "09:00",
      profissionalId: 10,
      pacienteId: 1,
    });
    expect(payload).not.toHaveProperty("status");
  });

  it("envia status REALIZADO para agendamento em data passada sem bloquear o payload", () => {
    expect(() =>
      mapFormularioAgendamentoParaCriarRequest(agendamentoBase, {
        profissionalId: 10,
        agora: new Date(2026, 5, 1, 9, 30, 0),
      }),
    ).not.toThrow();

    const payload = mapFormularioAgendamentoParaCriarRequest(agendamentoBase, {
      profissionalId: 10,
      agora: new Date(2026, 5, 1, 9, 30, 0),
    });

    expect(payload).toMatchObject({
      data: "2026-06-01",
      horario: "09:00",
      status: "REALIZADO",
    });
    expect(criarAgendamentoRequestSchema.parse(payload)).toMatchObject({
      status: "REALIZADO",
    });
  });

  it("permite desativar status automatico em fluxos que nao sao novo agendamento", () => {
    const payload = mapFormularioAgendamentoParaCriarRequest(agendamentoBase, {
      profissionalId: 10,
      agora: new Date(2026, 5, 1, 9, 30, 0),
      registrarRetroativoRealizado: false,
    });

    expect(payload).not.toHaveProperty("status");
  });
});
