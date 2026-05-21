import type { ConsultorioFormularioData } from "../../../schemas/consultorio.schema";
import type {
  AtualizarConsultorioRequest,
  Consultorio,
  CriarConsultorioRequest,
  PessoaInput,
} from "../types/domain";

function limparTextoObrigatorio(valor: string): string {
  return valor.trim();
}

function limparTextoOpcional(valor?: string): string | undefined {
  const textoNormalizado = valor?.trim();
  return textoNormalizado ? textoNormalizado : undefined;
}

function limparDigitos(valor?: string): string | undefined {
  if (!valor) {
    return undefined;
  }

  const digitos = valor.replace(/\D/g, "");
  return digitos.length > 0 ? digitos : undefined;
}

function removerUndefined<T extends Record<string, unknown>>(objeto: T): T {
  return Object.fromEntries(
    Object.entries(objeto).filter(([, valor]) => valor !== undefined),
  ) as T;
}

function mapearPessoa(formulario: ConsultorioFormularioData): PessoaInput {
  return removerUndefined({
    nome: limparTextoObrigatorio(formulario.nome),
    contato: removerUndefined({
      telefone: limparTextoObrigatorio(formulario.telefone),
      whatsapp: limparTextoOpcional(formulario.whatsapp),
      email: limparTextoOpcional(formulario.email),
    }),
    endereco: removerUndefined({
      logradouro: limparTextoOpcional(formulario.logradouro),
      numero: formulario.numero,
      complemento: limparTextoOpcional(formulario.complemento),
      bairro: limparTextoOpcional(formulario.bairro),
      cep: limparDigitos(formulario.cep),
    }),
    cidade: formulario.codigoIbgeCidade
      ? { codigoIbge: formulario.codigoIbgeCidade.trim() }
      : undefined,
  });
}

export function mapConsultorioParaFormulario(
  consultorio: Consultorio,
): ConsultorioFormularioData {
  return {
    nome: consultorio.pessoa.nome ?? "",
    ativo: consultorio.ativo,
    razaoSocial: consultorio.razaoSocial ?? "",
    cnpj: consultorio.cnpj ?? "",
    email: consultorio.pessoa.contato.email ?? "",
    telefone: consultorio.pessoa.contato.telefone ?? "",
    whatsapp: consultorio.pessoa.contato.whatsapp ?? "",
    cep: consultorio.pessoa.endereco?.cep ?? "",
    logradouro: consultorio.pessoa.endereco?.logradouro ?? "",
    numero: consultorio.pessoa.endereco?.numero,
    complemento: consultorio.pessoa.endereco?.complemento ?? "",
    bairro: consultorio.pessoa.endereco?.bairro ?? "",
    nomeCidade: consultorio.pessoa.cidade?.nome ?? "",
    codigoIbgeCidade: consultorio.pessoa.cidade?.codigoIbge ?? "",
  };
}

export function mapFormularioConsultorioParaCriarRequest(
  formulario: ConsultorioFormularioData,
): CriarConsultorioRequest {
  return removerUndefined({
    pessoa: mapearPessoa(formulario),
    razaoSocial: limparTextoOpcional(formulario.razaoSocial),
    cnpj: limparDigitos(formulario.cnpj),
  });
}

export function mapFormularioConsultorioParaAtualizarRequest(
  formulario: ConsultorioFormularioData,
): AtualizarConsultorioRequest {
  return removerUndefined({
    pessoa: mapearPessoa(formulario),
    ativo: formulario.ativo,
    razaoSocial: limparTextoOpcional(formulario.razaoSocial),
    cnpj: limparDigitos(formulario.cnpj),
  });
}
