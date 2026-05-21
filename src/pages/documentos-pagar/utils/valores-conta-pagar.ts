import type { DocumentoPagar } from "../../../services/api";

export function obterValorParcelaContaPagar(
  documento: Pick<DocumentoPagar, "valorParcela">,
): number {
  return documento.valorParcela;
}

export function obterValorTotalContaPagar(
  documento: Pick<DocumentoPagar, "valorTotal">,
): number {
  return documento.valorTotal;
}
