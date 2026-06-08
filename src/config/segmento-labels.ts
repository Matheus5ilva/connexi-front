const LABELS_SAUDE = {
  pessoa: "Paciente",
  pessoas: "Pacientes",
  consulta: "Consulta",
  consultas: "Consultas",
  proximoAgendamento: "Próxima consulta",
  atendimento: "Atendimento",
  atendimentos: "Atendimentos",
  historico: "Histórico de atendimentos",
  negocio: "Consultório",
  parceria: "Convênio",
  parcerias: "Convênios",
  servico: "Serviço",
  servicos: "Serviços",
} as const;

export const SEGMENTO_PADRAO = "SAUDE";

export const SEGMENTOS_SUPORTADOS = [
  "SAUDE",
  "ESTETICA",
  "PET",
  "SERVICOS",
] as const;

export type Segmento = (typeof SEGMENTOS_SUPORTADOS)[number];
export type SegmentoLabelKey = keyof typeof LABELS_SAUDE;
export type SegmentoLabels = Record<SegmentoLabelKey, string>;

export const SEGMENTO_LABELS = {
  SAUDE: LABELS_SAUDE,
  ESTETICA: {
    pessoa: "Cliente",
    pessoas: "Clientes",
    consulta: "Atendimento",
    consultas: "Atendimentos",
    proximoAgendamento: "Próximo atendimento",
    atendimento: "Atendimento",
    atendimentos: "Atendimentos",
    historico: "Histórico de atendimentos",
    negocio: "Meu Negócio",
    parceria: "Parceria",
    parcerias: "Parcerias",
    servico: "Procedimento",
    servicos: "Procedimentos",
  },
  PET: {
    pessoa: "Paciente",
    pessoas: "Pacientes",
    consulta: "Consulta",
    consultas: "Consultas",
    proximoAgendamento: "Próxima consulta",
    atendimento: "Atendimento",
    atendimentos: "Atendimentos",
    historico: "Histórico de atendimentos",
    negocio: "Consultório",
    parceria: "Convênio",
    parcerias: "Convênios",
    servico: "Serviço",
    servicos: "Serviços",
  },
  SERVICOS: {
    pessoa: "Paciente",
    pessoas: "Pacientes",
    consulta: "Consulta",
    consultas: "Consultas",
    proximoAgendamento: "Próxima consulta",
    atendimento: "Atendimento",
    atendimentos: "Atendimentos",
    historico: "Histórico de atendimentos",
    negocio: "Consultório",
    parceria: "Convênio",
    parcerias: "Convênios",
    servico: "Serviço",
    servicos: "Serviços",
  },
} satisfies Record<Segmento, SegmentoLabels>;

export function isSegmento(value: unknown): value is Segmento {
  return (
    typeof value === "string" &&
    SEGMENTOS_SUPORTADOS.includes(value as Segmento)
  );
}

export function getSegmentoLabels(segmento?: string | null): SegmentoLabels {
  return isSegmento(segmento)
    ? SEGMENTO_LABELS[segmento]
    : SEGMENTO_LABELS[SEGMENTO_PADRAO];
}

export function getLabel(
  segmento: string | null | undefined,
  chave: SegmentoLabelKey | string,
): string {
  const labels = getSegmentoLabels(segmento);

  if (chave in labels) {
    return labels[chave as SegmentoLabelKey];
  }

  return SEGMENTO_LABELS[SEGMENTO_PADRAO][chave as SegmentoLabelKey] ?? chave;
}
