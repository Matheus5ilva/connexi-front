import {
  canTransitionAgendamentoStatus,
  getAgendaStatusUi,
  isConsultaEditavelByStatus,
  shouldAutoStartConsultaOnOpen,
} from "../../../domain/atendimento-status";
import type { Agendamento, StatusAgendamento } from "../../../services/api";

type StatusAgendamentoUi = ReturnType<typeof getAgendaStatusUi>;

export function getStatusAgendamentoUi(
  status: StatusAgendamento,
): StatusAgendamentoUi {
  return getAgendaStatusUi(status);
}

export function isAgendamentoEditavel(status: StatusAgendamento): boolean {
  return isConsultaEditavelByStatus(status);
}

export function shouldAutoStartConsulta(
  status: StatusAgendamento,
): boolean {
  return shouldAutoStartConsultaOnOpen(status);
}

export function canTransitionStatusAgendamento(
  fromStatus: StatusAgendamento,
  toStatus: StatusAgendamento,
): boolean {
  return canTransitionAgendamentoStatus(fromStatus, toStatus);
}

export function formatarTipoAtendimento(
  tipoAtendimento: Agendamento["tipoAtendimento"],
  convenio?: string | null,
): string {
  if (tipoAtendimento === "CONVENIO") {
    return convenio ? `Convênio • ${convenio}` : "Convênio";
  }

  return "Particular";
}

export function formatarTipoConsulta(
  tipoConsulta?: Agendamento["tipoConsulta"] | null,
): string {
  return tipoConsulta ?? "Consulta";
}
