import type { PerfilUsuario } from "../services/api/types/domain";
import type { UsuarioAutenticado } from "./session";

export type ItemMenuVisual =
  | "home"
  | "agenda"
  | "pacientes"
  | "profissional"
  | "especialidades"
  | "consultorio"
  | "contasReceber"
  | "contasPagar"
  | "fluxoCaixa"
  | "formasPagamento"
  | "convenios"
  | "servicos"
  | "configuracoes"
  | "secretarias"
  | "minhaConta";

type AcessoVisualPerfil = {
  itensMenu: readonly ItemMenuVisual[];
  rotas: readonly string[];
  rotasBloqueadas?: readonly string[];
};

type UsuarioAcessoVisual = Pick<
  UsuarioAutenticado,
  | "perfil"
  | "podeAcessarFinanceiro"
  | "tenantPermiteSecretaria"
  | "tenantPlano"
>;

const TODOS_ITENS_MENU: readonly ItemMenuVisual[] = [
  "home",
  "agenda",
  "pacientes",
  "profissional",
  "especialidades",
  "consultorio",
  "contasReceber",
  "contasPagar",
  "fluxoCaixa",
  "formasPagamento",
  "convenios",
  "servicos",
  "configuracoes",
  "secretarias",
  "minhaConta",
];

const ACESSO_TOTAL: AcessoVisualPerfil = {
  itensMenu: TODOS_ITENS_MENU,
  rotas: ["*"],
};

const ITENS_SECRETARIA_BASE: readonly ItemMenuVisual[] = [
  "agenda",
  "pacientes",
  "minhaConta",
];

const ITENS_SECRETARIA_FINANCEIRO: readonly ItemMenuVisual[] = [
  ...ITENS_SECRETARIA_BASE,
  "contasReceber",
  "contasPagar",
  "fluxoCaixa",
  "formasPagamento",
  "convenios",
  "servicos",
];

const ROTAS_SECRETARIA_BASE: readonly string[] = [
  "/acesso-negado",
  "/agenda",
  "/pacientes",
  "/pacientes/novo",
  "/pacientes/:id",
  "/pacientes/:id/editar",
  "/financeiro/servicos",
  "/financeiro/servicos/:id",
  "/configuracoes/minha-conta",
];

const ROTAS_SECRETARIA_FINANCEIRO: readonly string[] = [
  ...ROTAS_SECRETARIA_BASE,
  "/financeiro/contas-a-receber",
  "/financeiro/contas-a-receber/:id",
  "/financeiro/contas-a-pagar",
  "/financeiro/contas-a-pagar/novo",
  "/financeiro/contas-a-pagar/:id",
  "/financeiro/contas-a-pagar/:id/editar",
  "/financeiro/fluxo-caixa",
  "/financeiro/formas-pagamento",
  "/financeiro/formas-pagamento/:id",
  "/financeiro/convenios",
  "/financeiro/convenios/:id",
  "/financeiro/servicos",
  "/financeiro/servicos/:id",
];

const ROTAS_ESCRITA_CADASTROS_FINANCEIROS: readonly string[] = [
  "/financeiro/formas-pagamento/novo",
  "/financeiro/formas-pagamento/:id/editar",
  "/financeiro/convenios/novo",
  "/financeiro/convenios/:id/editar",
  "/financeiro/servicos/novo",
  "/financeiro/servicos/:id/editar",
];

const ROTAS_SECRETARIAS: readonly string[] = [
  "/secretarias",
  "/secretarias/novo",
  "/secretarias/:id",
  "/secretarias/:id/editar",
];

const ROTAS_PUBLICAS_POS_LOGIN: readonly string[] = [
  "/login",
  "/recuperar-senha",
  "/resetar-senha",
  "/esqueci-senha",
  "/redefinir-senha",
  "/auth/reset-password",
  "/acesso-negado",
  "/tenant-inexistente",
];

const PREFIXOS_ROTAS_PRIVADAS_POS_LOGIN: readonly string[] = [
  "/dashboard",
  "/agenda",
  "/profissional",
  "/consultorio",
  "/consultas",
  "/pacientes",
  "/financeiro",
  "/configuracoes",
  "/secretarias",
];

const ACESSO_VISUAL_POR_PERFIL: Record<PerfilUsuario, AcessoVisualPerfil> = {
  MASTER: ACESSO_TOTAL,
  PROFISSIONAL: ACESSO_TOTAL,
  SECRETARIA: {
    itensMenu: ITENS_SECRETARIA_BASE,
    rotas: ROTAS_SECRETARIA_BASE,
    rotasBloqueadas: [
      "/consultas/:id",
      "/pacientes/:id/prontuarios",
      ...ROTAS_ESCRITA_CADASTROS_FINANCEIROS,
    ],
  },
};

