import type { AlterarSenhaFormularioData } from "../../../schemas/alterar-senha.schema";
import type {
  AlterarSenhaRequest,
  MinhaConta,
  RespostaMinhaContaAutenticada,
} from "../types/domain";

function limparTextoObrigatorio(value: string): string {
  return value.trim();
}

export function mapRespostaMinhaContaParaMinhaConta(
  resposta: RespostaMinhaContaAutenticada,
): MinhaConta {
  return {
    id: resposta.id,
    nome: resposta.name,
    email: resposta.email,
    perfil: resposta.role,
    profissionalId: resposta.profissionalId ?? undefined,
    secretariaId: resposta.secretariaId ?? undefined,
    podeAcessarFinanceiro: resposta.podeAcessarFinanceiro ?? false,
    deveTrocarSenha: resposta.deveTrocarSenha,
    tenantId: resposta.tenantId,
    plano: resposta.plano,
    permiteSecretaria: resposta.permiteSecretaria,
    ultimoLoginEm: resposta.ultimoLoginEm ?? undefined,
  };
}

export function mapFormularioAlterarSenhaParaRequest(
  formulario: AlterarSenhaFormularioData,
): AlterarSenhaRequest {
  return {
    currentPassword: limparTextoObrigatorio(formulario.senhaAtual),
    newPassword: limparTextoObrigatorio(formulario.novaSenha),
    confirmNewPassword: limparTextoObrigatorio(formulario.confirmarNovaSenha),
  };
}
