import { isApiError, toErrorMessage } from "../../../services/api";

export type EstadoErroCarregamentoPaciente = {
  titulo: string;
  descricao: string;
};

export function criarErroPacienteInvalido(): EstadoErroCarregamentoPaciente {
  return {
    titulo: "Paciente não encontrado",
    descricao: "O identificador informado para o paciente é inválido.",
  };
}

export function resolverErroCarregamentoPaciente(
  erro: unknown,
  mensagemPadrao: string,
): EstadoErroCarregamentoPaciente {
  if (isApiError(erro)) {
    if (erro.status === 401 || erro.status === 403) {
      return {
        titulo: "Acesso não autorizado",
        descricao: toErrorMessage(
          erro,
          "Você não tem permissão para acessar este paciente.",
        ),
      };
    }

    if (erro.status === 404) {
      return {
        titulo: "Paciente não encontrado",
        descricao:
          "Não encontramos o paciente informado. Ele pode ter sido removido ou não pertencer ao tenant atual.",
      };
    }

    if (erro.code?.startsWith("INVALID_") === true) {
      return {
        titulo: "Erro ao carregar dados",
        descricao:
          "Não foi possível processar os dados do paciente. Tente novamente.",
      };
    }
  }

  return {
    titulo: "Erro ao carregar dados",
    descricao: toErrorMessage(erro, mensagemPadrao),
  };
}
