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
  servicoService,
  toErrorMessage,
  type ServicoListaItem,
} from "../../services/api";
import styles from "./styles.module.css";

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function Servicos() {
  const servicosPath = "/financeiro/servicos";
  const navigate = useNavigate();
  const [servicos, setServicos] = useState<ServicoListaItem[]>([]);
  const [selectedDeleteId, setSelectedDeleteId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const servicoParaExcluir = useMemo(
    () => servicos.find((item) => item.id === selectedDeleteId) || null,
    [servicos, selectedDeleteId],
  );

  async function carregarServicos() {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await servicoService.listar();
      setServicos(
        response.slice().sort((a, b) => a.nome.localeCompare(b.nome)),
      );
    } catch (error) {
      setLoadError(
        toErrorMessage(error, "Não foi possível carregar os serviços."),
      );
      setServicos([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void carregarServicos();
  }, []);

  async function handleDeleteConfirmed() {
    if (!selectedDeleteId) {
      return;
    }

    try {
      setActionError(null);
      await servicoService.remover(selectedDeleteId);
      setSelectedDeleteId(null);
      await carregarServicos();
    } catch (error) {
      setActionError(
        toErrorMessage(error, "Não foi possível excluir o serviço."),
      );
    }
  }

  if (isLoading && servicos.length === 0) {
    return (
      <PageLayout>
        <CarregamentoCentral />
      </PageLayout>
    );
  }

  if (loadError && servicos.length === 0) {
    return (
      <PageLayout>
        <NotFoundCard
          title="Falha ao carregar serviços"
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
        open={!!servicoParaExcluir}
        onClose={() => setSelectedDeleteId(null)}
        title="Excluir serviço"
        subtitle="Essa ação remove o serviço da base atual."
        maxWidth="480px"
      >
        <div className={styles.confirmBody}>
          <p>
            Tem certeza que deseja excluir o serviço{" "}
            <strong>{servicoParaExcluir?.nome}</strong>?
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
              Excluir serviço
            </button>
          </div>
        </div>
      </Modal>

      <PageHeader
        title="Serviços"
        subtitle="Gerencie os serviços cadastrados e seus valores."
        right={
          <button
            className={styles.btnPrimary}
            onClick={() => navigate("/financeiro/servicos/novo")}
            type="button"
          >
            <FaPlus />
            <span>Novo serviço</span>
          </button>
        }
      />

      {actionError && <p>{actionError}</p>}

      <Table
        data={servicos}
        caption="Tabela de serviços cadastrados"
        emptyMessage="Nenhum serviço cadastrado."
        onRowClick={(row) =>
          navigate(`/financeiro/servicos/${row.id}`, {
            state: { returnTo: servicosPath },
          })
        }
        columns={[
          { key: "nome", label: "Serviço" },
          {
            key: "valorParticular",
            label: "Valor particular",
            align: "center",
            render: (row) => <span>{formatarMoeda(row.valorParticular)}</span>,
          },
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
                    navigate(`/financeiro/servicos/${row.id}/editar`)
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
