import type { FormaPagamento } from "../../services/api";

export function formatarData(isoDate?: string | null): string {
  if (!isoDate) {
    return "-";
  }

  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) {
    return isoDate;
  }

  return `${day}/${month}/${year}`;
}

export function formatarTaxaPercentual(value: number): string {
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

export function formatarRecebimento(
  formaPagamento: Pick<FormaPagamento, "recebimentoTipo" | "prazoRecebimentoDias">,
): string {
  if (formaPagamento.recebimentoTipo === "na_hora") {
    return "Na hora";
  }

  if (!formaPagamento.prazoRecebimentoDias) {
    return "A prazo";
  }

  const prazo = formaPagamento.prazoRecebimentoDias;
  return `${prazo} dia${prazo > 1 ? "s" : ""}`;
}
