import { describe, expect, it } from "vitest";
import { MENSAGEM_TEXTO_SEM_HTML } from "./texto-seguro.schema";
import { pacienteSchema } from "./paciente.schema";

function mensagensDoResultado(
  resultado: ReturnType<typeof pacienteSchema.safeParse>,
): string[] {
  if (resultado.success) {
    return [];
  }

  return resultado.error.issues.map((issue) => issue.message);
}

describe("Schema do formulário de paciente", () => {
  it("aceita criação com campos obrigatórios", () => {
    const resultado = pacienteSchema.safeParse({
      nome: "José da Silva",
      ativo: true,
      telefone: "31988499084",
    });

    expect(resultado.success).toBe(true);
  });

  it("rejeita nome e telefone ausentes com mensagens amigáveis", () => {
    const resultado = pacienteSchema.safeParse({
      nome: "",
      ativo: true,
      telefone: "",
    });

    expect(resultado.success).toBe(false);
    expect(mensagensDoResultado(resultado)).toContain("Informe o telefone.");
  });

  it("rejeita e-mail inválido quando informado", () => {
    const resultado = pacienteSchema.safeParse({
      nome: "Paciente Teste",
      ativo: true,
      telefone: "31988499084",
      email: "email-invalido",
    });

    expect(resultado.success).toBe(false);
    expect(mensagensDoResultado(resultado).join(" ")).toContain("e-mail");
  });

  it.each([
    "<script>alert('xss')</script>",
    "DROP DATABASE my_consultorio",
  ])("bloqueia texto inseguro em nome cadastral: %s", (nome) => {
    const resultado = pacienteSchema.safeParse({
      nome,
      ativo: true,
      telefone: "31988499084",
    });

    expect(resultado.success).toBe(false);
    expect(mensagensDoResultado(resultado)).toContain(MENSAGEM_TEXTO_SEM_HTML);
  });

  it.each(["José da Silva", "Ana-Maria", "D'Ávila"])(
    "aceita nomes válidos: %s",
    (nome) => {
      const resultado = pacienteSchema.safeParse({
        nome,
        ativo: true,
        telefone: "31988499084",
      });

      expect(resultado.success).toBe(true);
    },
  );

  it("trata e-mail vazio como campo opcional omitido", () => {
    const resultado = pacienteSchema.safeParse({
      nome: "Paciente Teste",
      ativo: true,
      telefone: "31988499084",
      email: "",
    });

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.email).toBeUndefined();
    }
  });
});
