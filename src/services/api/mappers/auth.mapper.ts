import type {
  FormularioEsqueciSenhaData,
  FormularioLoginData,
  FormularioRedefinirSenhaData,
} from "../../../schemas/auth.schema";
import type {
  IniciarSessaoRequest,
  RedefinirSenhaRequest,
  SolicitarRecuperacaoSenhaRequest,
} from "../types/domain";

function limparTextoObrigatorio(value: string): string {
  return value.trim();
}

export function mapFormularioLoginParaIniciarSessaoRequest(
  formulario: FormularioLoginData,
): IniciarSessaoRequest {
  return {
    email: limparTextoObrigatorio(formulario.email).toLowerCase(),
    password: limparTextoObrigatorio(formulario.senha),
  };
}

export function mapFormularioEsqueciSenhaParaRequest(
  formulario: FormularioEsqueciSenhaData,
): SolicitarRecuperacaoSenhaRequest {
  return {
    email: limparTextoObrigatorio(formulario.email).toLowerCase(),
  };
}

export function mapFormularioRedefinirSenhaParaRequest(
  formulario: FormularioRedefinirSenhaData,
): RedefinirSenhaRequest {
  return {
    token: limparTextoObrigatorio(formulario.token),
    newPassword: limparTextoObrigatorio(formulario.novaSenha),
    confirmNewPassword: limparTextoObrigatorio(formulario.confirmarNovaSenha),
  };
}
