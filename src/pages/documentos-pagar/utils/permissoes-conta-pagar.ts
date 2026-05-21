import { usuarioEhMaster, type UsuarioAutenticado } from "../../../auth/session";
import type { DocumentoPagar } from "../../../services/api";

const estadosLiquidacao = new Set([
  "PAGO",
  "PAGA",
  "LIQUIDADO",
  "LIQUIDADA",
  "RECEBIDO",
  "RECEBIDA",
]);

function normalizarEstadoFinanceiro(valor: string | null | undefined): string {
  return valor?.trim().toUpperCase() ?? "";
}

export function contaPagarEstaLiquidada(
  documento: Pick<DocumentoPagar, "status" | "situacao">,
): boolean {
  return (
    estadosLiquidacao.has(normalizarEstadoFinanceiro(documento.status)) ||
    estadosLiquidacao.has(normalizarEstadoFinanceiro(documento.situacao))
  );
}

export function usuarioPodeAlterarContaPagar(
  usuario: UsuarioAutenticado | null,
  documento: Pick<DocumentoPagar, "status" | "situacao">,
): boolean {
  return usuarioEhMaster(usuario) || !contaPagarEstaLiquidada(documento);
}

export function usuarioPodeExcluirContaPagar(
  usuario: UsuarioAutenticado | null,
): boolean {
  return usuarioEhMaster(usuario);
}

export function usuarioPodePagarContaPagar(
  usuario: UsuarioAutenticado | null,
  documento: Pick<DocumentoPagar, "status">,
): boolean {
  return Boolean(usuario) && documento.status === "PENDENTE";
}

export function usuarioPodeCancelarContaPagar(
  usuario: UsuarioAutenticado | null,
  documento: Pick<DocumentoPagar, "status">,
): boolean {
  return Boolean(usuario) && documento.status === "PENDENTE";
}

export function usuarioPodeEstornarPagamentoContaPagar(
  usuario: UsuarioAutenticado | null,
  documento: Pick<DocumentoPagar, "status" | "situacao">,
): boolean {
  return Boolean(usuario) && contaPagarEstaLiquidada(documento);
}
