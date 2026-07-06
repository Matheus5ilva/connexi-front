import { useEffect, useState } from "react";
import { FaChevronLeft, FaEdit, FaMoneyCheckAlt, FaTrash } from "react-icons/fa";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { Modal } from "../../../components/ui/modal";
import { NotFoundCard } from "../../../components/ui/not-found-card";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout } from "../../../components/ui/page-layout";
import { CarregamentoCentral } from "../../../components/ui/carregamento-central";
import { getSegmentoLabels } from "../../../config/segmento-labels";
import { useSessaoAutenticada } from "../../../auth/use-auth-session";
import type { LayoutOutletContext } from "../../../layout";
import { parseRouteNumericId } from "../../../schemas/runtime-input.schema";
import { servicoService, toErrorMessage, type Servico } from "../../../services/api";
import styles from "./styles.module.css";

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function VisualizarServico() {
  const navigate = useNavigate();
  const { user } = useSessaoAutenticada();
  const { segmento } = useOutletContext<LayoutOutletContext>();
  const labels = getSegmentoLabels(segmento);
  const servicoMinusculo = labels.servico.toLowerCase();
  const servicosMinusculo = labels.servicos.toLowerCase();
  const parceriaMinuscula = labels.parceria.toLowerCase();
  const parceriasMinusculo = labels.parcerias.toLowerCase();
  const { id } = useParams();
  const servicoId = parseRouteNumericId(id);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [servico, setServico] = useState<Servico | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const podeGerenciarServicos = user?.perfil !== "SECRETARIA";

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

  async function handleDelete() {
    if (!servico) {
      setConfirmDeleteOpen(false);
      return;
    }

    try {
      setActionError(null);
      await servicoService.remover(servico.id);
      navigate("/financeiro/servicos");
    } catch (error) {
      setActionError(
        toErrorMessage(error, `Não foi possível excluir o ${servicoMinusculo}.`),
      );
      setConfirmDeleteOpen(false);
    }
  }

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
            loadError || `Verifique se o ${servicoMinusculo} existe para continuar.`
          }
          actionLabel={`Voltar para ${servicosMinusculo}`}
          onAction={() => navigate("/financeiro/servicos")}
        />
      </PageLayout>
    );
  }

  const servicoAtual = servico;
  const servicoIdAtual = servicoAtual.id;
  const quantidadeConvenios = servicoAtual.servicosConvenios?.length ?? 0;

  return (
    <PageLayout>
      <Modal
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title={`Excluir ${servicoMinusculo}`}
        subtitle={`Essa ação remove o ${servicoMinusculo} da base atual.`}
        maxWidth="480px"
      >
        <div className={styles.confirmBody}>
          <p>
            Deseja realmente excluir <strong>{servicoAtual.nome}</strong>?
          </p>
          <p>Essa ação não pode ser desfeita.</p>

          <div className={styles.confirmActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => setConfirmDeleteOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={styles.btnDanger}
              onClick={() => void handleDelete()}
            >
              Excluir {servicoMinusculo}
            </button>
          </div>
        </div>
      </Modal>

      <PageHeader
        title={labels.servico}
        left={
          <div className={styles.titleWithBack}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => navigate("/financeiro/servicos")}
              aria-label={`Voltar para lista de ${servicosMinusculo}`}
            >
              <FaChevronLeft />
            </button>
            <div>
              <h1 className={styles.pageTitle}>{servicoAtual.nome}</h1>
              <p className={styles.pageSubtitle}>
                Detalhes do {servicoMinusculo}
              </p>
            </div>
          </div>
        }
        right={
          podeGerenciarServicos ? (
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => navigate(`/financeiro/servicos/${servicoIdAtual}/editar`)}
            >
              <FaEdit />
              <span>Editar</span>
            </button>
            <button
              type="button"
              className={styles.btnDanger}
              onClick={() => setConfirmDeleteOpen(true)}
            >
              <FaTrash />
              <span>Excluir</span>
            </button>
          </div>
          ) : null
        }
      />

      {actionError && <p>{actionError}</p>}

      <section className={styles.kpiGrid}>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Status</span>
          <strong className={styles.kpiValue}>
            {servicoAtual.ativo ? "Ativo" : "Inativo"}
          </strong>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            Valor particular do {servicoMinusculo}
          </span>
          <strong className={styles.kpiValue}>
            {formatarMoeda(servicoAtual.valorParticular)}
          </strong>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            Vínculos de {parceriasMinusculo}
          </span>
          <strong className={styles.kpiValue}>{quantidadeConvenios}</strong>
        </article>
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>
            Dados do {servicoMinusculo}
          </h2>
          <div className={styles.infoGrid}>
            <div>
              <span className={styles.infoLabel}>Nome</span>
              <p className={styles.infoValue}>{servicoAtual.nome}</p>
            </div>
            <div>
              <span className={styles.infoLabel}>Status</span>
              <p className={styles.infoValue}>
                {servicoAtual.ativo ? "Ativo" : "Inativo"}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>
                Valor particular do {servicoMinusculo}
              </span>
              <p className={styles.infoValue}>
                {formatarMoeda(servicoAtual.valorParticular)}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>
                Vínculos de {parceriasMinusculo}
              </span>
              <p className={styles.infoValue}>{quantidadeConvenios}</p>
            </div>
          </div>
        </section>

        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>
            <FaMoneyCheckAlt className={styles.sectionIcon} />
            Valores por {parceriaMinuscula}
          </h2>

          {quantidadeConvenios === 0 ? (
            <p className={styles.emptyPrice}>
              Nenhum item de {parceriasMinusculo} vinculado a este {servicoMinusculo}.
            </p>
          ) : (
            <div className={styles.pricingList}>
              {servicoAtual.servicosConvenios?.map((item) => (
                <article key={item.convenioId} className={styles.pricingItem}>
                  <span className={styles.pricingName}>
                    {item.convenioNome || `${labels.parceria} #${item.convenioId}`}
                  </span>
                  <span className={styles.pricingValue}>
                    {formatarMoeda(item.valor)}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className={`${styles.sectionCard} ${styles.colSpan2}`}>
          <h2 className={styles.sectionTitle}>
            Descrição do {servicoMinusculo}
          </h2>
          <p className={styles.notesText}>
            {servicoAtual.descricao ||
              `Nenhuma descrição cadastrada para este ${servicoMinusculo}.`}
          </p>
        </section>
      </div>
    </PageLayout>
  );
}



