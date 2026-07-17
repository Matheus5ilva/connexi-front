import { useEffect, useMemo, useState } from "react";
import type { DefaultValues } from "react-hook-form";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { FormPageHeader } from "../../../components/ui/form-page-header";
import { NotFoundCard } from "../../../components/ui/not-found-card";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout } from "../../../components/ui/page-layout";
import { CarregamentoCentral } from "../../../components/ui/carregamento-central";
import { getSegmentoLabels } from "../../../config/segmento-labels";
import type { LayoutOutletContext } from "../../../layout";
import type { ConvenioFormularioData } from "../../../schemas/convenio.schema";
import { parseRouteNumericId } from "../../../schemas/runtime-input.schema";
import {
  convenioService,
  mapConvenioParaFormulario,
  mapFormularioConvenioParaAtualizarRequest,
  toErrorMessage,
  type Convenio,
} from "../../../services/api";
import { FormularioConvenio } from "../components/formulario-convenio";

const valoresVazios: DefaultValues<ConvenioFormularioData> = {
  nome: "",
  cnpj: "",
  ativo: true,
  abrangencia: "Nacional",
  telefone: "",
  whatsapp: "",
  email: "",
};

export function EditarConvenio() {
  const navigate = useNavigate();
  const { segmento } = useOutletContext<LayoutOutletContext>();
  const labels = getSegmentoLabels(segmento);
  const parceriaMinuscula = labels.parceria.toLowerCase();
  const parceriasMinuscula = labels.parcerias.toLowerCase();
  const artigoParceria = parceriaMinuscula.endsWith("a") ? "da" : "do";
  const encontradaParceria = parceriaMinuscula.endsWith("a")
    ? "encontrada"
    : "encontrado";
  const { id } = useParams();
  const convenioId = parseRouteNumericId(id);
  const [convenio, setConvenio] = useState<Convenio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (convenioId === null) {
      setConvenio(null);
      setIsLoading(false);
      setLoadError(null);
      return;
    }

    const targetId = convenioId;
    let isMounted = true;

    async function carregarConvenio() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const fetched = await convenioService.buscarPorId(targetId);
        if (!isMounted) {
          return;
        }

        setConvenio(fetched);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setLoadError(
          toErrorMessage(
            error,
            `Não foi possível carregar os dados ${artigoParceria} ${parceriaMinuscula}.`,
          ),
        );
        setConvenio(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void carregarConvenio();

    return () => {
      isMounted = false;
    };
  }, [artigoParceria, convenioId, parceriaMinuscula]);

  const valoresIniciais = useMemo<DefaultValues<ConvenioFormularioData>>(() => {
    if (!convenio) {
      return valoresVazios;
    }

    return mapConvenioParaFormulario(convenio);
  }, [convenio]);

  if (isLoading) {
    return (
      <PageLayout>
        <CarregamentoCentral />
      </PageLayout>
    );
  }

  if (!convenio) {
    return (
      <PageLayout>
        <NotFoundCard
          title={
            loadError
              ? `Falha ao carregar ${parceriaMinuscula}`
              : `${labels.parceria} não ${encontradaParceria}`
          }
          description={
            loadError ||
            `Verifique se ${artigoParceria} ${parceriaMinuscula} existe para continuar a edição.`
          }
          actionLabel={`Voltar para ${parceriasMinuscula}`}
          onAction={() => navigate("/financeiro/convenios")}
        />
      </PageLayout>
    );
  }

  const convenioAtual = convenio;
  const convenioIdAtual = convenioAtual.id;

  async function handleSubmit(values: ConvenioFormularioData) {
    await convenioService.atualizar(
      convenioIdAtual,
      mapFormularioConvenioParaAtualizarRequest(values),
    );

    navigate(`/financeiro/convenios/${convenioIdAtual}`);
  }

  return (
    <PageLayout>
      <PageHeader
        title={`Editar ${parceriaMinuscula}`}
        subtitle="Atualize os dados principais e de contato."
        left={
          <FormPageHeader
            title={`Editar ${parceriaMinuscula}`}
            subtitle={convenioAtual.nome}
            onBack={() => navigate(`/financeiro/convenios/${convenioIdAtual}`)}
            backLabel={`Voltar para a visualização ${artigoParceria} ${parceriaMinuscula}`}
          />
        }
      />

      <FormularioConvenio
        labels={labels}
        valoresIniciais={valoresIniciais}
        textoBotaoSubmit="Salvar alterações"
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/financeiro/convenios/${convenioIdAtual}`)}
      />
    </PageLayout>
  );
}



