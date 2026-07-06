import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Table } from ".";

describe("Table security rendering", () => {
  it.each([
    ["paciente"],
    ["servico"],
    ["convenio"],
    ["secretaria"],
    ["tenant"],
  ])("renderiza nome de %s como texto, sem injetar HTML", (tipo) => {
    const maliciousName = `<img src=x onerror=alert('${tipo}')>`;

    render(
      <Table
        caption="Tabela segura"
        data={[{ id: tipo, nome: maliciousName }]}
        columns={[{ key: "nome", label: "Nome" }]}
      />,
    );

    expect(screen.getByText(maliciousName)).toBeInTheDocument();
    expect(document.querySelector("img")).toBeNull();
  });
});
