import type {
  FinalizarConsultaRequest,
  RegistrarRecebimentoAgendamentoRequest,
  SalvarConsultaRequest,
} from "../types/domain";
import type {
  ConsultaFormData,
  FinalizarConsultaFormData,
} from "../../../schemas/consulta.schema";

function removeUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as T;
}

function trimOptional(value?: string): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function mapRecebimento(
  recebimento?: FinalizarConsultaFormData["recebimento"],
): RegistrarRecebimentoAgendamentoRequest | undefined {
  if (!recebimento) {
    return undefined;
  }

  const normalized = removeUndefined({
    formaPagamentoId: recebimento.formaPagamentoId,
    numeroParcelas: recebimento.numeroParcelas,
    intervaloParcelasDias: recebimento.intervaloParcelasDias,
    descontoValor: recebimento.descontoValor,
    observacao: trimOptional(recebimento.observacao),
  });

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

export function mapSalvarConsultaRequest(
  formData: ConsultaFormData,
): SalvarConsultaRequest {
  return removeUndefined({
    tempoConsultaMinutos: formData.tempoConsultaMinutos,
    queixaPrincipal: trimOptional(formData.queixaPrincipal),
    registroConsulta: trimOptional(formData.registroConsulta),
    conduta: trimOptional(formData.conduta),
    observacoes: trimOptional(formData.observacoes),
    receitaDigitada: trimOptional(formData.receitaDigitada),
  });
}

export function mapFinalizarConsultaRequest(
  formData: ConsultaFormData,
  recebimento?: FinalizarConsultaFormData["recebimento"],
): FinalizarConsultaRequest {
  return removeUndefined({
    ...mapSalvarConsultaRequest(formData),
    recebimento: mapRecebimento(recebimento),
  });
}
