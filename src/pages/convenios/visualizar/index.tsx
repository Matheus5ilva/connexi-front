import { useEffect, useState } from "react";
import { FaChevronLeft, FaEdit, FaTrash } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { Modal } from "../../../components/ui/modal";
import { NotFoundCard } from "../../../components/ui/not-found-card";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout } from "../../../components/ui/page-layout";
import { CarregamentoCentral } from "../../../components/ui/carregamento-central";
import { parseRouteNumericId } from "../../../schemas/runtime-input.schema";
import { convenioService, toErrorMessage, type Convenio } from "../../../services/api";
import styles from "./styles.module.css";

function formatarCnpj(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, "");

  if (digits.length !== 14) {
    return cnpj || "Não informado";
  }

  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5",
  );
}

export function VisualizarConvenio() {
  const navigate = useNavigate();
  const { id } = useParams();
  const convenioId = parseRouteNumericId(id);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [convenio, setConvenio] = useState<Convenio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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
          toErrorMessage(error, "Não foi possível carregar os dados do convênio."),
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
  }, [convenioId]);

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
          title={loadError ? "Falha ao carregar convênio" : "Convênio não encontrado"}
          description={loadError || "Verifique se o convênio existe para continuar."}
          actionLabel="Voltar para convênios"
          onAction={() => navigate("/financeiro/convenios")}
        />
      </PageLayout>
    );
  }

  const convenioAtual = convenio;

  async function handleDelete() {
    try {
      setActionError(null);
      await convenioService.remover(convenioAtual.id);
      navigate("/financeiro/convenios");
    } catch (error) {
      setActionError(
        toErrorMessage(error, "Não foi possível excluir o convênio."),
      );
      setConfirmDeleteOpen(false);
    }
  }

  return (
    <PageLayout>
      <Modal
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Excluir convênio"
        subtitle="Essa ação remove o convênio da base atual."
        maxWidth="480px"
      >
        <div className={styles.confirmBody}>
          <p>
            Deseja realmente excluir <strong>{convenioAtual.nome}</strong>?
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
            <button type="button" className={styles.btnDanger} onClick={() => void handleDelete()}>
              Excluir convênio
            </button>
          </div>
        </div>
      </Modal>

      <PageHeader
        title="Convênio"
        left={
          <div className={styles.titleWithBack}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => navigate("/financeiro/convenios")}
              aria-label="Voltar para a lista de convênios"
            >
              <FaChevronLeft />
            </button>
            <div>
              <h1 className={styles.pageTitle}>{convenioAtual.nome}</h1>
              <p className={styles.pageSubtitle}>Detalhes do convênio</p>
            </div>
          </div>
        }
        right={
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => navigate(`/financeiro/convenios/${convenioAtual.id}/editar`)}
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
            {convenioAtual.ativo ? "Ativo" : "Inativo"}
          </strong>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Abrangência</span>
          <strong className={styles.kpiValue}>{convenioAtual.abrangencia}</strong>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Prazo de pagamento</span>
          <strong className={styles.kpiValue}>{convenioAtual.diasPagamento} dias</strong>
        </article>
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>Dados principais</h2>
          <div className={styles.infoGrid}>
            <div>
              <span className={styles.infoLabel}>Nome</span>
              <p className={styles.infoValue}>{convenioAtual.nome}</p>
            </div>
            <div>
              <span className={styles.infoLabel}>Status</span>
              <p className={styles.infoValue}>
                {convenioAtual.ativo ? "Ativo" : "Inativo"}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>Abrangência</span>
              <p className={styles.infoValue}>{convenioAtual.abrangencia}</p>
            </div>
            <div>
              <span className={styles.infoLabel}>CNPJ</span>
              <p className={styles.infoValue}>{formatarCnpj(convenioAtual.cnpj)}</p>
            </div>
          </div>
        </section>

        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>Financeiro</h2>
          <div className={styles.infoGrid}>
            <div>
              <span className={styles.infoLabel}>Prazo de pagamento</span>
              <p className={styles.infoValue}>{convenioAtual.diasPagamento} dias</p>
            </div>
          </div>
        </section>

        <section className={`${styles.sectionCard} ${styles.colSpan2}`}>
          <h2 className={styles.sectionTitle}>Contato</h2>
          <div className={styles.infoGrid}>
            <div>
              <span className={styles.infoLabel}>Telefone</span>
              <p className={styles.infoValue}>{convenioAtual.contato.telefone}</p>
            </div>
            <div>
              <span className={styles.infoLabel}>WhatsApp</span>
              <p className={styles.infoValue}>
                {convenioAtual.contato.whatsapp || "Não informado"}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>E-mail</span>
              <p className={styles.infoValue}>
                {convenioAtual.contato.email || "Não informado"}
              </p>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}



