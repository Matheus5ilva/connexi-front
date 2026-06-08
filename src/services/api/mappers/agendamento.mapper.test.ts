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

  it("mantem agendamento retroativo sem status no payload de criacao", () => {
    const payload = mapFormularioAgendamentoParaCriarRequest(agendamentoBase, {
      profissionalId: 10,
    });

    expect(payload).toMatchObject({
      data: "2026-06-01",
      horario: "09:00",
      profissionalId: 10,
      pacienteId: 1,
      servicoId: 5,
      formaPagamentoId: 2,
      duracaoMinutos: 30,
    });
    expect(payload).not.toHaveProperty("status");
    expect(criarAgendamentoRequestSchema.parse(payload)).not.toHaveProperty(
      "status",
    );
  });

  it("schema de criacao rejeita status enviado pelo cliente", () => {
    const payload = {
      ...mapFormularioAgendamentoParaCriarRequest(agendamentoBase, {
        profissionalId: 10,
      }),
      status: "REALIZADO",
    };

    expect(criarAgendamentoRequestSchema.safeParse(payload).success).toBe(false);
  });
});
