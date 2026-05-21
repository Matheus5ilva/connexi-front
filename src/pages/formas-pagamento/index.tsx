import { useCallback, useEffect, useMemo, useState } from "react";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  CompactFilterField,
  CompactFilters,
} from "../../components/ui/compact-filters";
import { Modal } from "../../components/ui/modal";
import { PageHeader } from "../../components/ui/page-header";
import { PageLayout } from "../../components/ui/page-layout";
import { CarregamentoCentral } from "../../components/ui/carregamento-central";
import { Table } from "../../components/ui/table";
import { TableActionButton } from "../../components/ui/table-action-button";
import {
  formaPagamentoService,
  toErrorMessage,
  type FormaPagamento,
  type RecebimentoTipo,
} from "../../services/api";
import {
  formatarData,
  formatarRecebimento,
  formatarTaxaPercentual,
} from "./formatadores";
import styles from "./styles.module.css";

type RecebimentoFiltro = "todos" | RecebimentoTipo;

type EstadoFiltros = {
  busca: string;
  recebimento: RecebimentoFiltro;
};

const filtrosIniciais: EstadoFiltros = {
  busca: "",
  recebimento: "todos",
};

function getResumoFormaPagamento(formaPagamento: FormaPagamento): string {
  if (formaPagamento.observacoes) {
    return formaPagamento.observacoes;
  }

  return "Configuração financeira para recebimentos do sistema.";
}

export function FormasPagamento() {
  const navigate = useNavigate();
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<EstadoFiltros>(filtrosIniciais);
  const [selectedDeleteId, setSelectedDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const carregarFormasPagamento = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await formaPagamentoService.listar();
      setFormasPagamento(response);
    } catch (error) {
      setLoadError(
        toErrorMessage(
          error,
          "Não foi possível carregar as formas de pagamento.",
        ),
      );
      setFormasPagamento([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregarFormasPagamento();
  }, [carregarFormasPagamento]);

  const hasActiveFilters =
    filtros.busca.trim().length > 0 || filtros.recebimento !== "todos";

  const formasPagamentoFiltradas = useMemo(() => {
    const termoBusca = filtros.busca.trim().toLowerCase();

    return formasPagamento.filter((formaPagamento) => {
      const atendeBusca =
        termoBusca.length === 0 ||
        formaPagamento.nome.toLowerCase().includes(termoBusca) ||
        formaPagamento.observacoes?.toLowerCase().includes(termoBusca);

      const atendeRecebimento =
        filtros.recebimento === "todos" ||
        formaPagamento.recebimentoTipo === filtros.recebimento;

      return atendeBusca && atendeRecebimento;
    });
  }, [formasPagamento, filtros]);

  const formaPagamentoParaExcluir = useMemo(
    () => formasPagamento.find((item) => item.id === selectedDeleteId) || null,
    [formasPagamento, selectedDeleteId],
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
      await formaPagamentoService.remover(selectedDeleteId);
      setFormasPagamento((prev) =>
        prev.filter((item) => item.id !== selectedDeleteId),
      );
      setSelectedDeleteId(null);
    } catch (error) {
      setDeleteError(
        toErrorMessage(error, "Não foi possível excluir a forma de pagamento."),
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <PageLayout>
      <Modal
        open={!!formaPagamentoParaExcluir}
        onClose={() => {
          setSelectedDeleteId(null);
          setDeleteError(null);
        }}
        title="Excluir forma de pagamento"
        subtitle="Essa ação remove a forma de pagamento da base atual."
        maxWidth="480px"
      >
        <div className={styles.confirmBody}>
          <p>
            Tem certeza que deseja excluir{" "}
            <strong>{formaPagamentoParaExcluir?.nome}</strong>?
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
              {isDeleting ? "Excluindo..." : "Excluir forma de pagamento"}
            </button>
          </div>
        </div>
      </Modal>

      <PageHeader
        title="Formas de pagamento"
        subtitle="Cadastre regras de taxa e prazo para recebimentos do financeiro."
        right={
          <button
            className={styles.btnPrimary}
            type="button"
            onClick={() => navigate("/financeiro/formas-pagamento/novo")}
          >
            <FaPlus />
            <span>Nova forma de pagamento</span>
          </button>
        }
      />

      <CompactFilters
        fields={
          <>
            <CompactFilterField label="Buscar" grow>
              <input
                value={filtros.busca}
                placeholder="Nome ou observações"
                onChange={(event) =>
                  handleFilterChange("busca", event.target.value)
                }
              />
            </CompactFilterField>

            <CompactFilterField label="Tipo de recebimento">
              <select
                value={filtros.recebimento}
                onChange={(event) =>
                  handleFilterChange(
                    "recebimento",
                    event.target.value as RecebimentoFiltro,
                  )
                }
              >
                <option value="todos">Todos</option>
                <option value="na_hora">Na hora</option>
                <option value="prazo">A prazo</option>
              </select>
            </CompactFilterField>
          </>
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
            onClick={() => void carregarFormasPagamento()}
          >
            Tentar novamente
          </button>
        </section>
      )}

      {isLoading ? (
        <CarregamentoCentral />
      ) : (
        <Table
          data={formasPagamentoFiltradas}
          caption="Tabela de formas de pagamento"
          emptyMessage="Nenhuma forma de pagamento encontrada para os filtros selecionados."
          onRowClick={(row) =>
            navigate(`/financeiro/formas-pagamento/${row.id}`)
          }
          getRowClassName={() => styles.linhaFormaPagamento}
          getRowAriaLabel={(row) => `Abrir detalhes de ${row.nome}`}
          columns={[
            {
              key: "nome",
              label: "Forma de pagamento",
              render: (row) => (
                <div className={styles.nameCell}>
                  <strong className={styles.nameValue}>{row.nome}</strong>
                  <span className={styles.nameHint}>
                    {getResumoFormaPagamento(row)}
                  </span>
                </div>
              ),
            },
            {
              key: "taxa",
              label: "Taxa",
              align: "center",
              render: (row) => (
                <span className={styles.highlightValue}>
                  {formatarTaxaPercentual(row.taxaPercentual)}
                </span>
              ),
            },
            {
              key: "recebimento",
              label: "Recebimento",
              align: "center",
              render: (row) => (
                <span className={styles.highlightValue}>
                  {formatarRecebimento(row)}
                </span>
              ),
            },
            {
              key: "cadastro",
              label: "Cadastro",
              align: "center",
              render: (row) => (
                <span className={styles.dateValue}>
                  {formatarData(row.dataCadastro)}
                </span>
              ),
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
                      navigate(`/financeiro/formas-pagamento/${row.id}/editar`)
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
