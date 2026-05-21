import type { EspecialidadeFormularioData } from "../../../schemas/especialidade.schema";
import type {
  AtualizarEspecialidadeRequest,
  CriarEspecialidadeRequest,
  Especialidade,
} from "../types/domain";

function limparTextoObrigatorio(value: string): string {
  return value.trim();
}

function limparTextoOpcional(value?: string): string | undefined {
  const textoNormalizado = value?.trim();
  return textoNormalizado ? textoNormalizado : undefined;
}

function removerUndefined<T extends Record<string, unknown>>(objeto: T): T {
  return Object.fromEntries(
    Object.entries(objeto).filter(([, valor]) => valor !== undefined),
  ) as T;
}

export function mapFormularioEspecialidadeParaCriarRequest(
  formulario: EspecialidadeFormularioData,
): CriarEspecialidadeRequest {
  return removerUndefined({
    nome: limparTextoObrigatorio(formulario.nome),
    descricao: limparTextoOpcional(formulario.descricao),
  });
}

export function mapFormularioEspecialidadeParaAtualizarRequest(
  formulario: EspecialidadeFormularioData,
): AtualizarEspecialidadeRequest {
  return removerUndefined({
    nome: limparTextoObrigatorio(formulario.nome),
    descricao: limparTextoOpcional(formulario.descricao),
  });
}

export function mapEspecialidadeParaFormulario(
  especialidade: Especialidade,
): EspecialidadeFormularioData {
  return {
    nome: especialidade.nome,
    descricao: especialidade.descricao ?? "",
  };
}
