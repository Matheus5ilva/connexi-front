import { describe, expect, it } from "vitest";
import { finalizarConsultaSchema, salvarConsultaSchema } from "./consulta.schema";

function mensagensDoResultado(
  resultado: ReturnType<typeof finalizarConsultaSchema.safeParse>,
): string[] {
  if (resultado.success) {
    return [];
  }

  return resultado.error.issues.map((issue) => issue.message);
}

describe("Schemas de consulta e prontuário", () => {
  it("aceita texto clínico livre sem executar ou sanitizar silenciosamente", () => {
    const resultado = salvarConsultaSchema.safeParse({
      tempoConsultaMinutos: 20,
      registroConsulta: "<script>alert('xss')</script>",
      conduta: "Manter acompanhamento.",
    });

    expect(resultado.success).toBe(true);
  });

  it("valida limites seguros para o tempo da consulta", () => {
    const resultado = salvarConsultaSchema.safeParse({
      tempoConsultaMinutos: 481,
    });

    expect(resultado.success).toBe(false);
  });

  it("exige registro mínimo ao finalizar consulta", () => {
    const resultado = finalizarConsultaSchema.safeParse({
      tempoConsultaMinutos: 10,
      registroConsulta: "curto",
    });

    expect(resultado.success).toBe(false);
    expect(mensagensDoResultado(resultado)).toContain(
      "Para finalizar a consulta, o registro da consulta deve ter pelo menos 12 caracteres.",
    );
  });

  it("aceita finalização com registro suficiente e recebimento opcional", () => {
    const resultado = finalizarConsultaSchema.safeParse({
      tempoConsultaMinutos: 35,
      registroConsulta: "Registro clínico suficiente.",
    });

    expect(resultado.success).toBe(true);
  });
});
