import type {
  AtualizarServicoRequest,
  CriarServicoRequest,
  Servico,
  ServicoConvenioInput,
} from "../types/domain";
import type { ServicoFormularioData } from "../../../schemas/servico.schema";

function limparTextoObrigatorio(value: string): string {
  return value.trim();
}

function removerUndefined<T extends Record<string, unknown>>(objeto: T): T {
  return Object.fromEntries(
    Object.entries(objeto).filter(([, valor]) => valor !== undefined),
  ) as T;
}

function mapConvenios(
  convenios: ServicoFormularioData["convenios"],
): ServicoConvenioInput[] | undefined {
  if (!convenios.length) {
    return undefined;
  }

  return convenios.map((item) => ({
    convenioId: item.convenioId,
    valor: item.valor,
  }));
}

function mapConveniosParaAtualizacao(
  convenios: ServicoFormularioData["convenios"],
): ServicoConvenioInput[] {
  return convenios.map((item) => ({
    convenioId: item.convenioId,
    valor: item.valor,
  }));
}

export function mapFormularioServicoParaCriarRequest(
  formulario: ServicoFormularioData,
): CriarServicoRequest {
  return removerUndefined({
    nome: limparTextoObrigatorio(formulario.nome),
    descricao: formulario.descricao.trim(),
    ativo: formulario.ativo,
    valorParticular: formulario.valorParticular,
    convenios: mapConvenios(formulario.convenios),
  });
}

export function mapFormularioServicoParaAtualizarRequest(
  formulario: ServicoFormularioData,
): AtualizarServicoRequest {
  return removerUndefined({
    nome: limparTextoObrigatorio(formulario.nome),
    descricao: formulario.descricao.trim(),
    ativo: formulario.ativo,
    valorParticular: formulario.valorParticular,
    convenios: mapConveniosParaAtualizacao(formulario.convenios),
  });
}

export function mapServicoParaFormulario(
  servico: Servico,
): ServicoFormularioData {
  return {
    nome: servico.nome,
    descricao: servico.descricao ?? "",
    ativo: servico.ativo,
    valorParticular: servico.valorParticular,
    convenios:
      servico.servicosConvenios.map((item) => ({
        convenioId: item.convenioId,
        valor: item.valor,
      })),
  };
}
