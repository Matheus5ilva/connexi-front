import type {
  CancelarDocumentoReceberFormData,
  FiltrosDocumentoReceberFormData,
  MarcarDocumentoRecebidoFormData,
} from "../../../schemas/documento-receber.schema";
import type {
  CancelarDocumentoReceberRequest,
  ListarDocumentosReceberRequest,
  MarcarDocumentoRecebidoRequest,
} from "../types/domain";

function removerUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as T;
}

function normalizarDataOpcional(value?: string): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function mapFiltrosDocumentoReceberToListRequest(
  formData: FiltrosDocumentoReceberFormData,
): ListarDocumentosReceberRequest {
  const status =
    formData.situacao === "RECEBIDO" || formData.situacao === "CANCELADO"
      ? formData.situacao
      : formData.situacao === "PREVISTO" || formData.situacao === "ATRASADO"
        ? "PREVISTO"
        : undefined;

  return removerUndefined({
    busca: formData.busca,
    status,
    formaPagamentoId: formData.formaPagamentoId,
    dataPrevistaInicio: normalizarDataOpcional(formData.dataPrevistaInicio),
    dataPrevistaFim: normalizarDataOpcional(formData.dataPrevistaFim),
    somenteAtrasados: formData.situacao === "ATRASADO" ? true : undefined,
  });
}

export function mapMarcarDocumentoRecebidoFormToRequest(
  formData: MarcarDocumentoRecebidoFormData,
): MarcarDocumentoRecebidoRequest {
  return removerUndefined({
    dataRecebimento: normalizarDataOpcional(formData.dataRecebimento),
    observacao: formData.observacao,
  });
}

export function mapCancelarDocumentoReceberFormToRequest(
  formData: CancelarDocumentoReceberFormData,
): CancelarDocumentoReceberRequest {
  return removerUndefined({
    motivo: formData.motivo,
  });
}
