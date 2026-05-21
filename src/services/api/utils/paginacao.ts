import type { PaginationRequest } from "../types/common";

export const LIMITE_MAXIMO_PAGINACAO = 100;

function normalizarLimitePaginacao(
  valor: number | undefined,
): number | undefined {
  if (valor === undefined) {
    return undefined;
  }

  return Math.min(Math.max(1, valor), LIMITE_MAXIMO_PAGINACAO);
}

export function normalizarRequisicaoPaginada<T extends PaginationRequest>(
  requisicao: T,
): T {
  const limite = normalizarLimitePaginacao(requisicao.limit);
  const pageSize = normalizarLimitePaginacao(requisicao.pageSize);

  return {
    ...requisicao,
    ...(limite !== undefined ? { limit: limite } : {}),
    ...(pageSize !== undefined ? { pageSize } : {}),
  };
}
