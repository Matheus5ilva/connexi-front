import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FormPageHeader } from "../../../../components/ui/form-page-header";
import { NotFoundCard } from "../../../../components/ui/not-found-card";
import { PageHeader } from "../../../../components/ui/page-header";
import { PageLayout } from "../../../../components/ui/page-layout";
import { CarregamentoCentral } from "../../../../components/ui/carregamento-central";
import { resolveReturnTo } from "../../../../routes/return-to";
import { parseRouteNumericId } from "../../../../schemas/runtime-input.schema";
import type { EspecialidadeFormularioData } from "../../../../schemas/especialidade.schema";
import {
  especialidadeService,
  mapEspecialidadeParaFormulario,
  mapFormularioEspecialidadeParaAtualizarRequest,
  toErrorMessage,
  type Especialidade,
} from "../../../../services/api";
import { FormularioEspecialidade } from "../../components/formulario-especialidade";

export function EditarEspecialidade() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = resolveReturnTo(location, "/profissional/especialidades");
  const { id } = useParams();
  const especialidadeId = parseRouteNumericId(id);
  const [especialidade, setEspecialidade] = useState<Especialidade | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const targetId = especialidadeId;

    if (targetId === null) {
      setEspecialidade(null);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    const safeTargetId = targetId;

    let isMounted = true;

    async function loadEspecialidade() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const fetched = await especialidadeService.buscarPorId(safeTargetId);
        if (!isMounted) {
          return;
        }

        setEspecialidade(fetched);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setLoadError(
          toErrorMessage(
            error,
            "Não foi possível carregar os dados da especialidade.",
          ),
        );
        setEspecialidade(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadEspecialidade();

    return () => {
      isMounted = false;
    };
  }, [especialidadeId]);

  const initialValues = useMemo<EspecialidadeFormularioData>(() => {
    if (!especialidade) {
      return {
        nome: "",
        descricao: "",
      };
    }

    return mapEspecialidadeParaFormulario(especialidade);
  }, [especialidade]);

  if (isLoading) {
    return (
      <PageLayout>
        <CarregamentoCentral />
      </PageLayout>
    );
  }

  if (!especialidade || especialidadeId === null) {
    return (
      <PageLayout>
        <NotFoundCard
          title={
            loadError
              ? "Falha ao carregar especialidade"
              : "Especialidade não encontrada"
          }
          description={
            loadError ||
            "Verifique se a especialidade existe para continuar a edição."
          }
          actionLabel="Voltar para especialidades"
          onAction={() => navigate(returnTo)}
        />
      </PageLayout>
    );
  }

  const especialidadeIdAtual = especialidade.id;

  async function handleSubmit(values: EspecialidadeFormularioData) {
    await especialidadeService.atualizar(
      especialidadeIdAtual,
      mapFormularioEspecialidadeParaAtualizarRequest(values),
    );

    navigate(`/profissional/especialidades/${especialidadeIdAtual}`, {
      state: { returnTo },
    });
  }

  return (
    <PageLayout>
      <PageHeader
        title="Editar especialidade"
        subtitle="Atualize os dados da especialidade"
        left={
          <FormPageHeader
            title="Editar especialidade"
            subtitle={especialidade.nome}
            onBack={() =>
              navigate(`/profissional/especialidades/${especialidadeIdAtual}`, {
                state: { returnTo },
              })
            }
            backLabel="Voltar para a visualização da especialidade"
          />
        }
      />

      <FormularioEspecialidade
        initialValues={initialValues}
        submitLabel="Salvar alterações"
        onSubmit={handleSubmit}
        onCancel={() =>
          navigate(`/profissional/especialidades/${especialidadeIdAtual}`, {
            state: { returnTo },
          })
        }
      />
    </PageLayout>
  );
}



