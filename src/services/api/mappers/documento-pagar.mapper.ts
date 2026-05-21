import type {
  CancelarDocumentoPagarFormData,
  DocumentoPagarFormData,
  FiltrosDocumentoPagarFormData,
  MarcarDocumentoPagarPagoFormData,
} from "../../../schemas/documento-pagar.schema";
import type {
  AtualizarDocumentoPagarRequest,
  CancelarDocumentoPagarRequest,
  CriarDocumentoPagarRequest,
  DocumentoPagar,
  ListarDocumentosPagarRequest,
  MarcarDocumentoPagarPagoRequest,
} from "../types/domain";

function removeUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as T;
}

function trimOptional(value?: string): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeOptionalDate(value?: string): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function mapDocumentoPagarFormToCreateRequest(
  formData: DocumentoPagarFormData,
): CriarDocumentoPagarRequest {
  return removeUndefined({
    descricao: formData.descricao.trim(),
    valor: formData.valor,
    dataVencimento: formData.dataVencimento,
    statusInicial: formData.status,
    categoria: trimOptional(formData.categoria),
    observacao: trimOptional(formData.observacao),
    parcelado: formData.parcelado,
    quantidadeParcelas: formData.parcelado
      ? formData.quantidadeParcelas
      : undefined,
  });
}

export function mapDocumentoPagarFormToUpdateRequest(
  formData: DocumentoPagarFormData,
): AtualizarDocumentoPagarRequest {
  return removeUndefined({
    descricao: formData.descricao.trim(),
    valor: formData.valor,
    dataVencimento: formData.dataVencimento,
    status: formData.status,
    categoria: trimOptional(formData.categoria),
    observacao: trimOptional(formData.observacao),
  });
}

export function mapFiltrosDocumentoPagarToListRequest(
  formData: FiltrosDocumentoPagarFormData,
): ListarDocumentosPagarRequest {
  return removeUndefined({
    busca: trimOptional(formData.busca),
    situacao: formData.situacao === "todos" ? undefined : formData.situacao,
    categoria: trimOptional(formData.categoria),
    dataVencimentoInicio: normalizeOptionalDate(formData.dataVencimentoInicio),
    dataVencimentoFim: normalizeOptionalDate(formData.dataVencimentoFim),
  });
}

export function mapMarcarDocumentoPagarPagoFormToRequest(
  formData: MarcarDocumentoPagarPagoFormData,
): MarcarDocumentoPagarPagoRequest {
  return removeUndefined({
    dataPagamento: normalizeOptionalDate(formData.dataPagamento),
    observacao: trimOptional(formData.observacao),
  });
}

export function mapCancelarDocumentoPagarFormToRequest(
  formData: CancelarDocumentoPagarFormData,
): CancelarDocumentoPagarRequest {
  return {
    motivo: formData.motivo.trim(),
  };
}

export function mapDocumentoPagarToFormData(
  documento: DocumentoPagar,
): DocumentoPagarFormData {
  return {
    descricao: documento.descricao,
    valor: documento.valorParcela,
    dataVencimento: documento.dataVencimento,
    status: documento.status === "PAGO" ? "PAGO" : "PENDENTE",
    categoria: documento.categoria ?? "",
    observacao: documento.observacao ?? "",
    parcelado: documento.parcelado,
    quantidadeParcelas: documento.totalParcelas || 1,
  };
}
