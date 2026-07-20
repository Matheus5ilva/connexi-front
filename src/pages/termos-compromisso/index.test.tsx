import { cleanup, render, screen, within } from "@testing-library/react";
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

  it("renderiza indice com links para as secoes reais do documento", () => {
    render(
      <MemoryRouter initialEntries={["/termos-e-compromisso"]}>
        <TermosCompromissoPage />
      </MemoryRouter>,
    );

    const indice = screen.getByRole("navigation", {
      name: "Índice do documento",
    });
    const links = within(indice).getAllByRole("link");

    expect(links).toHaveLength(18);

    links.forEach((link) => {
      const href = link.getAttribute("href");

      expect(href).toMatch(/^#/);
      expect(document.querySelector(href ?? "")).toBeInTheDocument();
    });
  });

  it("usa a URL publica configurada nos links da pagina", () => {
    const siteUrl = window.location.origin;

    render(
      <MemoryRouter initialEntries={["/termos-e-compromisso"]}>
        <TermosCompromissoPage />
      </MemoryRouter>,
    );

    const header = document.querySelector("header");
    const footer = document.querySelector("footer");

    expect(header).not.toBeNull();
    expect(footer).not.toBeNull();

    const headerElement = header as HTMLElement;
    const footerElement = footer as HTMLElement;

    expect(
      within(headerElement).getByRole("link", { name: "CONNEXI" }),
    ).toHaveAttribute("href", `${siteUrl}/`);
    expect(
      within(headerElement).getByRole("link", { name: "O Problema" }),
    ).toHaveAttribute("href", `${siteUrl}/#problema`);
    expect(
      within(headerElement).getByRole("link", { name: "A Solução" }),
    ).toHaveAttribute("href", `${siteUrl}/#solucao`);
    expect(
      within(headerElement).getByRole("link", { name: "Para Quem" }),
    ).toHaveAttribute("href", `${siteUrl}/#para-quem`);
    expect(
      within(headerElement).getByRole("link", { name: "Preços" }),
    ).toHaveAttribute("href", `${siteUrl}/#precos`);
    expect(
      within(headerElement).getByRole("link", { name: "Termos" }),
    ).toHaveAttribute("href", `${siteUrl}/termos-e-compromisso`);
    expect(
      within(footerElement).getByRole("link", { name: "Página inicial" }),
    ).toHaveAttribute("href", `${siteUrl}/`);
    expect(
      within(footerElement).getByRole("link", { name: "Termos" }),
    ).toHaveAttribute("href", `${siteUrl}/termos-e-compromisso`);
  });

  it("preserva o conteudo juridico atual sem textos ficticios do template", () => {
    render(
      <MemoryRouter initialEntries={["/termos-e-compromisso"]}>
        <TermosCompromissoPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", {
        name: "Termos e Compromisso",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Condições gerais de uso" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "15. Nível de serviço" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/disponibilidade estimada de até 95% mensal/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/SOC 2/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/AES-256/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/99,9%/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/CONNEXI S\.A\./i)).not.toBeInTheDocument();
    expect(screen.queryByText(/00\.000\.000\/0001-00/i)).not.toBeInTheDocument();
  });

  it("mantem o canonical oficial de producao", () => {
    render(
      <MemoryRouter initialEntries={["/termos-e-compromisso"]}>
        <TermosCompromissoPage />
      </MemoryRouter>,
    );

    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://connexi.com.br/termos-e-compromisso",
    );
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
