import type { ConfiguracaoFormularioData } from "../../../schemas/configuracao.schema";
import type {
  AtualizarConfiguracaoRequest,
  Configuracao,
  SalvarConfiguracaoRequest,
} from "../types/domain";

function limparHorario(valor: string): string {
  return valor.trim();
}

function removerUndefined<T extends Record<string, unknown>>(objeto: T): T {
  return Object.fromEntries(
    Object.entries(objeto).filter(([, valor]) => valor !== undefined),
  ) as T;
}

function mapearPausas(
  pausas: ConfiguracaoFormularioData["pausas"],
): SalvarConfiguracaoRequest["pausas"] {
  const pausasNormalizadas = pausas.map((pausa) => ({
    inicio: limparHorario(pausa.inicio),
    fim: limparHorario(pausa.fim),
  }));

  return pausasNormalizadas.length > 0 ? pausasNormalizadas : undefined;
}

export function mapConfiguracaoParaFormulario(
  configuracao: Configuracao,
): ConfiguracaoFormularioData {
  return {
    horaInicio: configuracao.horaInicio,
    horaFim: configuracao.horaFim,
    intervaloMinutos: configuracao.intervaloMinutos,
    diasAtendimento: [...configuracao.diasAtendimento],
    pausas: configuracao.pausas.map((pausa) => ({
      inicio: pausa.inicio,
      fim: pausa.fim,
    })),
  };
}

export function mapFormularioConfiguracaoParaSalvarRequest(
  formulario: ConfiguracaoFormularioData,
): SalvarConfiguracaoRequest {
  return removerUndefined({
    horaInicio: limparHorario(formulario.horaInicio),
    horaFim: limparHorario(formulario.horaFim),
    intervaloMinutos: formulario.intervaloMinutos,
    diasAtendimento: [...formulario.diasAtendimento],
    pausas: mapearPausas(formulario.pausas),
  });
}

export function mapFormularioConfiguracaoParaAtualizarRequest(
  formulario: ConfiguracaoFormularioData,
): AtualizarConfiguracaoRequest {
  return removerUndefined({
    horaInicio: limparHorario(formulario.horaInicio),
    horaFim: limparHorario(formulario.horaFim),
    intervaloMinutos: formulario.intervaloMinutos,
    diasAtendimento: [...formulario.diasAtendimento],
    pausas: mapearPausas(formulario.pausas),
  });
}
