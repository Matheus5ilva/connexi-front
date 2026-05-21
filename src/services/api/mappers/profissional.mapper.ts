import type { ProfissionalFormData } from "../../../schemas/profissional.schema";
import type {
  AtualizarProfissionalRequest,
  CriarProfissionalRequest,
  Profissional,
} from "../types/domain";

function limparString(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const texto = value.trim();
  return texto.length > 0 ? texto : undefined;
}

function limparDigitos(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const digitos = value.replace(/\D/g, "");
  return digitos.length > 0 ? digitos : undefined;
}

function removerUndefined<T extends Record<string, unknown>>(objeto: T): T {
  return Object.fromEntries(
    Object.entries(objeto).filter(([, valor]) => valor !== undefined),
  ) as T;
}

function objetoOpcional<T extends Record<string, unknown>>(
  objeto: T,
): T | undefined {
  const normalizado = removerUndefined(objeto);
  return Object.keys(normalizado).length > 0 ? normalizado : undefined;
}

function montarPessoa(
  formData: ProfissionalFormData,
  incluirAtivo = false,
) {
  return removerUndefined({
    nome: formData.nome.trim(),
    ativo: incluirAtivo ? formData.ativo : undefined,
    contato: removerUndefined({
      telefone: formData.telefone.trim(),
      whatsapp: limparString(formData.whatsapp),
      email: formData.email.trim(),
    }),
    endereco: objetoOpcional({
      logradouro: limparString(formData.logradouro),
      numero: formData.numero,
      complemento: limparString(formData.complemento),
      bairro: limparString(formData.bairro),
      cep: limparDigitos(formData.cep),
    }),
    cidade: formData.codigoIbgeCidade
      ? { codigoIbge: formData.codigoIbgeCidade }
      : undefined,
  });
}

function obterEspecialidadeId(formData: ProfissionalFormData): number {
  if (!formData.especialidadeId) {
    throw new Error("Especialidade obrigatória.");
  }

  return formData.especialidadeId;
}

export function mapProfissionalFormToCreateRequest(
  formData: ProfissionalFormData,
): CriarProfissionalRequest {
  return removerUndefined({
    pessoa: montarPessoa(formData, true),
    tipoProfissional: limparString(formData.tipoProfissional),
    numeroRegistro: limparString(formData.numeroRegistro),
    especialidade: {
      id: obterEspecialidadeId(formData),
    },
  });
}

export function mapProfissionalFormToUpdateRequest(
  formData: ProfissionalFormData,
  opcoes: { incluirStatus?: boolean } = {},
): AtualizarProfissionalRequest {
  return removerUndefined({
    pessoa: montarPessoa(formData),
    ativo: opcoes.incluirStatus ? formData.ativo : undefined,
    tipoProfissional: limparString(formData.tipoProfissional),
    numeroRegistro: limparString(formData.numeroRegistro),
    especialidade: formData.especialidadeId
      ? { id: formData.especialidadeId }
      : undefined,
  });
}

export function mapProfissionalToFormData(
  profissional: Profissional,
): ProfissionalFormData {
  return {
    nome: profissional.nome ?? profissional.pessoa.nome ?? "",
    ativo: profissional.ativo ?? profissional.pessoa.ativo ?? true,
    telefone: profissional.pessoa.contato.telefone ?? "",
    whatsapp: profissional.pessoa.contato.whatsapp ?? "",
    email: profissional.pessoa.contato.email ?? "",
    cep: profissional.pessoa.endereco?.cep ?? "",
    logradouro: profissional.pessoa.endereco?.logradouro ?? "",
    numero: profissional.pessoa.endereco?.numero,
    complemento: profissional.pessoa.endereco?.complemento ?? "",
    bairro: profissional.pessoa.endereco?.bairro ?? "",
    nomeCidade: profissional.pessoa.cidade?.nome ?? "",
    codigoIbgeCidade: profissional.pessoa.cidade?.codigoIbge ?? "",
    tipoProfissional: profissional.tipoProfissional ?? "",
    numeroRegistro: profissional.numeroRegistro ?? "",
    especialidadeId: profissional.especialidadeDetalhe?.id,
  };
}
