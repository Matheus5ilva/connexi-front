import { useCallback, useEffect, useMemo, useState } from "react";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  CompactFilterField,
  CompactFilters,
} from "../../../components/ui/compact-filters";
import { Modal } from "../../../components/ui/modal";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout } from "../../../components/ui/page-layout";
import { CarregamentoCentral } from "../../../components/ui/carregamento-central";
import { Table } from "../../../components/ui/table";
import { TableActionButton } from "../../../components/ui/table-action-button";
import { TableTextCell } from "../../../components/ui/table-text-cell";
import {
  especialidadeService,
  toErrorMessage,
  type EspecialidadeListaItem,
} from "../../../services/api";
import styles from "./styles.module.css";

const caminhoEspecialidades = "/profissional/especialidades";

type EstadoFiltros = {
  busca: string;
};

const filtrosIniciais: EstadoFiltros = {
  busca: "",
};

export function Especialidades() {
  const navigate = useNavigate();
  const [especialidades, setEspecialidades] = useState<
    EspecialidadeListaItem[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<EstadoFiltros>(filtrosIniciais);
  const [selectedDeleteId, setSelectedDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadEspecialidades = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await especialidadeService.listar();
      setEspecialidades(response);
    } catch (error) {
      setLoadError(
        toErrorMessage(error, "Não foi possível carregar as especialidades."),
      );
      setEspecialidades([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEspecialidades();
  }, [loadEspecialidades]);

  const hasActiveFilters = filtros.busca.trim().length > 0;

  const especialidadesFiltradas = useMemo(() => {
    const termoBusca = filtros.busca.trim().toLowerCase();

    if (!termoBusca) {
      return especialidades;
    }

    return especialidades.filter((especialidade) =>
      especialidade.nome.toLowerCase().includes(termoBusca),
    );
  }, [especialidades, filtros.busca]);

  const especialidadeParaExcluir = useMemo(
    () => especialidades.find((item) => item.id === selectedDeleteId) || null,
    [especialidades, selectedDeleteId],
  );

  function handleFilterChange<K extends keyof EstadoFiltros>(
    key: K,
    value: EstadoFiltros[K],
  ) {
    setFiltros((prev) => ({ ...prev, [key]: value }));
  }

  function handleClearFilters() {
    setFiltros(filtrosIniciais);
  }

  async function handleDeleteConfirmed() {
    if (!selectedDeleteId) {
      return;
    }

    setDeleteError(null);
    setIsDeleting(true);

    try {
      await especialidadeService.remover(selectedDeleteId);
      setEspecialidades((prev) =>
        prev.filter((item) => item.id !== selectedDeleteId),
      );
      setSelectedDeleteId(null);
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
        open={!!especialidadeParaExcluir}
        onClose={() => {
          setSelectedDeleteId(null);
          setDeleteError(null);
        }}
        title="Excluir especialidade"
        subtitle="Essa ação remove a especialidade da base atual."
        maxWidth="480px"
      >
        <div className={styles.confirmBody}>
          <p>
            Tem certeza que deseja excluir{" "}
            <strong>{especialidadeParaExcluir?.nome}</strong>?
          </p>
          <p>Essa ação não pode ser desfeita.</p>

          {deleteError && <p className={styles.feedbackError}>{deleteError}</p>}

          <div className={styles.confirmActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => {
                setSelectedDeleteId(null);
                setDeleteError(null);
              }}
              disabled={isDeleting}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={styles.btnDanger}
              onClick={handleDeleteConfirmed}
              disabled={isDeleting}
            >
              {isDeleting ? "Excluindo..." : "Excluir especialidade"}
            </button>
          </div>
        </div>
      </Modal>

      <PageHeader
        title="Especialidades do perfil"
        subtitle="Cadastre e organize especialidades vinculadas ao seu perfil profissional."
        right={
          <div className={styles.headerActions}>
            <button
              className={styles.btnPrimary}
              type="button"
              onClick={() => navigate("/profissional/especialidades/nova")}
            >
              <FaPlus />
              <span>Nova especialidade</span>
            </button>
          </div>
        }
      />

      <CompactFilters
        fields={
          <CompactFilterField label="Buscar especialidade" grow>
            <input
              value={filtros.busca}
              placeholder="Nome da especialidade"
              onChange={(event) =>
                handleFilterChange("busca", event.target.value)
              }
            />
          </CompactFilterField>
        }
        showClear={hasActiveFilters}
        onClear={handleClearFilters}
      />

      {loadError && !isLoading && (
        <section className={styles.feedbackCard} role="alert">
          <p className={styles.feedbackError}>{loadError}</p>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => void loadEspecialidades()}
          >
            Tentar novamente
          </button>
        </section>
      )}

      {isLoading ? (
        <CarregamentoCentral />
      ) : (
        <Table
          data={especialidadesFiltradas}
          caption="Tabela de especialidades do perfil"
          emptyMessage="Nenhuma especialidade encontrada para os filtros selecionados."
          onRowClick={(row) =>
            navigate(`/profissional/especialidades/${row.id}`, {
              state: { returnTo: caminhoEspecialidades },
            })
          }
          getRowClassName={() => styles.linhaEspecialidade}
          getRowAriaLabel={(row) =>
            `Abrir detalhes da especialidade ${row.nome}`
          }
          columns={[
            {
              key: "especialidade",
              label: "Especialidade",
              render: (row) => <TableTextCell primary={row.nome} />,
            },
            {
              key: "acoes",
              label: "Ações",
              align: "right",
              render: (row) => (
                <div className={styles.actionButtons}>
                  <TableActionButton
                    icon={<FaEdit color="var(--color-brand-dark)" />}
                    label={`Editar ${row.nome}`}
                    title="Editar"
                    onClick={() =>
                      navigate(
                        `/profissional/especialidades/${row.id}/editar`,
                        {
                          state: { returnTo: caminhoEspecialidades },
                        },
                      )
                    }
                  />

                  <TableActionButton
                    icon={<FaTrash color="var(--color-danger)" />}
                    label={`Excluir ${row.nome}`}
                    title="Excluir"
                    tone="danger"
                    onClick={() => setSelectedDeleteId(row.id)}
                  />
                </div>
              ),
            },
          ]}
        />
      )}
    </PageLayout>
  );
}
