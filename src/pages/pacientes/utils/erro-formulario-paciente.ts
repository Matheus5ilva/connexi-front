import type { FieldErrors } from "react-hook-form";
import type { PacienteFormData } from "../../../schemas/paciente.schema";
import {
  type ErroFormularioAmigavel,
  normalizarErroFormulario,
  type ResultadoErroFormulario,
} from "../../../services/api/errors/erro-formulario";
import { normalizarTextoErroServidor } from "../../../services/api/errors/api-error";

type CampoFormularioPaciente = keyof PacienteFormData;

type LabelsFormularioPaciente = {
  numeroCarteirinhaLabel?: string;
  parceriaLabel?: string;
  pessoaLabel?: string;
};

const mapaCamposServidor: Partial<Record<string, CampoFormularioPaciente>> = {
  "pessoa.nome": "nome",
  "pessoa.contato.telefone": "telefone",
  "pessoa.contato.whatsapp": "whatsapp",
  "pessoa.contato.email": "email",
  "pessoa.endereco.cep": "cep",
  "pessoa.endereco.logradouro": "logradouro",
  "pessoa.endereco.numero": "numero",
  "pessoa.endereco.complemento": "complemento",
  "pessoa.endereco.bairro": "bairro",
  "pessoa.cidade.codigoIbge": "codigoIbgeCidade",
  cpf: "cpf",
  nomeMae: "nomeMae",
  sexo: "sexo",
  genero: "genero",
  convenioId: "convenioId",
  "convenio.id": "convenioId",
  numeroCarteirinha: "numeroCarteirinha",
};

const mapaRotulosCampos: Partial<Record<CampoFormularioPaciente, string>> = {
  nome: "Nome",
  telefone: "Telefone",
  whatsapp: "WhatsApp",
  email: "E-mail",
  cep: "CEP",
  logradouro: "Logradouro",
  numero: "Número",
  complemento: "Complemento",
  bairro: "Bairro",
  nomeCidade: "Cidade",
  codigoIbgeCidade: "Cidade",
  cpf: "CPF",
  dataNascimento: "Data de nascimento",
  nomeMae: "Nome da mãe",
  sexo: "Sexo",
  genero: "Gênero",
  convenioId: "Convênio",
  numeroCarteirinha: "Número da carteirinha",
};

function normalizarLabelsFormulario(
  labels?: string | LabelsFormularioPaciente,
): Required<LabelsFormularioPaciente> {
  if (typeof labels === "string") {
    return {
      numeroCarteirinhaLabel: "Número da carteirinha",
      parceriaLabel: "Convênio",
      pessoaLabel: labels,
    };
  }

  return {
    numeroCarteirinhaLabel:
      labels?.numeroCarteirinhaLabel || "Número da carteirinha",
    parceriaLabel: labels?.parceriaLabel || "Convênio",
    pessoaLabel: labels?.pessoaLabel || "Paciente",
  };
}

function criarMapaRotulosCampos(
  labels?: string | LabelsFormularioPaciente,
): Partial<Record<CampoFormularioPaciente, string>> {
  const labelsNormalizados = normalizarLabelsFormulario(labels);

  return {
    ...mapaRotulosCampos,
    convenioId: labelsNormalizados.parceriaLabel,
    numeroCarteirinha: labelsNormalizados.numeroCarteirinhaLabel,
  };
}

function labelMinuscula(label: string): string {
  return label.trim().toLowerCase();
}

function artigoIndefinido(label: string): "um" | "uma" {
  return labelMinuscula(label).endsWith("a") ? "uma" : "um";
}

function adjetivoValido(label: string): "válido" | "válida" {
  return labelMinuscula(label).endsWith("a") ? "válida" : "válido";
}

