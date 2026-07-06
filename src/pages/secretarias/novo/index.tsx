import { useNavigate } from "react-router-dom";
import { FormPageHeader } from "../../../components/ui/form-page-header";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout } from "../../../components/ui/page-layout";
import type {
  SecretariaCriacaoFormularioData,
  SecretariaFormularioData,
} from "../../../schemas/secretaria.schema";
import {
  mapFormularioSecretariaParaCriarRequest,
  secretariaService,
} from "../../../services/api";
import { SecretariaForm } from "../components/secretaria-form";

export function NovaSecretaria() {
  const navigate = useNavigate();

  async function handleCreate(
    formData: SecretariaFormularioData | SecretariaCriacaoFormularioData,
  ) {
    const criada = await secretariaService.criar(
      mapFormularioSecretariaParaCriarRequest(
        formData as SecretariaCriacaoFormularioData,
      ),
    );
    navigate(`/secretarias/${criada.id}`);
  }

  return (
    <PageLayout>
      <PageHeader
        title="Nova secretária"
        subtitle="Cadastre a secretária do tenant."
        left={
          <FormPageHeader
            title="Nova secretária"
            subtitle="Cadastre a secretária do tenant"
            onBack={() => navigate("/secretarias")}
            backLabel="Voltar para a lista de secretárias"
          />
        }
      />

      <SecretariaForm
        mode="criar"
        onCancel={() => navigate("/secretarias")}
        onSubmit={handleCreate}
        submitLabel="Cadastrar secretária"
        submittingLabel="Cadastrando..."
      />
    </PageLayout>
  );
}
