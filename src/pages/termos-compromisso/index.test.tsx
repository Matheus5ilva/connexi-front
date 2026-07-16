import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TermosCompromissoPage } from ".";

describe("TermosCompromissoPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("exibe acao Voltar no inicio da pagina", () => {
    render(
      <MemoryRouter initialEntries={["/termos-e-compromisso"]}>
        <TermosCompromissoPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "Voltar" })).toBeInTheDocument();
  });

  it("usa a landing como fallback quando nao ha historico util", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/termos-e-compromisso"]}>
        <Routes>
          <Route path="/" element={<h1>Landing publica</h1>} />
          <Route
            path="/termos-e-compromisso"
            element={<TermosCompromissoPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Voltar" }));

    expect(
      screen.getByRole("heading", { name: "Landing publica" }),
    ).toBeInTheDocument();
  });
});
