import type {
  SecretariaCriacaoFormularioData,
  SecretariaFormularioData,
} from "../../../schemas/secretaria.schema";
import type {
  AtualizarSecretariaRequest,
  CriarSecretariaRequest,
  PessoaProfissionalInput,
  Secretaria,
} from "../types/domain";

function limparTextoOpcional(value?: string): string | undefined {
  const texto = value?.trim();
  return texto ? texto : undefined;
}

function mapPessoaSecretaria(
  formulario: SecretariaFormularioData,
): PessoaProfissionalInput {
  return {
    nome: formulario.nome.trim(),
    contato: {
      telefone: formulario.telefone.trim(),
      whatsapp: limparTextoOpcional(formulario.whatsapp),
      email: formulario.email.trim().toLowerCase(),
    },
    endereco: {
      logradouro: limparTextoOpcional(formulario.logradouro),
      numero: formulario.numero,
      complemento: limparTextoOpcional(formulario.complemento),
      bairro: limparTextoOpcional(formulario.bairro),
      cep: limparTextoOpcional(formulario.cep),
    },
    cidade: formulario.codigoIbgeCidade
      ? { codigoIbge: formulario.codigoIbgeCidade.trim() }
      : undefined,
  };
}

export function mapFormularioSecretariaParaCriarRequest(
  formulario: SecretariaCriacaoFormularioData,
): CriarSecretariaRequest {
  return {
    pessoa: mapPessoaSecretaria(formulario),
    podeAcessarFinanceiro: formulario.podeAcessarFinanceiro,
    senhaProvisoria: formulario.senhaProvisoria.trim(),
  };
}

export function mapFormularioSecretariaParaAtualizarRequest(
  formulario: SecretariaFormularioData,
): AtualizarSecretariaRequest {
  return {
    pessoa: mapPessoaSecretaria(formulario),
    podeAcessarFinanceiro: formulario.podeAcessarFinanceiro,
  };
}

export function mapSecretariaParaFormulario(
  secretaria: Secretaria,
): SecretariaFormularioData {
  return {
    nome: secretaria.pessoa.nome,
    telefone: secretaria.pessoa.contato.telefone,
    whatsapp: secretaria.pessoa.contato.whatsapp ?? "",
    email: secretaria.pessoa.contato.email ?? "",
    logradouro: secretaria.pessoa.endereco?.logradouro ?? "",
    numero: secretaria.pessoa.endereco?.numero,
    complemento: secretaria.pessoa.endereco?.complemento ?? "",
    bairro: secretaria.pessoa.endereco?.bairro ?? "",
    cep: secretaria.pessoa.endereco?.cep ?? "",
    nomeCidade: secretaria.pessoa.cidade?.nome ?? "",
    uf:
      secretaria.pessoa.cidade?.siglaEstado ??
      secretaria.pessoa.cidade?.estado?.sigla ??
      "",
    codigoIbgeCidade: secretaria.pessoa.cidade?.codigoIbge ?? "",
    podeAcessarFinanceiro: secretaria.podeAcessarFinanceiro,
    senhaProvisoria: "",
  };
}
