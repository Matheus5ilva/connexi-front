import type {
  AtualizarConvenioRequest,
  Convenio,
  CriarConvenioRequest,
} from "../types/domain";
import type { ConvenioFormularioData } from "../../../schemas/convenio.schema";

function limparTextoObrigatorio(value: string): string {
  return value.trim();
}

function limparTextoOpcional(value?: string): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function limparCnpj(value: string): string {
  return value.replace(/\D/g, "").slice(0, 14);
}

function removerUndefined<T extends Record<string, unknown>>(objeto: T): T {
  return Object.fromEntries(
    Object.entries(objeto).filter(([, valor]) => valor !== undefined),
  ) as T;
}

function mapContato(formulario: ConvenioFormularioData) {
  return removerUndefined({
    telefone: limparTextoObrigatorio(formulario.telefone),
    whatsapp: limparTextoOpcional(formulario.whatsapp),
    email: limparTextoObrigatorio(formulario.email).toLowerCase(),
  });
}

export function mapFormularioConvenioParaCriarRequest(
  formulario: ConvenioFormularioData,
): CriarConvenioRequest {
  return removerUndefined({
    nome: limparTextoObrigatorio(formulario.nome),
    cnpj: limparCnpj(formulario.cnpj),
    ativo: formulario.ativo,
    diasPagamento: formulario.diasPagamento,
    abrangencia: formulario.abrangencia,
    contato: mapContato(formulario),
  });
}

export function mapFormularioConvenioParaAtualizarRequest(
  formulario: ConvenioFormularioData,
): AtualizarConvenioRequest {
  return removerUndefined({
    nome: limparTextoObrigatorio(formulario.nome),
    cnpj: limparCnpj(formulario.cnpj),
    ativo: formulario.ativo,
    diasPagamento: formulario.diasPagamento,
    abrangencia: formulario.abrangencia,
    contato: mapContato(formulario),
  });
}

export function mapConvenioParaFormulario(
  convenio: Convenio,
): ConvenioFormularioData {
  return {
    nome: convenio.nome,
    cnpj: convenio.cnpj,
    abrangencia: convenio.abrangencia,
    ativo: convenio.ativo,
    diasPagamento: convenio.diasPagamento,
    telefone: convenio.contato.telefone,
    whatsapp: convenio.contato.whatsapp ?? "",
    email: convenio.contato.email ?? "",
  };
}
