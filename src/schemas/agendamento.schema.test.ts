import { describe, expect, it } from "vitest";
import { formularioAgendamentoSchema } from "./agendamento.schema";
import { MENSAGEM_TEXTO_SEM_HTML } from "./texto-seguro.schema";

function mensagensDoResultado(
  resultado: ReturnType<typeof formularioAgendamentoSchema.safeParse>,
): string[] {
  if (resultado.success) {
    return [];
  }

  return resultado.error.issues.map((issue) => issue.message);
}

describe("Schema do formulário de agendamento", () => {
  const agendamentoBase = {
    pacienteId: 1,
    data: "2026-05-07",
    horario: "09:00",
    duracaoMinutos: 30,
    tipoAtendimento: "PARTICULAR",
    servicoId: 5,
  };

  it("aceita agendamento particular válido", () => {
    const resultado = formularioAgendamentoSchema.safeParse(agendamentoBase);

    expect(resultado.success).toBe(true);
  });

  it("exibe mensagem amigavel quando servico nao foi selecionado", () => {
    const { servicoId: _servicoId, ...agendamentoSemServico } =
      agendamentoBase;
    const resultado = formularioAgendamentoSchema.safeParse(
      agendamentoSemServico,
    );
    const mensagens = mensagensDoResultado(resultado);

    expect(resultado.success).toBe(false);
    expect(mensagens).toContain("Selecione um serviço.");
    expect(mensagens).not.toContain(
      "Invalid input: expected number, received undefined",
    );
  });

  it("exibe mensagem amigavel quando paciente nao foi selecionado", () => {
    const { pacienteId: _pacienteId, ...agendamentoSemPaciente } =
      agendamentoBase;
    const resultado = formularioAgendamentoSchema.safeParse(
      agendamentoSemPaciente,
    );
    const mensagens = mensagensDoResultado(resultado);

    expect(resultado.success).toBe(false);
    expect(mensagens).toContain("Selecione um paciente.");
    expect(mensagens).not.toContain(
      "Invalid input: expected number, received undefined",
    );
  });

  it("exige convênio quando atendimento é por convênio", () => {
    const resultado = formularioAgendamentoSchema.safeParse({
      ...agendamentoBase,
      tipoAtendimento: "CONVENIO",
    });

    expect(resultado.success).toBe(false);
    expect(mensagensDoResultado(resultado)).toContain(
      "Selecione o convênio para este atendimento.",
    );
  });

  it("aceita convênio válido no atendimento por convênio", () => {
    const resultado = formularioAgendamentoSchema.safeParse({
      ...agendamentoBase,
      tipoAtendimento: "CONVENIO",
      convenioId: 2,
    });

    expect(resultado.success).toBe(true);
  });

  it.each([
    "<script>alert('xss')</script>",
    "DELETE FROM agendamentos",
  ])("bloqueia observação insegura: %s", (observacao) => {
    const resultado = formularioAgendamentoSchema.safeParse({
      ...agendamentoBase,
      observacao,
    });

    expect(resultado.success).toBe(false);
    expect(mensagensDoResultado(resultado)).toContain(MENSAGEM_TEXTO_SEM_HTML);
  });
});