function traduzirMensagemCampoPaciente(
  campo: CampoFormularioPaciente,
  mensagem: string,
  labels?: string | LabelsFormularioPaciente,
): string {
  const mensagemNormalizada = normalizarTextoErroServidor(mensagem);
  const labelsNormalizados = normalizarLabelsFormulario(labels);
  const parceriaMinuscula = labelMinuscula(labelsNormalizados.parceriaLabel);
  const numeroCarteirinhaMinuscula = labelMinuscula(
    labelsNormalizados.numeroCarteirinhaLabel,
  );

  if (mensagemNormalizada.includes("ja cadastrado")) {
    if (campo === "email") {
      return "Este e-mail já está cadastrado.";
    }

    if (campo === "cpf") {
      return "Este CPF já está cadastrado.";
    }
  }

  if (campo === "email") {
    if (
      mensagemNormalizada.includes("email invalido") ||
      mensagemNormalizada.includes("must be an email") ||
      mensagemNormalizada.includes("invalid email")
    ) {
      return "Informe um e-mail válido.";
    }

    if (
      mensagemNormalizada.includes("100 caracteres") ||
      mensagemNormalizada.includes("shorter than or equal to 100")
    ) {
      return "O e-mail deve ter até 100 caracteres.";
    }

    if (
      mensagemNormalizada === "required" ||
      mensagemNormalizada.includes("should not be empty") ||
      mensagemNormalizada.includes("nao deve estar vazio")
    ) {
      return "Campo obrigatório.";
    }
  }

  if (campo === "telefone" || campo === "whatsapp") {
    if (
      mensagemNormalizada.includes("15 caracteres") ||
      mensagemNormalizada.includes("shorter than or equal to 15")
    ) {
      return `O ${campo === "telefone" ? "telefone" : "WhatsApp"} deve ter até 15 caracteres.`;
    }

    if (
      mensagemNormalizada === "required" ||
      mensagemNormalizada.includes("should not be empty") ||
      mensagemNormalizada.includes("nao deve estar vazio")
    ) {
      return campo === "telefone"
        ? "Campo obrigatório."
        : "Informe um WhatsApp válido.";
    }
  }

  if (campo === "nome") {
    if (
      mensagemNormalizada.includes("between 3 and 100") ||
      mensagemNormalizada.includes("entre 3 e 100")
    ) {
      return "O nome deve ter entre 3 e 100 caracteres.";
    }

    if (
      mensagemNormalizada === "required" ||
      mensagemNormalizada.includes("should not be empty") ||
      mensagemNormalizada.includes("nao deve estar vazio")
    ) {
      return "Campo obrigatório.";
    }
  }

  if (campo === "codigoIbgeCidade") {
    return "Selecione uma cidade válida.";
  }

  if (campo === "convenioId") {
    return `Selecione ${artigoIndefinido(labelsNormalizados.parceriaLabel)} ${parceriaMinuscula} ${adjetivoValido(labelsNormalizados.parceriaLabel)}.`;
  }

  if (campo === "numeroCarteirinha") {
    if (
      mensagemNormalizada.includes("50 caracteres") ||
      mensagemNormalizada.includes("shorter than or equal to 50")
    ) {
      return `O ${numeroCarteirinhaMinuscula} deve ter até 50 caracteres.`;
    }

    if (mensagemNormalizada.includes("so pode ser informada com convenioid")) {
      return `Informe o ${numeroCarteirinhaMinuscula} apenas quando houver ${parceriaMinuscula}.`;
    }
  }

  if (
    mensagemNormalizada === "required" ||
    mensagemNormalizada.includes("should not be empty") ||
    mensagemNormalizada.includes("nao deve estar vazio")
  ) {
    return "Campo obrigatório.";
  }

  return mensagem.trim().length > 0 ? mensagem : "Revise o valor informado.";
}

function extrairMensagemErroReactHookForm(erro: unknown): string | null {
  if (!erro || typeof erro !== "object") {
    return null;
  }

  const erroTipado = erro as Record<string, unknown>;
  const mensagem = erroTipado.message;

  if (typeof mensagem === "string" && mensagem.trim().length > 0) {
    return mensagem;
  }

  for (const valor of Object.values(erroTipado)) {
    const mensagemFilha = extrairMensagemErroReactHookForm(valor);
    if (mensagemFilha) {
      return mensagemFilha;
    }
  }

  return null;
}

function criarResultadoComCampo(
  campo: CampoFormularioPaciente,
  mensagem: string,
  mensagemGlobal = "Verifique os campos abaixo:",
  rotulosCampos = mapaRotulosCampos,
): ResultadoErroFormulario<CampoFormularioPaciente> {
  return {
    mensagemGlobal,
    errosCampo: {
      [campo]: mensagem,
    },
    erros: [
      {
        campo: rotulosCampos[campo] ?? campo,
        mensagem,
      },
    ],
  };
}

function normalizarPessoaMinuscula(pessoaLabel = "Paciente"): string {
  const label = pessoaLabel.trim();
  return (label.length > 0 ? label : "Paciente").toLowerCase();
}

