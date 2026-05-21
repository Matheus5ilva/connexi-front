import {
  authService,
  profissionalService,
  type Profissional,
} from "../../../services/api";

export async function carregarProfissionalPrincipal(): Promise<Profissional | null> {
  const minhaConta = await authService.buscarMinhaConta();
  const profissionalId = minhaConta.profissionalId;

  if (!profissionalId) {
    if (minhaConta.perfil !== "MASTER") {
      return null;
    }

    const respostaProfissionais = await profissionalService.listar({
      page: 1,
      limit: 2,
      ativo: true,
    });

    const primeiroProfissional = respostaProfissionais.items[0];
    const possuiMaisDeUmProfissional = respostaProfissionais.items.length > 1;

    if (!primeiroProfissional) {
      return null;
    }

    if (possuiMaisDeUmProfissional) {
      return null;
    }

    return profissionalService.buscarPorId(primeiroProfissional.id);
  }

  return profissionalService.buscarPorId(profissionalId);
}
