/// <reference types="node" />

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import paginaInicialSource from "./index.tsx?raw";
import { PaginaInicialPublica } from ".";

const diretorioAtual = dirname(fileURLToPath(import.meta.url));
const paginaInicialStyles = readFileSync(
  join(diretorioAtual, "styles.module.css"),
  "utf8",
);

function obterMensagemWhatsApp(href: string): string {
  return decodeURIComponent(new URL(href).searchParams.get("text") ?? "");
}

describe("PaginaInicialPublica", () => {
  afterEach(() => {
    cleanup();
  });

  it("renderiza uma landing com um unico h1 e o CTA principal visivel", () => {
    render(<PaginaInicialPublica />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Organize seus atendimentos em um só lugar",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Quero conhecer/i }).length).toBeGreaterThan(0);
  });

  it("mantem o header sem login e sem links placeholder", () => {
    render(<PaginaInicialPublica />);

    expect(screen.queryByText(/^Entrar$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Login$/i)).not.toBeInTheDocument();
    expect(document.querySelector('a[href="/login"]')).not.toBeInTheDocument();
    expect(document.querySelector('a[href="#"]')).not.toBeInTheDocument();
    expect(document.querySelector('a[href^="#"]')).not.toHaveAttribute("href", "#");

    expect(screen.getByRole("link", { name: "Termos" })).toHaveAttribute(
      "href",
      `${window.location.origin}/termos-e-compromisso`,
    );
  });

  it("mantem a marca completa e uma unica instancia no header", () => {
    render(<PaginaInicialPublica />);

    const header = document.querySelector("header");

    expect(header).not.toBeNull();
    const headerElement = header as HTMLElement;

    expect(
      within(headerElement).getByRole("link", { name: "CONNEXI" }),
    ).toHaveAttribute("href", "/");
    within(headerElement)
      .getAllByRole("link", { name: "Para Quem" })
      .forEach((link) => {
        expect(link).toHaveAttribute("href", "#para-quem");
      });
    expect(document.getElementById("para-quem")).toBeInTheDocument();
    expect(headerElement.querySelectorAll("[data-brand-logo]")).toHaveLength(1);
    expect(headerElement.querySelector("[data-logo-symbol]")).toBeInTheDocument();
    expect(within(headerElement).getByText("CONNEXI")).toBeInTheDocument();
    expect(
      within(headerElement).getAllByRole("link", { name: "Quero conhecer" }).length,
    ).toBeGreaterThan(0);
    expect(
      within(headerElement).getByRole("button", { name: "Abrir menu" }),
    ).toHaveAttribute("aria-controls", "landing-mobile-menu");
  });

  it("renderiza exatamente os tres cards de problema exigidos", () => {
    render(<PaginaInicialPublica />);

    const cards = ["Agenda separada", "Histórico espalhado", "Financeiro manual"];

    cards.forEach((titulo) => {
      expect(screen.getByRole("heading", { level: 3, name: titulo })).toBeInTheDocument();
    });

    expect(screen.queryByText("Segurança de dados")).not.toBeInTheDocument();
  });

  it("renderiza somente os dois blocos de solucao especificados", () => {
    render(<PaginaInicialPublica />);

    expect(
      screen.getByRole("heading", {
        name: "Uma rotina mais profissional em poucos cliques.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Controle unificado para maior segurança.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Fluxo de Caixa")).toBeInTheDocument();
    expect(screen.getByText("82%")).toBeInTheDocument();
    expect(screen.getByText("R$ 4.680")).toBeInTheDocument();
    expect(screen.getByText("R$ 1.200")).toBeInTheDocument();
  });

  it("mantem os planos oficiais sem tabela comparativa", () => {
    render(<PaginaInicialPublica />);

    expect(screen.getByText("Plano SOLO")).toBeInTheDocument();
    expect(screen.getByText("Plano EQUIPE")).toBeInTheDocument();
    expect(screen.getByText(/R\$ 44,90/)).toBeInTheDocument();
    expect(screen.getByText(/R\$ 59,90/)).toBeInTheDocument();
    expect(document.querySelector("table")).not.toBeInTheDocument();
    expect(screen.queryByText(/Compare os planos/i)).not.toBeInTheDocument();
  });

  it("prepara animacao por data-reveal sem pre-ativar elementos por viewport", () => {
    render(<PaginaInicialPublica />);

    const elementosReveal = Array.from(document.querySelectorAll("[data-reveal]"));
    const tituloPrincipal = screen.getAllByRole("heading", { level: 1 })[0];

    expect(elementosReveal.length).toBeGreaterThan(0);
    expect(
      elementosReveal.every((elemento) =>
        String(elemento.getAttribute("class")).includes("reveal"),
      ),
    ).toBe(true);
    expect(tituloPrincipal).toHaveAttribute("data-reveal");
    expect(tituloPrincipal.className).toContain("reveal");
    expect(tituloPrincipal.className).toContain("delay100");

    expect(paginaInicialSource).toContain('querySelectorAll<HTMLElement>("[data-reveal]")');
    expect(paginaInicialSource).toContain("new IntersectionObserver");
    expect(paginaInicialSource).toContain("observer.unobserve");
    expect(paginaInicialSource).toContain("threshold: 0.1");
    expect(paginaInicialSource).toContain('rootMargin: "0px 0px -50px 0px"');
    expect(paginaInicialSource).toContain("requestAnimationFrame");
    expect(paginaInicialSource).not.toContain("setTimeout");
    expect(paginaInicialSource).not.toContain(
      "getBoundingClientRect().top < window.innerHeight",
    );
    expect(paginaInicialSource).toContain("styles.revealReady");
    expect(paginaInicialStyles).toContain("--reveal-delay: 0ms");
    expect(paginaInicialStyles).toContain(".revealReady .reveal");
    expect(paginaInicialStyles).toContain("translate3d(0, 30px, 0)");
    expect(paginaInicialStyles).toContain("transition-duration: 800ms");
    expect(paginaInicialStyles).toContain("transition-delay: var(--reveal-delay)");
    expect(paginaInicialStyles).toContain(".revealReady .reveal.revealActive");
    expect(paginaInicialStyles).toContain(".delay150");
    expect(paginaInicialStyles).toContain(".delay250");
    expect(paginaInicialStyles).toContain(".delay350");
    expect(paginaInicialStyles).not.toContain("transition: all");
  });

  it("nao usa largura 100vw na landing para evitar overflow horizontal", () => {
    expect(paginaInicialStyles).not.toContain("width: 100vw");
  });

  it("mantem SOLO e EQUIPE com CTAs distintos para WhatsApp", () => {
    render(<PaginaInicialPublica />);

    const soloCard = screen.getByText("Plano SOLO").closest("article");
    const equipeCard = screen.getByText("Plano EQUIPE").closest("article");

    expect(soloCard).not.toBeNull();
    expect(equipeCard).not.toBeNull();

    const soloCta = within(soloCard as HTMLElement).getByRole("link", {
      name: "Quero conhecer",
    });
    const equipeCta = within(equipeCard as HTMLElement).getByRole("link", {
      name: "Quero o plano EQUIPE",
    });

    expect(soloCta).toHaveAttribute("href", expect.stringContaining("https://wa.me/"));
    expect(equipeCta).toHaveAttribute("href", expect.stringContaining("https://wa.me/"));
    expect(soloCta).toHaveAttribute("target", "_blank");
    expect(equipeCta).toHaveAttribute("target", "_blank");
    expect(obterMensagemWhatsApp(soloCta.getAttribute("href") ?? "")).toBe(
      "Olá! Tenho interesse no plano SOLO do CONNEXI por R$ 44,90 por mês. Gostaria de saber como contratar.",
    );
    expect(obterMensagemWhatsApp(equipeCta.getAttribute("href") ?? "")).toBe(
      "Olá! Tenho interesse no plano EQUIPE do CONNEXI por R$ 59,90 por mês. Gostaria de saber como contratar.",
    );
    expect(
      within(equipeCard as HTMLElement).queryByText("Disponível mediante contato"),
    ).not.toBeInTheDocument();
  });

  it("remove FAQ e dados estruturados de FAQPage", () => {
    render(<PaginaInicialPublica />);

    expect(screen.queryByText(/Perguntas frequentes/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Preciso instalar algum programa/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/FAQ/i)).not.toBeInTheDocument();
    expect(document.body).not.toHaveTextContent("FAQPage");
  });

  it("abre e fecha o menu mobile de forma acessivel", async () => {
    const user = userEvent.setup();
    render(<PaginaInicialPublica />);

    const menuButton = screen.getByRole("button", { name: "Abrir menu" });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    await user.click(menuButton);
    expect(
      screen.getByRole("button", { name: "Fechar menu" }),
    ).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getAllByRole("link", { name: "A Solução" })[1]);
    expect(screen.getByRole("button", { name: "Abrir menu" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});
