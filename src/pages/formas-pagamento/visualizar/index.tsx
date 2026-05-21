import { useEffect, useMemo, useState } from "react";
import { FaChevronLeft, FaEdit, FaMoneyCheckAlt, FaTrash } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { Modal } from "../../../components/ui/modal";
import { NotFoundCard } from "../../../components/ui/not-found-card";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout } from "../../../components/ui/page-layout";
import { CarregamentoCentral } from "../../../components/ui/carregamento-central";
import { parseRouteNumericId } from "../../../schemas/runtime-input.schema";
import {
  formaPagamentoService,
  toErrorMessage,
  type FormaPagamento,
} from "../../../services/api";
import {
  formatarData,
  formatarRecebimento,
  formatarTaxaPercentual,
} from "../formatadores";
import styles from "./styles.module.css";

export function VisualizarFormaPagamento() {
  const navigate = useNavigate();
  const { id } = useParams();
  const formaPagamentoId = parseRouteNumericId(id);
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (formaPagamentoId === null) {
      setFormaPagamento(null);
      setIsLoading(false);
      setLoadError(null);
      return;
    }

    const targetId = formaPagamentoId;
    let isMounted = true;

    async function loadFormaPagamento() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const fetched = await formaPagamentoService.buscarPorId(targetId);
        if (!isMounted) {
          return;
        }

        setFormaPagamento(fetched);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setLoadError(
          toErrorMessage(
            error,
            "Não foi possível carregar a forma de pagamento.",
          ),
        );
        setFormaPagamento(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadFormaPagamento();

    return () => {
      isMounted = false;
    };
  }, [formaPagamentoId]);

  const observacoes = useMemo(() => {
    if (!formaPagamento?.observacoes) {
      return "Nenhuma observação cadastrada para esta forma de pagamento.";
    }

    return formaPagamento.observacoes;
  }, [formaPagamento]);

  if (isLoading) {
    return (
      <PageLayout>
        <CarregamentoCentral />
      </PageLayout>
    );
  }

  if (!formaPagamento) {
    return (
      <PageLayout>
        <NotFoundCard
          title={
            loadError
              ? "Falha ao carregar forma de pagamento"
              : "Forma de pagamento não encontrada"
          }
          description={
            loadError || "Verifique se o registro existe para continuar."
          }
          actionLabel="Voltar para formas de pagamento"
          onAction={() => navigate("/financeiro/formas-pagamento")}
        />
      </PageLayout>
    );
  }

  const formaPagamentoAtual = formaPagamento;
  const formaPagamentoIdAtual = formaPagamentoAtual.id;

  async function handleDelete() {
    setDeleteError(null);
    setIsDeleting(true);

    try {
      await formaPagamentoService.remover(formaPagamentoIdAtual);
      navigate("/financeiro/formas-pagamento");
    } catch (error) {
      setDeleteError(
        toErrorMessage(
          error,
          "Não foi possível excluir a forma de pagamento.",
        ),
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <PageLayout>
      <Modal
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Excluir forma de pagamento"
        subtitle="Essa ação remove a forma de pagamento da base atual."
        maxWidth="480px"
      >
        <div className={styles.confirmBody}>
          <p>
            Deseja realmente excluir{" "}
            <strong>{formaPagamentoAtual.nome}</strong>?
          </p>
          <p>Essa ação não pode ser desfeita.</p>

          {deleteError && <p className={styles.deleteError}>{deleteError}</p>}

          <div className={styles.confirmActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => setConfirmDeleteOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={styles.btnDanger}
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Excluindo..." : "Excluir forma de pagamento"}
            </button>
          </div>
        </div>
      </Modal>

      <PageHeader
        title="Forma de pagamento"
        left={
          <div className={styles.titleWithBack}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => navigate("/financeiro/formas-pagamento")}
              aria-label="Voltar para a lista de formas de pagamento"
            >
              <FaChevronLeft />
            </button>
            <div>
              <h1 className={styles.pageTitle}>{formaPagamentoAtual.nome}</h1>
              <p className={styles.pageSubtitle}>
                Cadastro em {formatarData(formaPagamentoAtual.dataCadastro)}
              </p>
            </div>
          </div>
        }
        right={
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() =>
                navigate(`/financeiro/formas-pagamento/${formaPagamentoIdAtual}/editar`)
              }
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

      <section
        className={styles.kpiGrid}
        aria-label="Resumo da forma de pagamento"
      >
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Taxa percentual</span>
          <strong className={styles.kpiValue}>
            {formatarTaxaPercentual(formaPagamentoAtual.taxaPercentual)}
          </strong>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Recebimento</span>
          <strong className={styles.kpiValue}>
            {formatarRecebimento(formaPagamentoAtual)}
          </strong>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Cadastro</span>
          <strong className={styles.kpiValue}>
            {formatarData(formaPagamentoAtual.dataCadastro)}
          </strong>
        </article>
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>
            <FaMoneyCheckAlt className={styles.sectionIcon} />
            Dados principais
          </h2>
          <div className={styles.infoGrid}>
            <div>
              <span className={styles.infoLabel}>Nome</span>
              <p className={styles.infoValue}>{formaPagamentoAtual.nome}</p>
            </div>
            <div>
              <span className={styles.infoLabel}>Taxa percentual</span>
              <p className={styles.infoValue}>
                {formatarTaxaPercentual(formaPagamentoAtual.taxaPercentual)}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>Tipo de recebimento</span>
              <p className={styles.infoValue}>
                {formatarRecebimento(formaPagamentoAtual)}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>Prazo de recebimento</span>
              <p className={styles.infoValue}>
                {formaPagamentoAtual.prazoRecebimentoDias
                  ? `${formaPagamentoAtual.prazoRecebimentoDias} dia${
                      formaPagamentoAtual.prazoRecebimentoDias > 1 ? "s" : ""
                    }`
                  : "Não informado"}
              </p>
            </div>
          </div>
        </section>

        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>Observações</h2>
          <p className={styles.notesText}>{observacoes}</p>
        </section>
      </div>
    </PageLayout>
  );
}



