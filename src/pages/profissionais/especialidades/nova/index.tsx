import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FormPageHeader } from "../../../../components/ui/form-page-header";
import { PageHeader } from "../../../../components/ui/page-header";
import { PageLayout } from "../../../../components/ui/page-layout";
import { resolveReturnTo } from "../../../../routes/return-to";
import type { EspecialidadeFormularioData } from "../../../../schemas/especialidade.schema";
import {
  especialidadeService,
  mapFormularioEspecialidadeParaCriarRequest,
} from "../../../../services/api";
import { FormularioEspecialidade } from "../../components/formulario-especialidade";

const valoresIniciaisPadrao: EspecialidadeFormularioData = {
  nome: "",
  descricao: "",
};

export function NovaEspecialidade() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = resolveReturnTo(location, "/profissional/especialidades");
  const initialValues = useMemo(() => valoresIniciaisPadrao, []);

  async function handleSubmit(values: EspecialidadeFormularioData) {
    const especialidadeCriada = await especialidadeService.criar(
      mapFormularioEspecialidadeParaCriarRequest(values),
    );

    navigate(`/profissional/especialidades/${especialidadeCriada.id}`, {
      state: { returnTo },
    });
  }

  return (
    <PageLayout>
      <PageHeader
        title="Nova especialidade"
        subtitle="Cadastre especialidades para vínculo com seu perfil profissional."
        left={
          <FormPageHeader
            title="Nova especialidade"
            subtitle="Cadastre especialidades para vínculo com seu perfil profissional."
            onBack={() => navigate(returnTo)}
            backLabel="Voltar para a lista de especialidades"
          />
        }
      />

      <FormularioEspecialidade
        initialValues={initialValues}
        submitLabel="Cadastrar especialidade"
        onSubmit={handleSubmit}
        onCancel={() => navigate(returnTo)}
      />
    </PageLayout>
  );
}