export function normalizarErroFormularioPaciente(
  erro: unknown,
  labels?: string | LabelsFormularioPaciente,
): ResultadoErroFormulario<CampoFormularioPaciente> {
  const labelsNormalizados = normalizarLabelsFormulario(labels);
  const pessoaMinuscula = normalizarPessoaMinuscula(
    labelsNormalizados.pessoaLabel,
  );
  const rotulosCampos = criarMapaRotulosCampos(labelsNormalizados);
  const parceriaMinuscula = labelMinuscula(labelsNormalizados.parceriaLabel);
  const numeroCarteirinhaMinuscula = labelMinuscula(
    labelsNormalizados.numeroCarteirinhaLabel,
  );

  const resultado = normalizarErroFormulario<CampoFormularioPaciente>({
    erro,
    mapaCamposServidor,
    mapaRotulosCampos: rotulosCampos,
    traduzirMensagemCampo: (campo, mensagem) =>
      traduzirMensagemCampoPaciente(campo, mensagem, labelsNormalizados),
    mensagemCamposInvalidos: "Verifique os campos abaixo:",
    mensagemPadrao: `Não foi possível salvar os dados do ${pessoaMinuscula}. Tente novamente em instantes.`,
  });

  if (resultado.erros.length > 0) {
    return resultado;
  }

  const mensagemNormalizada = normalizarTextoErroServidor(
    resultado.mensagemGlobal,
  );

  if (mensagemNormalizada.includes("email ja cadastrado")) {
    return criarResultadoComCampo(
      "email",
      "Este e-mail já está cadastrado.",
      "Verifique os campos abaixo:",
      rotulosCampos,
    );
  }

  if (mensagemNormalizada.includes("cpf ja cadastrado")) {
    return criarResultadoComCampo(
      "cpf",
      "Este CPF já está cadastrado.",
      "Verifique os campos abaixo:",
      rotulosCampos,
    );
  }

  if (
    mensagemNormalizada.includes("cidade informada para a pessoa nao existe")
  ) {
    return criarResultadoComCampo(
      "codigoIbgeCidade",
      "Selecione uma cidade válida.",
      "Verifique os campos abaixo:",
      rotulosCampos,
    );
  }

  if (
    mensagemNormalizada.includes("convenio '") &&
    mensagemNormalizada.includes("nao encontrado")
  ) {
    return criarResultadoComCampo(
      "convenioId",
      `Selecione ${artigoIndefinido(labelsNormalizados.parceriaLabel)} ${parceriaMinuscula} ${adjetivoValido(labelsNormalizados.parceriaLabel)}.`,
      "Verifique os campos abaixo:",
      rotulosCampos,
    );
  }

  if (
    mensagemNormalizada.includes(
      "numeroCarteirinha so pode ser informada com convenioid valido",
    )
  ) {
    return criarResultadoComCampo(
      "numeroCarteirinha",
      `Informe o ${numeroCarteirinhaMinuscula} apenas quando houver ${parceriaMinuscula}.`,
      "Verifique os campos abaixo:",
      rotulosCampos,
    );
  }

  return resultado;
}

export function normalizarErrosValidacaoPaciente(
  errosFormulario: FieldErrors<PacienteFormData>,
  labels?: string | LabelsFormularioPaciente,
): ResultadoErroFormulario<CampoFormularioPaciente> {
  const errosCampo: Partial<Record<CampoFormularioPaciente, string>> = {};
  const erros: ErroFormularioAmigavel[] = [];
  const labelsNormalizados = normalizarLabelsFormulario(labels);
  const rotulosCampos = criarMapaRotulosCampos(labelsNormalizados);

  Object.entries(errosFormulario).forEach(([campo, detalhe]) => {
    const campoTipado = campo as CampoFormularioPaciente;
    const mensagemOriginal = extrairMensagemErroReactHookForm(detalhe);

    if (!mensagemOriginal) {
      return;
    }

    const mensagemAmigavel = traduzirMensagemCampoPaciente(
      campoTipado,
      mensagemOriginal,
      labelsNormalizados,
    );

    errosCampo[campoTipado] = mensagemAmigavel;
    erros.push({
      campo: rotulosCampos[campoTipado] ?? campo,
      mensagem: mensagemAmigavel,
    });
  });

  return {
    mensagemGlobal:
      erros.length > 0
        ? "Verifique os campos abaixo:"
        : "Revise os campos destacados antes de continuar.",
    errosCampo,
    erros,
  };
}
