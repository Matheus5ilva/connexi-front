import { useEffect, useMemo, useState } from "react";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Modal } from "../../components/ui/modal";
import { NotFoundCard } from "../../components/ui/not-found-card";
import { PageHeader } from "../../components/ui/page-header";
import { PageLayout } from "../../components/ui/page-layout";
import { CarregamentoCentral } from "../../components/ui/carregamento-central";
import { Table } from "../../components/ui/table";
import {
  convenioService,
  toErrorMessage,
  type ConvenioListaItem,
} from "../../services/api";
import styles from "./styles.module.css";

const conveniosPath = "/financeiro/convenios";

export function Convenios() {
  const navigate = useNavigate();
  const [convenios, setConvenios] = useState<ConvenioListaItem[]>([]);
  const [selectedDeleteId, setSelectedDeleteId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const convenioToDelete = useMemo(
    () => convenios.find((item) => item.id === selectedDeleteId) || null,
    [convenios, selectedDeleteId],
  );

  async function carregarConvenios() {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await convenioService.listar();
      setConvenios(
        response.slice().sort((a, b) => a.nome.localeCompare(b.nome)),
      );
    } catch (error) {
      setLoadError(
        toErrorMessage(error, "Não foi possível carregar os convênios."),
      );
      setConvenios([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void carregarConvenios();
  }, []);

  async function handleDeleteConfirmed() {
    if (!selectedDeleteId) {
      return;
    }

    try {
      setActionError(null);
      await convenioService.remover(selectedDeleteId);
      setSelectedDeleteId(null);
      await carregarConvenios();
    } catch (error) {
      setActionError(
        toErrorMessage(error, "Não foi possível excluir o convênio."),
      );
    }
  }

  if (isLoading && convenios.length === 0) {
    return (
      <PageLayout>
        <CarregamentoCentral />
      </PageLayout>
    );
  }

  if (loadError && convenios.length === 0) {
    return (
      <PageLayout>
        <NotFoundCard
          title="Falha ao carregar convênios"
          description={loadError}
          actionLabel="Atualizar página"
          onAction={() => window.location.reload()}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Modal
        open={!!convenioToDelete}
        onClose={() => setSelectedDeleteId(null)}
        title="Excluir convênio"
        subtitle="Essa ação remove o convênio da base atual."
        maxWidth="480px"
      >
        <div className={styles.confirmBody}>
          <p>
            Tem certeza que deseja excluir o convênio{" "}
            <strong>{convenioToDelete?.nome}</strong>?
          </p>
          <p>Essa ação não pode ser desfeita.</p>

          <div className={styles.confirmActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => setSelectedDeleteId(null)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={styles.btnDanger}
              onClick={() => void handleDeleteConfirmed()}
            >
              Excluir convênio
            </button>
          </div>
        </div>
      </Modal>

      <PageHeader
        title="Convênios"
        subtitle="Gerencie os convênios cadastrados."
        right={
          <button
            className={styles.btnPrimary}
            onClick={() => navigate("/financeiro/convenios/novo")}
            type="button"
          >
            <FaPlus />
            <span>Novo convênio</span>
          </button>
        }
      />

      {actionError && <p>{actionError}</p>}

      <Table
        data={convenios}
        caption="Tabela de convênios cadastrados"
        emptyMessage="Nenhum convênio cadastrado."
        onRowClick={(row) =>
          navigate(`/financeiro/convenios/${row.id}`, {
            state: { returnTo: conveniosPath },
          })
        }
        columns={[
          { key: "nome", label: "Convênio" },
          {
            key: "ativo",
            label: "Status",
            align: "center",
            render: (row) => (
              <span
                className={`${styles.statusBadge} ${row.ativo ? styles.statusAtivo : styles.statusInativo}`}
              >
                {row.ativo ? "Ativo" : "Inativo"}
              </span>
            ),
          },
          {
            key: "acoes",
            label: "Ações",
            align: "center",
            render: (row) => (
              <div className={styles.actionButtons}>
                <button
                  type="button"
                  aria-label={`Editar ${row.nome}`}
                  onClick={() =>
                    navigate(`/financeiro/convenios/${row.id}/editar`)
                  }
                >
                  <FaEdit color="var(--color-brand-dark)" />
                </button>
                <button
                  type="button"
                  className={styles.deleteBtn}
                  aria-label={`Excluir ${row.nome}`}
                  onClick={() => setSelectedDeleteId(row.id)}
                >
                  <FaTrash color="var(--color-danger)" />
                </button>
              </div>
            ),
          },
        ]}
      />
    </PageLayout>
  );
}
