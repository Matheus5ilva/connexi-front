import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FaChevronLeft, FaEdit, FaStethoscope, FaTrash } from "react-icons/fa";
import { Modal } from "../../../../components/ui/modal";
import { NotFoundCard } from "../../../../components/ui/not-found-card";
import { PageHeader } from "../../../../components/ui/page-header";
import { PageLayout } from "../../../../components/ui/page-layout";
import { CarregamentoCentral } from "../../../../components/ui/carregamento-central";
import { resolveReturnTo } from "../../../../routes/return-to";
import { parseRouteNumericId } from "../../../../schemas/runtime-input.schema";
import {
  especialidadeService,
  toErrorMessage,
  type Especialidade,
} from "../../../../services/api";
import styles from "./styles.module.css";

export function VisualizarEspecialidade() {
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
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const descricao = useMemo(() => {
    if (!especialidade?.descricao) {
      return "Nenhuma descrição cadastrada para esta especialidade.";
    }

    return especialidade.descricao;
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
            loadError || "Verifique se a especialidade existe para continuar."
          }
          actionLabel="Voltar para especialidades"
          onAction={() => navigate(returnTo)}
        />
      </PageLayout>
    );
  }

  const especialidadeIdAtual = especialidade.id;

  async function handleDelete() {
    setDeleteError(null);
    setIsDeleting(true);

    try {
      await especialidadeService.remover(especialidadeIdAtual);
      navigate(returnTo);
    } catch (error) {
      setDeleteError(
        toErrorMessage(error, "Não foi possível excluir a especialidade."),
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
        title="Excluir especialidade"
        subtitle="Essa ação remove a especialidade de forma definitiva."
        maxWidth="480px"
      >
        <div className={styles.confirmBody}>
          <p>
            Deseja realmente excluir <strong>{especialidade.nome}</strong>?
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
              {isDeleting ? "Excluindo..." : "Excluir especialidade"}
            </button>
          </div>
        </div>
      </Modal>

      <PageHeader
        title="Especialidade"
        left={
          <div className={styles.titleWithBack}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => navigate(returnTo)}
              aria-label="Voltar para a lista de especialidades"
            >
              <FaChevronLeft />
            </button>
            <div>
              <h1 className={styles.pageTitle}>{especialidade.nome}</h1>
              <p className={styles.pageSubtitle}>
                Especialidade cadastrada no sistema
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
                navigate(
                  `/profissional/especialidades/${especialidadeIdAtual}/editar`,
                  {
                    state: { returnTo },
                  },
                )
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

      <section className={styles.kpiGrid}>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Identificador</span>
          <strong className={styles.kpiValue}>#{especialidade.id}</strong>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Nome</span>
          <strong className={styles.kpiValue}>{especialidade.nome}</strong>
        </article>
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>
            <FaStethoscope className={styles.sectionIcon} />
            Dados da especialidade
          </h2>
          <div className={styles.infoGrid}>
            <div>
              <span className={styles.infoLabel}>Nome</span>
              <p className={styles.infoValue}>{especialidade.nome}</p>
            </div>
            <div className={styles.colSpan2}>
              <span className={styles.infoLabel}>Descrição</span>
              <p className={styles.notesText}>{descricao}</p>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}



