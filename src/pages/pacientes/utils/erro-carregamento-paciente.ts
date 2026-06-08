import { isApiError, toErrorMessage } from "../../../services/api";

export type EstadoErroCarregamentoPaciente = {
  titulo: string;
  descricao: string;
};

function normalizarPessoaLabel(pessoaLabel = "Paciente"): string {
  const label = pessoaLabel.trim();
  return label.length > 0 ? label : "Paciente";
}

export function criarErroPacienteInvalido(
  pessoaLabel = "Paciente",
): EstadoErroCarregamentoPaciente {
  const pessoa = normalizarPessoaLabel(pessoaLabel);
  const pessoaMinuscula = pessoa.toLowerCase();

  return {
    titulo: `${pessoa} não encontrado`,
    descricao: `O identificador informado para o ${pessoaMinuscula} é inválido.`,
  };
}

export function resolverErroCarregamentoPaciente(
  erro: unknown,
  mensagemPadrao: string,
  pessoaLabel = "Paciente",
): EstadoErroCarregamentoPaciente {
  const pessoa = normalizarPessoaLabel(pessoaLabel);
  const pessoaMinuscula = pessoa.toLowerCase();

  if (isApiError(erro)) {
    if (erro.status === 401 || erro.status === 403) {
      return {
        titulo: "Acesso não autorizado",
        descricao: toErrorMessage(
          erro,
          `Você não tem permissão para acessar este ${pessoaMinuscula}.`,
        ),
      };
    }

    if (erro.status === 404) {
      return {
        titulo: `${pessoa} não encontrado`,
        descricao: `Não encontramos o ${pessoaMinuscula} informado. Ele pode ter sido removido ou não pertencer ao tenant atual.`,
      };
    }

    if (erro.code?.startsWith("INVALID_") === true) {
      return {
        titulo: "Erro ao carregar dados",
        descricao: `Não foi possível processar os dados do ${pessoaMinuscula}. Tente novamente.`,
      };
    }
  }

  return {
    titulo: "Erro ao carregar dados",
    descricao: toErrorMessage(erro, mensagemPadrao),
  };
}
