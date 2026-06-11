import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { FormPageHeader } from "../../../components/ui/form-page-header";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout } from "../../../components/ui/page-layout";
import { CarregamentoCentral } from "../../../components/ui/carregamento-central";
import { getSegmentoLabels } from "../../../config/segmento-labels";
import type { LayoutOutletContext } from "../../../layout";
import type { ConfiguracaoFormularioData } from "../../../schemas/configuracao.schema";
import {
  configuracaoService,
  mapConfiguracaoParaFormulario,
  mapFormularioConfiguracaoParaAtualizarRequest,
  mapFormularioConfiguracaoParaSalvarRequest,
  toErrorMessage,
  type Configuracao,
} from "../../../services/api";
import { FormularioConfiguracao } from "../components/formulario-configuracao";
import styles from "../styles.module.css";

const valoresIniciaisVazios: ConfiguracaoFormularioData = {
  horaInicio: "",
  horaFim: "",
  intervaloMinutos: 30,
  diasAtendimento: [],
  pausas: [],
};

export function EditarConfiguracoes() {
  const navigate = useNavigate();
  const { segmento } = useOutletContext<LayoutOutletContext>();
  const labels = getSegmentoLabels(segmento);
  const negocioMinusculo = labels.negocioEntidade;
  const [configuracao, setConfiguracao] = useState<Configuracao | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadCounter, setReloadCounter] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function carregarConfiguracao() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const configuracaoAtual = await configuracaoService.buscarPrincipal();

        if (!isMounted) {
          return;
        }

        setConfiguracao(configuracaoAtual);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setConfiguracao(null);
        setLoadError(
          toErrorMessage(error, "Não foi possível carregar a configuração."),
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void carregarConfiguracao();

    return () => {
      isMounted = false;
    };
  }, [reloadCounter]);

  const initialValues = useMemo<ConfiguracaoFormularioData>(() => {
    if (!configuracao) {
      return valoresIniciaisVazios;
    }

    return mapConfiguracaoParaFormulario(configuracao);
  }, [configuracao]);

  async function handleSubmit(values: ConfiguracaoFormularioData) {
    if (configuracao) {
      await configuracaoService.atualizar(
        configuracao.id,
        mapFormularioConfiguracaoParaAtualizarRequest(values),
      );
    } else {
      await configuracaoService.salvar(
        mapFormularioConfiguracaoParaSalvarRequest(values),
      );
    }

    navigate("/configuracoes");
  }

  return (
    <PageLayout>
      <PageHeader
        title={configuracao ? "Editar configuração" : "Nova configuração"}
        subtitle={`Ajuste a jornada de atendimento, os dias e as pausas do ${negocioMinusculo}.`}
        left={
          <FormPageHeader
            title={configuracao ? "Editar configuração" : "Nova configuração"}
            subtitle={
              configuracao
                ? `Atualize a configuração principal do ${negocioMinusculo}.`
                : `Cadastre a configuração principal do ${negocioMinusculo}.`
            }
            onBack={() => navigate("/configuracoes")}
            backLabel="Voltar para configurações"
          />
        }
      />

      {isLoading ? (
        <CarregamentoCentral />
      ) : loadError ? (
        <section className={styles.emptyCard}>
          <h2 className={styles.emptyTitle}>
            Falha ao carregar a configuração
          </h2>
          <p className={styles.emptyDescription}>{loadError}</p>
          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => navigate("/configuracoes")}
            >
              Voltar
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => setReloadCounter((value) => value + 1)}
            >
              Tentar novamente
            </button>
          </div>
        </section>
      ) : (
        <FormularioConfiguracao
          initialValues={initialValues}
          submitLabel="Salvar configuração"
          negocioLabel={negocioMinusculo}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/configuracoes")}
        />
      )}
    </PageLayout>
  );
}
