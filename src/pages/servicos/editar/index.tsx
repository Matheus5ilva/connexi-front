import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { FormPageHeader } from "../../../components/ui/form-page-header";
import { NotFoundCard } from "../../../components/ui/not-found-card";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout } from "../../../components/ui/page-layout";
import { CarregamentoCentral } from "../../../components/ui/carregamento-central";
import { getSegmentoLabels } from "../../../config/segmento-labels";
import type { LayoutOutletContext } from "../../../layout";
import { parseRouteNumericId } from "../../../schemas/runtime-input.schema";
import type { ServicoFormularioData } from "../../../schemas/servico.schema";
import {
  mapFormularioServicoParaAtualizarRequest,
  mapServicoParaFormulario,
  servicoService,
  toErrorMessage,
  type Servico,
} from "../../../services/api";
import { FormularioServico } from "../components/formulario-servico";

const valoresVazios: ServicoFormularioData = {
  nome: "",
  valorParticular: 0,
  ativo: true,
  descricao: "",
  convenios: [],
};

export function EditarServico() {
  const navigate = useNavigate();
  const { segmento } = useOutletContext<LayoutOutletContext>();
  const labels = getSegmentoLabels(segmento);
  const servicoMinusculo = labels.servico.toLowerCase();
  const servicosMinusculo = labels.servicos.toLowerCase();
  const { id } = useParams();
  const servicoId = parseRouteNumericId(id);
  const [servico, setServico] = useState<Servico | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (servicoId === null) {
      setServico(null);
      setIsLoading(false);
      setLoadError(null);
      return;
    }

    const targetId = servicoId;
    let isMounted = true;

    async function loadServico() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const fetched = await servicoService.buscarPorId(targetId);
        if (!isMounted) {
          return;
        }

        setServico(fetched);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setLoadError(
          toErrorMessage(
            error,
            `Não foi possível carregar os dados do ${servicoMinusculo}.`,
          ),
        );
        setServico(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadServico();

    return () => {
      isMounted = false;
    };
  }, [servicoId, servicoMinusculo]);

  const valoresIniciais = useMemo<ServicoFormularioData>(() => {
    if (!servico) {
      return valoresVazios;
    }

    return mapServicoParaFormulario(servico);
  }, [servico]);

  if (isLoading) {
    return (
      <PageLayout>
        <CarregamentoCentral />
      </PageLayout>
    );
  }

  if (!servico) {
    return (
      <PageLayout>
        <NotFoundCard
          title={
            loadError
              ? `Falha ao carregar ${servicoMinusculo}`
              : `${labels.servico} não encontrado`
          }
          description={
            loadError ||
            `Verifique se o ${servicoMinusculo} existe para continuar a edição.`
          }
          actionLabel={`Voltar para ${servicosMinusculo}`}
          onAction={() => navigate("/financeiro/servicos")}
        />
      </PageLayout>
    );
  }

  const servicoAtual = servico;
  const servicoIdAtual = servicoAtual.id;

  async function handleSubmit(values: ServicoFormularioData) {
    const atualizado = await servicoService.atualizar(
      servicoIdAtual,
      mapFormularioServicoParaAtualizarRequest(values),
    );

    setServico(atualizado);
    navigate(`/financeiro/servicos/${servicoIdAtual}`);
  }

  return (
    <PageLayout>
      <PageHeader
        title={`Editar ${servicoMinusculo}`}
        subtitle={`Atualize os dados principais do ${servicoMinusculo}.`}
        left={
          <FormPageHeader
            title={`Editar ${servicoMinusculo}`}
            subtitle={servicoAtual.nome}
            onBack={() => navigate(`/financeiro/servicos/${servicoIdAtual}`)}
            backLabel={`Voltar para a visualização do ${servicoMinusculo}`}
          />
        }
      />

      <FormularioServico
        valoresIniciais={valoresIniciais}
        textoBotaoSubmit="Salvar alterações"
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/financeiro/servicos/${servicoIdAtual}`)}
        conveniosVinculados={servicoAtual.servicosConvenios ?? []}
        labels={labels}
      />
    </PageLayout>
  );
}
