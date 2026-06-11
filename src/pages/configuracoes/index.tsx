import { useEffect, useState } from "react";
import { FaCalendarAlt, FaClock, FaEdit } from "react-icons/fa";
import { useNavigate, useOutletContext } from "react-router-dom";
import { PageHeader } from "../../components/ui/page-header";
import { PageLayout } from "../../components/ui/page-layout";
import { CarregamentoCentral } from "../../components/ui/carregamento-central";
import { getSegmentoLabels } from "../../config/segmento-labels";
import type { LayoutOutletContext } from "../../layout";
import {
  configuracaoService,
  toErrorMessage,
  type Configuracao,
} from "../../services/api";
import styles from "./styles.module.css";

const diasAtendimentoLabels: Record<
  Configuracao["diasAtendimento"][number],
  string
> = {
  SEGUNDA: "Segunda-feira",
  TERCA: "Terça-feira",
  QUARTA: "Quarta-feira",
  QUINTA: "Quinta-feira",
  SEXTA: "Sexta-feira",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
};

function formatarDiasAtendimento(
  diasAtendimento: Configuracao["diasAtendimento"],
): string {
  return diasAtendimento.map((dia) => diasAtendimentoLabels[dia]).join(", ");
}

export function Configuracoes() {
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

  const pageAction = (
    <button
      type="button"
      className={styles.btnPrimary}
      onClick={() => navigate("/configuracoes/editar")}
    >
      <FaEdit />
      <span>
        {configuracao ? "Editar configuração" : "Cadastrar configuração"}
      </span>
    </button>
  );

  return (
    <PageLayout>
      <PageHeader
        title="Configuração"
        subtitle={`Defina os horários, os dias de atendimento e as pausas do ${negocioMinusculo}.`}
        right={pageAction}
      />

      {isLoading ? (
        <CarregamentoCentral />
      ) : loadError ? (
        <section className={styles.emptyCard}>
          <h2 className={styles.emptyTitle}>Falha ao carregar a configuração</h2>
          <p className={styles.emptyDescription}>{loadError}</p>
          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => setReloadCounter((value) => value + 1)}
            >
              Tentar novamente
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => navigate("/configuracoes/editar")}
            >
              Ir para edição
            </button>
          </div>
        </section>
      ) : !configuracao ? (
        <section className={styles.emptyCard}>
          <h2 className={styles.emptyTitle}>Nenhuma configuração cadastrada</h2>
          <p className={styles.emptyDescription}>
            Cadastre a configuração principal para definir a jornada de trabalho
            e as pausas do {negocioMinusculo}.
          </p>
          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => navigate("/configuracoes/editar")}
            >
              Cadastrar configuração
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className={styles.kpiGrid}>
            <article className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Jornada</span>
              <strong className={styles.kpiValue}>
                {configuracao.horaInicio} às {configuracao.horaFim}
              </strong>
            </article>
            <article className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Intervalo padrão</span>
              <strong className={styles.kpiValue}>
                {configuracao.intervaloMinutos} min
              </strong>
            </article>
            <article className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Pausas cadastradas</span>
              <strong className={styles.kpiValue}>
                {configuracao.pausas.length}
              </strong>
            </article>
          </section>

          <div className={styles.contentGrid}>
            <section className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>
                <FaClock className={styles.sectionIcon} />
                Horários de atendimento
              </h2>
              <div className={styles.infoGrid}>
                <div>
                  <span className={styles.infoLabel}>Hora inicial</span>
                  <p className={styles.infoValue}>{configuracao.horaInicio}</p>
                </div>
                <div>
                  <span className={styles.infoLabel}>Hora final</span>
                  <p className={styles.infoValue}>{configuracao.horaFim}</p>
                </div>
                <div className={styles.colSpan2}>
                  <span className={styles.infoLabel}>
                    Intervalo entre horários
                  </span>
                  <p className={styles.infoValue}>
                    {configuracao.intervaloMinutos} minutos
                  </p>
                </div>
              </div>
            </section>

            <section className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>
                <FaCalendarAlt className={styles.sectionIcon} />
                Dias de atendimento
              </h2>
              <p className={styles.notesText}>
                {formatarDiasAtendimento(configuracao.diasAtendimento)}
              </p>
              <div className={styles.dayList}>
                {configuracao.diasAtendimento.map((dia) => (
                  <span key={dia} className={styles.dayTag}>
                    {diasAtendimentoLabels[dia]}
                  </span>
                ))}
              </div>
            </section>

            <section className={`${styles.sectionCard} ${styles.colSpan2}`}>
              <h2 className={styles.sectionTitle}>Pausas configuradas</h2>
              {configuracao.pausas.length === 0 ? (
                <p className={styles.notesText}>
                  Nenhuma pausa cadastrada para esta configuração.
                </p>
              ) : (
                <div className={styles.pauseList}>
                  {configuracao.pausas.map((pausa) => (
                    <div key={pausa.id} className={styles.pauseItem}>
                      <span className={styles.infoLabel}>
                        Pausa {pausa.inicio} às {pausa.fim}
                      </span>
                      <p className={styles.infoValue}>
                        Intervalo reservado dentro da jornada de atendimento.
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </PageLayout>
  );
}


