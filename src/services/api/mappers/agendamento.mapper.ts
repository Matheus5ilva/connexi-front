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
  agora?: Date;
  registrarRetroativoRealizado?: boolean;
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

function criarDataHoraLocal(data: string, horario: string): Date {
  const partesData = data.split("-").map(Number);
  const partesHorario = horario.split(":").map(Number);
  const ano = partesData[0] ?? 0;
  const mes = partesData[1] ?? 1;
  const dia = partesData[2] ?? 1;
  const hora = partesHorario[0] ?? 0;
  const minuto = partesHorario[1] ?? 0;

  return new Date(ano, mes - 1, dia, hora, minuto, 0, 0);
}

function isAgendamentoNoPassado(
  formData: Pick<AgendamentoFormularioData, "data" | "horario">,
  agora = new Date(),
): boolean {
  return (
    criarDataHoraLocal(formData.data, formData.horario).getTime() <
    agora.getTime()
  );
}

export function mapFormularioAgendamentoParaCriarRequest(
  formData: AgendamentoFormularioData,
  context: CriarAgendamentoMapperContext,
): CriarAgendamentoRequest {
  const status: StatusAgendamento | undefined =
    context.registrarRetroativoRealizado !== false &&
    isAgendamentoNoPassado(formData, context.agora)
      ? "REALIZADO"
      : undefined;

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
    status,
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
