import type {
  Agendamento,
  AtualizarAgendamentoRequest,
  AtualizarStatusAgendamentoRequest,
  CriarAgendamentoRequest,
  StatusAgendamento,
} from "../types/domain";
import type {
  AgendamentoFormularioData,
  RemarcacaoAgendamentoFormularioData,
} from "../../../schemas/agendamento.schema";

type CriarAgendamentoMapperContext = {
  profissionalId: number;
};

function limparString(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const texto = value.trim();
  return texto.length > 0 ? texto : undefined;
}

function removerUndefined<T extends Record<string, unknown>>(objeto: T): T {
  return Object.fromEntries(
    Object.entries(objeto).filter(([, valor]) => valor !== undefined),
  ) as T;
}

export function mapFormularioAgendamentoParaCriarRequest(
  formData: AgendamentoFormularioData,
  context: CriarAgendamentoMapperContext,
): CriarAgendamentoRequest {
  return removerUndefined({
    data: formData.data,
    profissionalId: context.profissionalId,
    pacienteId: formData.pacienteId,
    servicoId: formData.servicoId,
    tipoAtendimento: formData.tipoAtendimento,
    convenioId:
      formData.tipoAtendimento === "CONVENIO" ? formData.convenioId : undefined,
    formaPagamentoId: formData.formaPagamentoId,
    horario: formData.horario,
    duracaoMinutos: formData.duracaoMinutos,
    tipoConsulta: formData.tipoConsulta,
    observacao: limparString(formData.observacao),
  });
}

export function mapFormularioRemarcacaoParaAtualizarRequest(
  formData: RemarcacaoAgendamentoFormularioData,
): AtualizarAgendamentoRequest {
  return removerUndefined({
    data: formData.data,
    horario: formData.horario,
    duracaoMinutos: formData.duracaoMinutos,
    tipoAtendimento: formData.tipoAtendimento,
    convenioId:
      formData.tipoAtendimento === "CONVENIO" ? formData.convenioId : undefined,
    formaPagamentoId: formData.formaPagamentoId,
    tipoConsulta: formData.tipoConsulta,
    observacao: limparString(formData.observacao),
  });
}

export function mapAgendamentoParaFormularioRemarcacao(
  agendamento: Agendamento,
): RemarcacaoAgendamentoFormularioData {
  return {
    data: agendamento.data,
    horario: agendamento.horario,
    duracaoMinutos: agendamento.duracaoMinutos,
    tipoAtendimento: agendamento.tipoAtendimento,
    convenioId: agendamento.convenioId ?? undefined,
    formaPagamentoId: agendamento.formaPagamentoId ?? undefined,
    tipoConsulta: agendamento.tipoConsulta ?? undefined,
    observacao: agendamento.observacao ?? "",
  };
}

export function mapStatusAgendamentoParaAtualizarRequest(
  status: StatusAgendamento,
): AtualizarStatusAgendamentoRequest {
  return {
    status,
  };
}
