import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AvisoErroFormulario } from ".";

describe("AvisoErroFormulario", () => {
  it("renderiza mensagem geral sem expor detalhes técnicos", () => {
    render(
      <AvisoErroFormulario mensagem="Erro ao carregar dados. Tente novamente." />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByText("Erro ao carregar dados. Tente novamente."),
    ).toBeInTheDocument();
  });

  it("renderiza erros de campo de forma legível", () => {
    render(
      <AvisoErroFormulario
        mensagem="Verifique os campos informados."
        erros={[
          { campo: "Nome", mensagem: "O nome é obrigatório." },
          { campo: "Telefone", mensagem: "Informe o telefone." },
        ]}
      />,
    );

    expect(screen.getByText("Nome:")).toBeInTheDocument();
    expect(screen.getByText("O nome é obrigatório.")).toBeInTheDocument();
    expect(screen.getByText("Telefone:")).toBeInTheDocument();
    expect(screen.getByText("Informe o telefone.")).toBeInTheDocument();
  });
});