function obterAcessoVisual(
  usuario: UsuarioAcessoVisual | null | undefined,
): AcessoVisualPerfil | null {
  if (!usuario) {
    return null;
  }

  if (usuario.perfil === "SECRETARIA" && usuario.podeAcessarFinanceiro) {
    return {
      itensMenu: ITENS_SECRETARIA_FINANCEIRO,
      rotas: ROTAS_SECRETARIA_FINANCEIRO,
      rotasBloqueadas: [
        "/consultas/:id",
        "/pacientes/:id/prontuarios",
        ...ROTAS_ESCRITA_CADASTROS_FINANCEIROS,
      ],
    };
  }

  return ACESSO_VISUAL_POR_PERFIL[usuario.perfil] ?? null;
}

function rotaCombina(padrao: string, pathname: string): boolean {
  if (padrao === "*") {
    return true;
  }

  const partesPadrao = padrao.split("/").filter(Boolean);
  const partesRota = pathname.split("/").filter(Boolean);

  if (partesPadrao.length !== partesRota.length) {
    return false;
  }

  return partesPadrao.every(
    (parte, index) =>
      parte.startsWith(":") || parte === partesRota[index],
  );
}

function tenantPermiteSecretarias(
  usuario: UsuarioAcessoVisual | null | undefined,
): boolean {
  return (
    Boolean(usuario?.tenantPermiteSecretaria) ||
    usuario?.tenantPlano === "EQUIPE"
  );
}

function normalizarRotaInterna(
  rota: string | null | undefined,
): { pathname: string; completa: string } | null {
  const rotaNormalizada = rota?.trim();
  if (
    !rotaNormalizada ||
    !rotaNormalizada.startsWith("/") ||
    rotaNormalizada.startsWith("//") ||
    rotaNormalizada.includes("\\")
  ) {
    return null;
  }

  try {
    const url = new URL(rotaNormalizada, "http://connexi.local");
    return {
      pathname: url.pathname,
      completa: `${url.pathname}${url.search}${url.hash}`,
    };
  } catch {
    return null;
  }
}

function rotaPublicaPosLogin(pathname: string): boolean {
  return ROTAS_PUBLICAS_POS_LOGIN.includes(pathname);
}

function rotaConhecidaPosLogin(pathname: string): boolean {
  return PREFIXOS_ROTAS_PRIVADAS_POS_LOGIN.some(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`),
  );
}

export function rotaPodeSerUltimaRotaPrivada(
  rota: string | null | undefined,
): boolean {
  const rotaInterna = normalizarRotaInterna(rota);
  return Boolean(
    rotaInterna &&
      rotaConhecidaPosLogin(rotaInterna.pathname) &&
      !rotaPublicaPosLogin(rotaInterna.pathname),
  );
}

export function usuarioPodeVerItemMenu(
  usuario: UsuarioAcessoVisual | null | undefined,
  item: ItemMenuVisual,
): boolean {
  if (item === "secretarias" && !tenantPermiteSecretarias(usuario)) {
    return false;
  }

  return Boolean(obterAcessoVisual(usuario)?.itensMenu.includes(item));
}

export function usuarioPodeAcessarRota(
  usuario: UsuarioAcessoVisual | null | undefined,
  pathname: string,
): boolean {
  const acesso = obterAcessoVisual(usuario);

  if (!acesso) {
    return false;
  }

  if (
    ROTAS_SECRETARIAS.some((rota) => rotaCombina(rota, pathname)) &&
    !tenantPermiteSecretarias(usuario)
  ) {
    return false;
  }

  if (acesso.rotasBloqueadas?.some((rota) => rotaCombina(rota, pathname))) {
    return false;
  }

  return acesso.rotas.some((rota) => rotaCombina(rota, pathname));
}

export function obterRotaInicialPermitida(
  usuario: UsuarioAcessoVisual | null | undefined,
): string {
  return usuario?.perfil === "SECRETARIA" ? "/agenda" : "/dashboard";
}

export function obterDestinoPosLogin(
  usuario: UsuarioAcessoVisual | null | undefined,
  ultimaRota: string | null | undefined,
): string {
  const destinoPadrao = obterRotaInicialPermitida(usuario);

  if (usuario?.perfil !== "MASTER") {
    return destinoPadrao;
  }

  const rotaInterna = normalizarRotaInterna(ultimaRota);
  if (
    !rotaInterna ||
    !rotaConhecidaPosLogin(rotaInterna.pathname) ||
    rotaPublicaPosLogin(rotaInterna.pathname) ||
    !usuarioPodeAcessarRota(usuario, rotaInterna.pathname)
  ) {
    return destinoPadrao;
  }

  return rotaInterna.completa;
}
