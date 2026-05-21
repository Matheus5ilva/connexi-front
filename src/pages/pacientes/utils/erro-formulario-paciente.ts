import type { FieldErrors } from "react-hook-form";
import type { PacienteFormData } from "../../../schemas/paciente.schema";
import {
  type ErroFormularioAmigavel,
  normalizarErroFormulario,
  type ResultadoErroFormulario,
} from "../../../services/api/errors/erro-formulario";
import { normalizarTextoErroServidor } from "../../../services/api/errors/api-error";

type CampoFormularioPaciente = keyof PacienteFormData;

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

function traduzirMensagemCampoPaciente(
  campo: CampoFormularioPaciente,
  mensagem: string,
): string {
  const mensagemNormalizada = normalizarTextoErroServidor(mensagem);

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
    return "Selecione um convênio válido.";
  }

  if (campo === "numeroCarteirinha") {
    if (
      mensagemNormalizada.includes("50 caracteres") ||
      mensagemNormalizada.includes("shorter than or equal to 50")
    ) {
      return "O número da carteirinha deve ter até 50 caracteres.";
    }

    if (mensagemNormalizada.includes("so pode ser informada com convenioid")) {
      return "Informe o número da carteirinha apenas quando houver convênio.";
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
): ResultadoErroFormulario<CampoFormularioPaciente> {
  return {
    mensagemGlobal,
    errosCampo: {
      [campo]: mensagem,
    },
    erros: [
      {
        campo: mapaRotulosCampos[campo] ?? campo,
        mensagem,
      },
    ],
  };
}

export function normalizarErroFormularioPaciente(
  erro: unknown,
): ResultadoErroFormulario<CampoFormularioPaciente> {
  const resultado = normalizarErroFormulario<CampoFormularioPaciente>({
    erro,
    mapaCamposServidor,
    mapaRotulosCampos,
    traduzirMensagemCampo: traduzirMensagemCampoPaciente,
    mensagemCamposInvalidos: "Verifique os campos abaixo:",
    mensagemPadrao:
      "Não foi possível salvar os dados do paciente. Tente novamente em instantes.",
  });

  if (resultado.erros.length > 0) {
    return resultado;
  }

  const mensagemNormalizada = normalizarTextoErroServidor(
    resultado.mensagemGlobal,
  );

  if (mensagemNormalizada.includes("email ja cadastrado")) {
    return criarResultadoComCampo("email", "Este e-mail já está cadastrado.");
  }

  if (mensagemNormalizada.includes("cpf ja cadastrado")) {
    return criarResultadoComCampo("cpf", "Este CPF já está cadastrado.");
  }

  if (
    mensagemNormalizada.includes("cidade informada para a pessoa nao existe")
  ) {
    return criarResultadoComCampo(
      "codigoIbgeCidade",
      "Selecione uma cidade válida.",
    );
  }

  if (
    mensagemNormalizada.includes("convenio '") &&
    mensagemNormalizada.includes("nao encontrado")
  ) {
    return criarResultadoComCampo(
      "convenioId",
      "Selecione um convênio válido.",
    );
  }

  if (
    mensagemNormalizada.includes(
      "numeroCarteirinha so pode ser informada com convenioid valido",
    )
  ) {
    return criarResultadoComCampo(
      "numeroCarteirinha",
      "Informe o número da carteirinha apenas quando houver convênio.",
    );
  }

  return resultado;
}

export function normalizarErrosValidacaoPaciente(
  errosFormulario: FieldErrors<PacienteFormData>,
): ResultadoErroFormulario<CampoFormularioPaciente> {
  const errosCampo: Partial<Record<CampoFormularioPaciente, string>> = {};
  const erros: ErroFormularioAmigavel[] = [];

  Object.entries(errosFormulario).forEach(([campo, detalhe]) => {
    const campoTipado = campo as CampoFormularioPaciente;
    const mensagemOriginal = extrairMensagemErroReactHookForm(detalhe);

    if (!mensagemOriginal) {
      return;
    }

    const mensagemAmigavel = traduzirMensagemCampoPaciente(
      campoTipado,
      mensagemOriginal,
    );

    errosCampo[campoTipado] = mensagemAmigavel;
    erros.push({
      campo: mapaRotulosCampos[campoTipado] ?? campo,
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
