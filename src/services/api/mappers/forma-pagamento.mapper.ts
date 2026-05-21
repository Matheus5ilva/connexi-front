import type { FormaPagamentoFormularioData } from "../../../schemas/forma-pagamento.schema";
import type {
  AtualizarFormaPagamentoRequest,
  CriarFormaPagamentoRequest,
  FormaPagamento,
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

function resolverPrazoRecebimento(
  formulario: FormaPagamentoFormularioData,
): number | undefined {
  if (formulario.recebimentoTipo !== "prazo") {
    return undefined;
  }

  return formulario.prazoRecebimentoDias;
}

export function mapFormularioFormaPagamentoParaCriarRequest(
  formulario: FormaPagamentoFormularioData,
): CriarFormaPagamentoRequest {
  return removerUndefined({
    nome: limparTextoObrigatorio(formulario.nome),
    taxaPercentual: formulario.taxaPercentual,
    recebimentoTipo: formulario.recebimentoTipo,
    prazoRecebimentoDias: resolverPrazoRecebimento(formulario),
    observacoes: limparTextoOpcional(formulario.observacoes),
  });
}

export function mapFormularioFormaPagamentoParaAtualizarRequest(
  formulario: FormaPagamentoFormularioData,
): AtualizarFormaPagamentoRequest {
  return removerUndefined({
    nome: limparTextoObrigatorio(formulario.nome),
    taxaPercentual: formulario.taxaPercentual,
    recebimentoTipo: formulario.recebimentoTipo,
    prazoRecebimentoDias: resolverPrazoRecebimento(formulario),
    observacoes: limparTextoOpcional(formulario.observacoes),
  });
}

export function mapFormaPagamentoParaFormulario(
  formaPagamento: FormaPagamento,
): FormaPagamentoFormularioData {
  return {
    nome: formaPagamento.nome,
    taxaPercentual: formaPagamento.taxaPercentual,
    recebimentoTipo: formaPagamento.recebimentoTipo,
    prazoRecebimentoDias: formaPagamento.prazoRecebimentoDias ?? undefined,
    observacoes: formaPagamento.observacoes ?? "",
  };
}
