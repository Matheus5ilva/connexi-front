import { describe, expect, it } from "vitest";
import {
  contemComandoSqlPerigoso,
  contemHtmlOuScript,
  contemTextoInseguro,
  validarTextoSemHtml,
} from "./texto-seguro.schema";

describe("Validador de texto cadastral seguro", () => {
  it.each([
    "<script>alert('xss')</script>",
    "<img src=x onerror=alert(1)>",
    "javascript:alert(1)",
    "texto onclick=alert(1)",
  ])("bloqueia HTML ou script: %s", (valor) => {
    expect(contemHtmlOuScript(valor)).toBe(true);
    expect(validarTextoSemHtml(valor)).toBe(false);
  });

  it.each([
    "DROP DATABASE my_consultorio",
    "DROP TABLE pacientes",
    "DELETE FROM usuarios",
    "TRUNCATE contas_receber",
    "ALTER TABLE pacientes ADD COLUMN teste text",
    "INSERT INTO usuarios",
    "UPDATE usuarios SET senha = senha",
    "UNION SELECT email FROM usuarios",
    "SELECT * FROM pacientes",
    "abc;--",
    "/* comentario malicioso */",
  ])("bloqueia comando SQL evidente: %s", (valor) => {
    expect(contemComandoSqlPerigoso(valor)).toBe(true);
    expect(contemTextoInseguro(valor)).toBe(true);
  });

  it.each([
    "José da Silva",
    "Ana-Maria",
    "D'Ávila",
    "Clínica Saúde",
    "Rua São João",
    "Bairro União",
  ])("aceita texto cadastral legítimo: %s", (valor) => {
    expect(validarTextoSemHtml(valor)).toBe(true);
    expect(contemTextoInseguro(valor)).toBe(false);
  });
});
