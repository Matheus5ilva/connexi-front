import { useEffect, useState } from "react";
import { FaChevronLeft, FaEdit, FaMoneyCheckAlt, FaTrash } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { Modal } from "../../../components/ui/modal";
import { NotFoundCard } from "../../../components/ui/not-found-card";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout } from "../../../components/ui/page-layout";
import { CarregamentoCentral } from "../../../components/ui/carregamento-central";
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
  const { id } = useParams();
  const servicoId = parseRouteNumericId(id);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [servico, setServico] = useState<Servico | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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
          toErrorMessage(error, "Não foi possível carregar os dados do serviço."),
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
  }, [servicoId]);

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
      setActionError(toErrorMessage(error, "Não foi possível excluir o serviço."));
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
          title={loadError ? "Falha ao carregar serviço" : "Serviço não encontrado"}
          description={loadError || "Verifique se o serviço existe para continuar."}
          actionLabel="Voltar para serviços"
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
        title="Excluir serviço"
        subtitle="Essa ação remove o serviço da base atual."
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
              Excluir serviço
            </button>
          </div>
        </div>
      </Modal>

      <PageHeader
        title="Serviço"
        left={
          <div className={styles.titleWithBack}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => navigate("/financeiro/servicos")}
              aria-label="Voltar para lista de serviços"
            >
              <FaChevronLeft />
            </button>
            <div>
              <h1 className={styles.pageTitle}>{servicoAtual.nome}</h1>
              <p className={styles.pageSubtitle}>Detalhes do serviço</p>
            </div>
          </div>
        }
        right={
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
          <span className={styles.kpiLabel}>Valor particular</span>
          <strong className={styles.kpiValue}>
            {formatarMoeda(servicoAtual.valorParticular)}
          </strong>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Convênios vinculados</span>
          <strong className={styles.kpiValue}>{quantidadeConvenios}</strong>
        </article>
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>Dados principais</h2>
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
              <span className={styles.infoLabel}>Valor particular</span>
              <p className={styles.infoValue}>
                {formatarMoeda(servicoAtual.valorParticular)}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>Convênios vinculados</span>
              <p className={styles.infoValue}>{quantidadeConvenios}</p>
            </div>
          </div>
        </section>

        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>
            <FaMoneyCheckAlt className={styles.sectionIcon} />
            Valores por convênio
          </h2>

          {quantidadeConvenios === 0 ? (
            <p className={styles.emptyPrice}>
              Nenhum convênio vinculado a este serviço.
            </p>
          ) : (
            <div className={styles.pricingList}>
              {servicoAtual.servicosConvenios?.map((item) => (
                <article key={item.convenioId} className={styles.pricingItem}>
                  <span className={styles.pricingName}>
                    {item.convenioNome || `Convênio #${item.convenioId}`}
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
          <h2 className={styles.sectionTitle}>Descrição</h2>
          <p className={styles.notesText}>
            {servicoAtual.descricao || "Nenhuma descrição cadastrada para este serviço."}
          </p>
        </section>
      </div>
    </PageLayout>
  );
}



