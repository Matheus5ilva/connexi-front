import type { StatusAgendamento } from "../services/api";
import { obterDataSomenteDiaAtual } from "./data-somente-dia";

export type ProntuarioStatus = "Finalizado" | "Em andamento";
export type ContaReceberStatus = "Recebido" | "Pendente" | "Atrasado";

type AgendaStatusUi = {
  label: string;
  className: string;
  modalClassName: string;
};

const STATUS_UI: Record<StatusAgendamento, AgendaStatusUi> = {
  AGUARDANDO: {
    label: "Agendado",
    className: "agendado",
    modalClassName: "statusAguardando",
  },
  CONFIRMADO: {
    label: "Confirmado",
    className: "confirmado",
    modalClassName: "statusConfirmado",
  },
  EM_ATENDIMENTO: {
    label: "Em atendimento",
    className: "atendimento",
    modalClassName: "statusAtendimento",
  },
  REALIZADO: {
    label: "Realizado",
    className: "realizado",
    modalClassName: "statusRealizado",
  },
  CANCELADO: {
    label: "Cancelado",
    className: "cancelado",
    modalClassName: "statusCancelado",
  },
  FALTOU: {
    label: "Faltou",
    className: "faltou",
    modalClassName: "statusFaltou",
  },
};

const TERMINAL_STATUSES: ReadonlySet<StatusAgendamento> = new Set([
  "REALIZADO",
  "CANCELADO",
  "FALTOU",
]);

const OPERACIONAL_STATUSES: ReadonlySet<StatusAgendamento> = new Set([
  "AGUARDANDO",
  "CONFIRMADO",
  "EM_ATENDIMENTO",
]);

const AUTO_START_STATUSES: ReadonlySet<StatusAgendamento> = new Set([
  "AGUARDANDO",
  "CONFIRMADO",
]);

const TRANSITIONS: Record<StatusAgendamento, readonly StatusAgendamento[]> = {
  AGUARDANDO: ["CONFIRMADO", "EM_ATENDIMENTO", "CANCELADO", "FALTOU"],
  CONFIRMADO: ["EM_ATENDIMENTO", "CANCELADO", "FALTOU"],
  EM_ATENDIMENTO: ["REALIZADO", "CANCELADO", "FALTOU"],
  REALIZADO: [],
  CANCELADO: [],
  FALTOU: [],
};

export function getAgendaStatusUi(status: StatusAgendamento): AgendaStatusUi {
  return STATUS_UI[status];
}

export function getAgendaStatusModalClassName(status: StatusAgendamento): string {
  return STATUS_UI[status].modalClassName;
}

export function isAgendamentoStatusTerminal(status: StatusAgendamento): boolean {
  return TERMINAL_STATUSES.has(status);
}

export function isAgendamentoStatusOperacional(status: StatusAgendamento): boolean {
  return OPERACIONAL_STATUSES.has(status);
}

export function isConsultaRealizada(status: StatusAgendamento): boolean {
  return status === "REALIZADO";
}

export function isConsultaEditavelByStatus(status: StatusAgendamento): boolean {
  return !isAgendamentoStatusTerminal(status);
}

export function canFinalizeConsultaByStatus(status: StatusAgendamento): boolean {
  return status === "EM_ATENDIMENTO";
}

export function shouldAutoStartConsultaOnOpen(status: StatusAgendamento): boolean {
  return AUTO_START_STATUSES.has(status);
}

export function canTransitionAgendamentoStatus(
  fromStatus: StatusAgendamento,
  toStatus: StatusAgendamento,
): boolean {
  if (fromStatus === toStatus) {
    return true;
  }

  return TRANSITIONS[fromStatus].includes(toStatus);
}

export function resolveProntuarioStatusFromConsulta(
  consultaStatus: StatusAgendamento,
  finalizarConsulta: boolean,
): ProntuarioStatus {
  if (finalizarConsulta || isConsultaRealizada(consultaStatus)) {
    return "Finalizado";
  }

  return "Em andamento";
}

export function shouldShowProntuarioFinalizadoBanner(
  consultaStatus: StatusAgendamento,
  prontuarioStatus?: ProntuarioStatus | null,
): boolean {
  return Boolean(prontuarioStatus) && isConsultaRealizada(consultaStatus) && prontuarioStatus === "Finalizado";
}

export function canOpenConsultaFromProntuario(
  prontuarioStatus: ProntuarioStatus,
  agendamentoStatus?: StatusAgendamento | null,
): boolean {
  return prontuarioStatus !== "Finalizado" && agendamentoStatus === "EM_ATENDIMENTO";
}

export function isAgendamentoElegivelParaContaReceber(
  status: StatusAgendamento,
): boolean {
  return status !== "CANCELADO" && status !== "FALTOU";
}

export function getContaReceberStatusByConsulta(
  statusConsulta: StatusAgendamento,
  dataPrevistaRecebimento: string,
  todayIsoDate = obterDataSomenteDiaAtual(),
): ContaReceberStatus {
  if (isConsultaRealizada(statusConsulta)) {
    if (dataPrevistaRecebimento > todayIsoDate) {
      return "Pendente";
    }

    return "Recebido";
  }

  if (dataPrevistaRecebimento < todayIsoDate) {
    return "Atrasado";
  }

  return "Pendente";
}
