import type {
  DocumentoReceber,
  RecebimentoTipo,
  SituacaoDocumentoReceber,
  StatusDocumentoReceber,
  TipoAtendimento,
} from "../../services/api";
import { formatarDataSomenteDia } from "../../domain/data-somente-dia";

export type SituacaoContaReceberFiltro = "todos" | SituacaoDocumentoReceber;

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatarData(dataIso?: string | null): string {
  return formatarDataSomenteDia(dataIso);
}

export function formatarPercentualTaxa(valor: number): string {
  return `${valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}%`;
}

export function formatarTipoAtendimento(tipo: TipoAtendimento): string {
  return tipo === "CONVENIO" ? "Convênio" : "Particular";
}

export function formatarTipoRecebimento(tipo: RecebimentoTipo): string {
  return tipo === "prazo" ? "Prazo" : "Na hora";
}

export function formatarRecebimento(
  documento: Pick<DocumentoReceber, "recebimentoTipo" | "prazoRecebimentoDias">,
): string {
  if (documento.recebimentoTipo === "na_hora") {
    return "Na hora";
  }

  const prazo = documento.prazoRecebimentoDias;
  if (prazo <= 0) {
    return "Prazo";
  }

  return `${prazo} dia${prazo > 1 ? "s" : ""}`;
}

export function formatarSituacaoDocumentoReceber(
  situacao: SituacaoDocumentoReceber,
): string {
  switch (situacao) {
    case "RECEBIDO":
      return "Recebido";
    case "ATRASADO":
      return "Atrasado";
    case "CANCELADO":
      return "Cancelado";
    default:
      return "Previsto";
  }
}

export function formatarStatusDocumentoReceber(
  status: StatusDocumentoReceber,
): string {
  switch (status) {
    case "RECEBIDO":
      return "Recebido";
    case "CANCELADO":
      return "Cancelado";
    default:
      return "Previsto";
  }
}

export function obterDicaRecebimento(documento: DocumentoReceber): string {
  if (documento.situacao === "RECEBIDO") {
    return documento.dataRecebimento
      ? `Recebido em ${formatarData(documento.dataRecebimento)}`
      : "Recebido";
  }

  if (documento.situacao === "CANCELADO") {
    return documento.dataCancelamento
      ? `Cancelado em ${formatarData(documento.dataCancelamento)}`
      : "Cancelado";
  }

  if (documento.situacao === "ATRASADO") {
    return "Recebimento em atraso";
  }

  return "Recebimento previsto";
}

export function obterRotuloParcela(
  documento: Pick<DocumentoReceber, "parcelaNumero" | "totalParcelas">,
): string | null {
  if (documento.totalParcelas <= 1) {
    return null;
  }

  return `${documento.parcelaNumero}/${documento.totalParcelas}`;
}
