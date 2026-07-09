import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CarregamentoCentral } from "../../../components/ui/carregamento-central";
import { FormPageHeader } from "../../../components/ui/form-page-header";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout } from "../../../components/ui/page-layout";
import { parseRouteNumericId } from "../../../schemas/runtime-input.schema";
import type {
  SecretariaCriacaoFormularioData,
  SecretariaFormularioData,
} from "../../../schemas/secretaria.schema";
import {
  mapFormularioSecretariaParaAtualizarRequest,
  mapSecretariaParaFormulario,
  secretariaService,
  toErrorMessage,
  type Secretaria,
} from "../../../services/api";
import { SecretariaForm } from "../components/secretaria-form";
import styles from "../styles.module.css";

export function EditarSecretaria() {
  const navigate = useNavigate();
  const { id } = useParams();
  const secretariaId = parseRouteNumericId(id);
  const [secretaria, setSecretaria] = useState<Secretaria | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!secretariaId) {
      setErro("Secretária inválida.");
      setCarregando(false);
      return;
    }

    const idValido = secretariaId;
    let ativo = true;

    async function carregarSecretaria() {
      setCarregando(true);
      setErro(null);

      try {
        const encontrada = await secretariaService.buscarPorId(idValido);
        if (ativo) {
          setSecretaria(encontrada);
        }
      } catch (error) {
        if (ativo) {
          setErro(toErrorMessage(error, "Não foi possível carregar a secretária."));
          setSecretaria(null);
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    void carregarSecretaria();

    return () => {
      ativo = false;
    };
  }, [secretariaId]);

  const defaultValues = useMemo(
    () => (secretaria ? mapSecretariaParaFormulario(secretaria) : undefined),
    [secretaria],
  );

  async function handleUpdate(
    formData: SecretariaFormularioData | SecretariaCriacaoFormularioData,
  ) {
    if (!secretariaId) {
      throw new Error("Secretária inválida.");
    }

    const atualizada = await secretariaService.atualizar(
      secretariaId,
      mapFormularioSecretariaParaAtualizarRequest(
        formData as SecretariaFormularioData,
      ),
    );
    navigate(`/secretarias/${atualizada.id}`);
  }

  if (carregando) {
    return (
      <PageLayout>
        <CarregamentoCentral />
      </PageLayout>
    );
  }

  if (!secretaria) {
    return (
      <PageLayout>
        <section className={styles.feedbackCard} role="alert">
          <p className={styles.feedbackError}>
            {erro ?? "Secretária não encontrada."}
          </p>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => navigate("/secretarias")}
          >
            Voltar
          </button>
        </section>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="Editar secretária"
        subtitle={secretaria.pessoa.nome}
        left={
          <FormPageHeader
            title="Editar secretária"
            subtitle={secretaria.pessoa.nome}
            onBack={() => navigate(`/secretarias/${secretaria.id}`)}
            backLabel="Voltar para a visualização da secretária"
          />
        }
      />

      <SecretariaForm
        defaultValues={defaultValues}
        mode="editar"
        onCancel={() => navigate(`/secretarias/${secretaria.id}`)}
        onSubmit={handleUpdate}
        submitLabel="Salvar alterações"
        submittingLabel="Salvando..."
      />
    </PageLayout>
  );
}
