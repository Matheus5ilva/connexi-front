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

const ACESSO_VISUAL_POR_PERFIL: Record<PerfilUsuario, AcessoVisualPerfil> = {
  MASTER: ACESSO_TOTAL,
  PROFISSIONAL: ACESSO_TOTAL,
  SECRETARIA: {
    itensMenu: ITENS_SECRETARIA_BASE,
    rotas: ROTAS_SECRETARIA_BASE,
    rotasBloqueadas: ["/consultas/:id", "/pacientes/:id/prontuarios"],
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
  return usuario?.perfil === "SECRETARIA" ? "/agenda" : "/";
}
