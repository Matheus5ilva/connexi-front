import type { PacienteFormData } from "schemas/paciente.schema";
import type {
  AtualizarPacienteRequest,
  CriarPacienteRequest,
  EnderecoInput,
  Paciente,
  PessoaInput,
} from "../types/domain";

function limparString(value?: string): string | undefined {
  if (!value) return undefined;

  const texto = value.trim();
  return texto.length > 0 ? texto : undefined;
}

function limparDigitos(value?: string): string | undefined {
  if (!value) return undefined;

  const digitos = value.replace(/\D/g, "");
  return digitos.length > 0 ? digitos : undefined;
}

function montarEndereco(formData: PacienteFormData): EnderecoInput | undefined {
  const endereco: EnderecoInput = {};
  const logradouro = limparString(formData.logradouro);
  const complemento = limparString(formData.complemento);
  const bairro = limparString(formData.bairro);
  const cep = limparDigitos(formData.cep);

  if (logradouro) {
    endereco.logradouro = logradouro;
  }

  if (formData.numero !== undefined) {
    endereco.numero = formData.numero;
  }

  if (complemento) {
    endereco.complemento = complemento;
  }

  if (bairro) {
    endereco.bairro = bairro;
  }

  if (cep) {
    endereco.cep = cep;
  }

  return Object.keys(endereco).length > 0 ? endereco : undefined;
}

function montarPessoa(formData: PacienteFormData): PessoaInput {
  const contato: PessoaInput["contato"] = {
    telefone: limparDigitos(formData.telefone) ?? formData.telefone.trim(),
  };
  const whatsapp = limparDigitos(formData.whatsapp);
  const email = limparString(formData.email);
  const endereco = montarEndereco(formData);

  if (whatsapp) {
    contato.whatsapp = whatsapp;
  }

  if (email) {
    contato.email = email;
  }

  const pessoa: PessoaInput = {
    nome: formData.nome.trim(),
    contato,
  };

  if (endereco) {
    pessoa.endereco = endereco;
  }

  if (formData.codigoIbgeCidade) {
    pessoa.cidade = { codigoIbge: formData.codigoIbgeCidade };
  }

  return pessoa;
}

export function mapPacienteFormToCreateRequest(
  formData: PacienteFormData,
): CriarPacienteRequest {
  const request: CriarPacienteRequest = {
    pessoa: montarPessoa(formData),
    ativo: formData.ativo,
  };
  const cpf = limparDigitos(formData.cpf);
  const dataNascimento = limparString(formData.dataNascimento);
  const nomeMae = limparString(formData.nomeMae);
  const numeroCarteirinha = limparString(formData.numeroCarteirinha);
  const convenioId = formData.convenioId ?? undefined;

  if (cpf) {
    request.cpf = cpf;
  }

  if (dataNascimento) {
    request.dataNascimento = dataNascimento;
  }

  if (nomeMae) {
    request.nomeMae = nomeMae;
  }

  if (formData.sexo) {
    request.sexo = formData.sexo;
  }

  if (formData.genero) {
    request.genero = formData.genero;
  }

  if (convenioId) {
    request.convenioId = convenioId;
  }

  if (convenioId && numeroCarteirinha) {
    request.numeroCarteirinha = numeroCarteirinha;
  }

  return request;
}

export function mapPacienteFormToUpdateRequest(
  formData: PacienteFormData,
): AtualizarPacienteRequest {
  const request: AtualizarPacienteRequest = {
    pessoa: montarPessoa(formData),
    ativo: formData.ativo,
    convenioId: formData.convenioId ?? null,
  };
  const cpf = limparDigitos(formData.cpf);
  const dataNascimento = limparString(formData.dataNascimento);
  const nomeMae = limparString(formData.nomeMae);
  const numeroCarteirinha = limparString(formData.numeroCarteirinha);

  if (cpf) {
    request.cpf = cpf;
  }

  if (dataNascimento) {
    request.dataNascimento = dataNascimento;
  }

  if (nomeMae) {
    request.nomeMae = nomeMae;
  }

  if (formData.sexo) {
    request.sexo = formData.sexo;
  }

  if (formData.genero) {
    request.genero = formData.genero;
  }

  request.numeroCarteirinha = request.convenioId
    ? (numeroCarteirinha ?? null)
    : null;

  return request;
}

export function mapPacienteToFormData(paciente: Paciente): PacienteFormData {
  return {
    nome: paciente.nome ?? paciente.pessoa.nome ?? "",
    ativo: paciente.ativo ?? paciente.pessoa.ativo ?? true,
    telefone: paciente.pessoa.contato.telefone ?? "",
    whatsapp: paciente.pessoa.contato.whatsapp ?? "",
    email: paciente.pessoa.contato.email ?? "",
    cep: paciente.pessoa.endereco?.cep ?? "",
    logradouro: paciente.pessoa.endereco?.logradouro ?? "",
    numero: paciente.pessoa.endereco?.numero,
    complemento: paciente.pessoa.endereco?.complemento ?? "",
    bairro: paciente.pessoa.endereco?.bairro ?? "",
    nomeCidade: paciente.pessoa.cidade?.nome ?? "",
    codigoIbgeCidade: paciente.pessoa.cidade?.codigoIbge ?? "",
    cpf: paciente.cpf ?? "",
    dataNascimento: paciente.dataNascimento ?? "",
    nomeMae: paciente.nomeMae ?? "",
    sexo: paciente.sexo,
    genero: paciente.genero,
    convenioId: paciente.convenioId ?? undefined,
    numeroCarteirinha: paciente.numeroCarteirinha ?? "",
  };
}
