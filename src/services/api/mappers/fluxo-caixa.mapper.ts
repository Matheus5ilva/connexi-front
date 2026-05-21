import type { FiltrosFluxoCaixaFormData } from "../../../schemas/fluxo-caixa.schema";
import type { ConsultarFluxoCaixaRequest } from "../types/domain";

function removerUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as T;
}

function normalizarDataOpcional(value?: string): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function mapFiltrosFluxoCaixaParaRequest(
  formData: FiltrosFluxoCaixaFormData,
): ConsultarFluxoCaixaRequest {
  return removerUndefined({
    busca: formData.busca,
    dataInicio: normalizarDataOpcional(formData.dataInicio),
    dataFim: normalizarDataOpcional(formData.dataFim),
    tipo: formData.tipo === "TODOS" ? undefined : formData.tipo,
    status: formData.status === "TODOS" ? undefined : formData.status,
    categoria: formData.categoria,
    formaPagamentoId: formData.formaPagamentoId,
    origemTipo: formData.origemTipo,
  });
}
