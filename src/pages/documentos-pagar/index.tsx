import { useEffect, useMemo, useState } from "react";
import { FaCheck, FaPlus, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  CompactFilterField,
  CompactFilters,
} from "../../components/ui/compact-filters";
import { Modal } from "../../components/ui/modal";
import { PageHeader } from "../../components/ui/page-header";
import { PageLayout } from "../../components/ui/page-layout";
import { CarregamentoCentral } from "../../components/ui/carregamento-central";
import { StatusBadge } from "../../components/ui/status-badge";
import { SummaryMetrics } from "../../components/ui/summary-metrics";
import { Table } from "../../components/ui/table";
import { TableActionButton } from "../../components/ui/table-action-button";
import { TableTextCell } from "../../components/ui/table-text-cell";
import { obterUsuarioAutenticado } from "../../auth/session";
import { formatarDataSomenteDia } from "../../domain/data-somente-dia";
import {
  filtrosDocumentoPagarSchema,
  type FiltrosDocumentoPagarFormData,
} from "../../schemas/documento-pagar.schema";
import {
  documentoPagarService,
  mapFiltrosDocumentoPagarToListRequest,
  toErrorMessage,
  type DocumentoPagar,
  type SituacaoDocumentoPagar,
} from "../../services/api";
import styles from "./styles.module.css";
import { usuarioPodeExcluirContaPagar } from "./utils/permissoes-conta-pagar";
import { obterValorParcelaContaPagar } from "./utils/valores-conta-pagar";

type SituacaoFiltro = FiltrosDocumentoPagarFormData["situacao"];

type EstadoFiltros = {
  busca: string;
  situacao: SituacaoFiltro;
  categoria: string;
  dataVencimentoInicio: string;
  dataVencimentoFim: string;
};

const filtrosIniciais: EstadoFiltros = {
  busca: "",
  situacao: "todos",
  categoria: "",
  dataVencimentoInicio: "",
  dataVencimentoFim: "",
};

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(dataIso?: string | null): string {
  return formatarDataSomenteDia(dataIso);
}

function formatarSituacao(situacao: SituacaoDocumentoPagar): string {
  switch (situacao) {
    case "PAGO":
      return "Pago";
    case "ATRASADO":
      return "Atrasado";
    case "CANCELADO":
      return "Cancelado";
    default:
      return "Pendente";
  }
}

function obterTextoVencimento(documento: DocumentoPagar): string {
  if (documento.situacao === "PAGO") {
    return documento.dataPagamento
      ? `Pago em ${formatarData(documento.dataPagamento)}`
      : "Pago";
  }

  if (documento.situacao === "CANCELADO") {
    return documento.dataCancelamento
      ? `Cancelado em ${formatarData(documento.dataCancelamento)}`
      : "Cancelado";
  }

  if (documento.situacao === "ATRASADO") {
    return `${documento.diasAtraso} dia${documento.diasAtraso > 1 ? "s" : ""} em atraso`;
  }

  return "Dentro do prazo";
}

function obterRotuloParcela(documento: DocumentoPagar): string | null {
  if (!documento.parcelado || documento.totalParcelas < 2) {
    return null;
  }

  return `${documento.parcelaNumero}/${documento.totalParcelas}`;
}

function renderizarBadgeSituacao(situacao: SituacaoDocumentoPagar) {
  if (situacao === "PAGO") {
    return <StatusBadge label="Pago" variant="success" />;
  }

  if (situacao === "ATRASADO") {
    return <StatusBadge label="Atrasado" variant="danger" />;
  }

  if (situacao === "CANCELADO") {
    return <StatusBadge label="Cancelado" variant="neutral" />;
  }

  return <StatusBadge label="Pendente" variant="warning" />;
}

function normalizarFiltros(
  filtros: EstadoFiltros,
): FiltrosDocumentoPagarFormData {
  return filtrosDocumentoPagarSchema.parse({
    busca: filtros.busca || undefined,
    situacao: filtros.situacao,
    categoria: filtros.categoria || undefined,
    dataVencimentoInicio: filtros.dataVencimentoInicio,
    dataVencimentoFim: filtros.dataVencimentoFim,
  });
}

export function ContasPagar() {
  const navigate = useNavigate();
  const usuarioAtual = obterUsuarioAutenticado();
  const [documentos, setDocumentos] = useState<DocumentoPagar[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [filtros, setFiltros] = useState<EstadoFiltros>(filtrosIniciais);
  const [mostrarFiltroPeriodo, setMostrarFiltroPeriodo] = useState(false);
  const [documentoSelecionadoParaExcluir, setDocumentoSelecionadoParaExcluir] =
    useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    async function carregarCategorias() {
      try {
        const response = await documentoPagarService.listarCategorias();
        if (ativo) {
          setCategorias(response);
        }
      } catch {
        if (ativo) {
          setCategorias([]);
        }
      }
    }

    void carregarCategorias();

    return () => {
      ativo = false;
    };
  }, []);

  async function buscarDocumentosFiltrados(filtrosAtuais: EstadoFiltros) {
    const filtrosValidados = normalizarFiltros(filtrosAtuais);
    const query = mapFiltrosDocumentoPagarToListRequest(filtrosValidados);
    const response = await documentoPagarService.listar({
      page: 1,
      limit: 100,
      ...query,
    });

    return response.items;
  }

  async function carregarDocumentos() {
    const itens = await buscarDocumentosFiltrados(filtros);
    setDocumentos(itens);
  }

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        setCarregando(true);
        setErroCarregamento(null);

        const itens = await buscarDocumentosFiltrados(filtros);

        if (ativo) {
          setDocumentos(itens);
        }
      } catch (error) {
        if (!ativo) {
          return;
        }

        setDocumentos([]);
        setErroCarregamento(
          toErrorMessage(error, "Não foi possível carregar as contas a pagar."),
        );
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    void carregar();

    return () => {
      ativo = false;
    };
  }, [filtros]);

  const possuiFiltroPeriodo = Boolean(
    filtros.dataVencimentoInicio || filtros.dataVencimentoFim,
  );
  const possuiFiltrosAtivos =
    filtros.busca.trim().length > 0 ||
    filtros.situacao !== "todos" ||
    filtros.categoria.length > 0 ||
    possuiFiltroPeriodo;

  const resumo = useMemo(() => {
    return documentos.reduce(
      (acc, documento) => {
        const valorParcela = obterValorParcelaContaPagar(documento);

        if (documento.situacao === "PAGO") {
          acc.totalPago += valorParcela;
        }

        if (
          documento.situacao === "PENDENTE" ||
          documento.situacao === "ATRASADO"
        ) {
          acc.totalAPagar += valorParcela;
        }

        if (documento.situacao === "ATRASADO") {
          acc.totalAtrasado += valorParcela;
        }

        return acc;
      },
      {
        totalAPagar: 0,
        totalPago: 0,
        totalAtrasado: 0,
      },
    );
  }, [documentos]);

  const documentoParaExcluir = useMemo(
    () =>
      documentos.find((item) => item.id === documentoSelecionadoParaExcluir) ||
      null,
    [documentos, documentoSelecionadoParaExcluir],
  );
  const podeExcluirDocumentoSelecionado =
    documentoParaExcluir &&
    usuarioPodeExcluirContaPagar(usuarioAtual);

  function atualizarFiltro<K extends keyof EstadoFiltros>(
    key: K,
    value: EstadoFiltros[K],
  ) {
    setFiltros((prev) => ({ ...prev, [key]: value }));
  }

  function limparFiltros() {
    setFiltros(filtrosIniciais);
    setMostrarFiltroPeriodo(false);
  }

  async function confirmarExclusao() {
    if (!documentoSelecionadoParaExcluir) {
      return;
    }

    try {
      setErroAcao(null);
      await documentoPagarService.remover(documentoSelecionadoParaExcluir);
      await carregarDocumentos();
      setDocumentoSelecionadoParaExcluir(null);
    } catch (error) {
      setErroAcao(
        toErrorMessage(error, "Não foi possível excluir a conta a pagar."),
      );
    }
  }

  async function marcarComoPago(documentoId: number) {
    try {
      setErroAcao(null);
      await documentoPagarService.marcarComoPago(documentoId);
      await carregarDocumentos();
    } catch (error) {
      setErroAcao(
        toErrorMessage(error, "Não foi possível marcar a conta como paga."),
      );
    }
  }

  return (
    <PageLayout>
      <Modal
        open={!!documentoParaExcluir}
        onClose={() => setDocumentoSelecionadoParaExcluir(null)}
        title="Excluir conta"
        subtitle="Essa ação remove a conta da base atual."
        maxWidth="480px"
      >
        <div className={styles.confirmBody}>
          <p>
            Tem certeza de que deseja excluir{" "}
            <strong>{documentoParaExcluir?.descricao}</strong>?
          </p>
          <p>Essa ação não pode ser desfeita.</p>
          <div className={styles.confirmActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => setDocumentoSelecionadoParaExcluir(null)}
            >
              Cancelar
            </button>
            {podeExcluirDocumentoSelecionado ? (
              <button
                type="button"
                className={styles.btnDanger}
                onClick={() => void confirmarExclusao()}
              >
                Excluir conta
              </button>
            ) : null}
          </div>
        </div>
      </Modal>

      <PageHeader
        title="Contas a pagar"
        subtitle="Controle de despesas, vencimentos e pagamentos"
        right={
          <button
            className={styles.btnPrimary}
            type="button"
            onClick={() => navigate("/financeiro/contas-a-pagar/novo")}
          >
            <FaPlus />
            <span>Adicionar conta</span>
          </button>
        }
      />

      <SummaryMetrics
        ariaLabel="Resumo financeiro"
        columns={3}
        items={[
          {
            label: "Total a pagar",
            value: formatarMoeda(resumo.totalAPagar),
          },
          {
            label: "Total pago",
            value: formatarMoeda(resumo.totalPago),
            tone: "positive",
          },
          {
            label: "Total atrasado",
            value: formatarMoeda(resumo.totalAtrasado),
            tone: "negative",
          },
        ]}
      />

      <CompactFilters
        fields={
          <>
            <CompactFilterField label="Buscar" grow>
              <input
                value={filtros.busca}
                placeholder="Descrição ou observação"
                onChange={(event) =>
                  atualizarFiltro("busca", event.target.value)
                }
              />
            </CompactFilterField>

            <CompactFilterField label="Situação">
              <select
                value={filtros.situacao}
                onChange={(event) =>
                  atualizarFiltro(
                    "situacao",
                    event.target.value as SituacaoFiltro,
                  )
                }
              >
                <option value="todos">Todas</option>
                <option value="PAGO">Pago</option>
                <option value="PENDENTE">Pendente</option>
                <option value="ATRASADO">Atrasado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </CompactFilterField>

            <CompactFilterField label="Categoria">
              <select
                value={filtros.categoria}
                onChange={(event) =>
                  atualizarFiltro("categoria", event.target.value)
                }
              >
                <option value="">Todas</option>
                {categorias.map((categoria) => (
                  <option key={categoria} value={categoria}>
                    {categoria}
                  </option>
                ))}
              </select>
            </CompactFilterField>
          </>
        }
        advancedFields={
          <>
            <CompactFilterField label="Vencimento inicial">
              <input
                type="date"
                value={filtros.dataVencimentoInicio}
                onChange={(event) =>
                  atualizarFiltro("dataVencimentoInicio", event.target.value)
                }
              />
            </CompactFilterField>

            <CompactFilterField label="Vencimento final">
              <input
                type="date"
                value={filtros.dataVencimentoFim}
                onChange={(event) =>
                  atualizarFiltro("dataVencimentoFim", event.target.value)
                }
              />
            </CompactFilterField>
          </>
        }
        advancedVisible={mostrarFiltroPeriodo}
        advancedActive={possuiFiltroPeriodo}
        onToggleAdvanced={() => setMostrarFiltroPeriodo((prev) => !prev)}
        toggleCollapsedLabel="Filtrar período"
        toggleExpandedLabel="Ocultar período"
        advancedId="contas-pagar-filtro-periodo"
        showClear={possuiFiltrosAtivos}
        onClear={limparFiltros}
      />

      {erroCarregamento || erroAcao ? (
        <section className={styles.confirmBody}>
          <p>{erroCarregamento || erroAcao}</p>
        </section>
      ) : null}

      {carregando && documentos.length === 0 ? (
        <CarregamentoCentral />
      ) : (
        <Table
          data={documentos}
          caption="Tabela de contas a pagar"
          emptyMessage="Nenhuma conta encontrada para os filtros selecionados."
          onRowClick={(row) =>
            navigate(`/financeiro/contas-a-pagar/${row.id}`, {
              state: { returnTo: "/financeiro/contas-a-pagar" },
            })
          }
          columns={[
            {
              key: "descricao",
              label: "Conta",
              render: (row) => {
                const parcelaLabel = obterRotuloParcela(row);
                const descricaoSecundaria = parcelaLabel
                  ? `${row.categoria || "Sem categoria"} • Parcela ${parcelaLabel}`
                  : row.categoria || "Sem categoria";

                return (
                  <TableTextCell
                    primary={row.descricao}
                    secondary={descricaoSecundaria}
                  />
                );
              },
            },
            {
              key: "vencimento",
              label: "Vencimento",
              render: (row) => (
                <TableTextCell
                  primary={formatarData(row.dataVencimento)}
                  secondary={obterTextoVencimento(row)}
                  primaryTone={
                    row.situacao === "ATRASADO" ? "danger" : "default"
                  }
                  secondaryTone={
                    row.situacao === "ATRASADO" ? "danger" : "muted"
                  }
                />
              ),
            },
            {
              key: "valor",
              label: "Valor",
              align: "right",
              render: (row) => (
                <TableTextCell
                  primary={formatarMoeda(obterValorParcelaContaPagar(row))}
                  align="right"
                />
              ),
            },
            {
              key: "status",
              label: "Situação",
              align: "center",
              render: (row) => renderizarBadgeSituacao(row.situacao),
            },
            {
              key: "acoes",
              label: "Ações",
              align: "right",
              render: (row) => (
                <div className={styles.actionButtons}>
                  {row.status === "PENDENTE" && (
                    <TableActionButton
                      icon={<FaCheck color="var(--color-success)" />}
                      label={`Marcar ${row.descricao} como pago`}
                      title="Marcar como pago"
                      tone="success"
                      onClick={() => void marcarComoPago(row.id)}
                    />
                  )}

                  {usuarioPodeExcluirContaPagar(usuarioAtual) ? (
                    <TableActionButton
                      icon={<FaTrash color="var(--color-danger)" />}
                      label={`Excluir ${row.descricao}`}
                      title="Excluir"
                      tone="danger"
                      onClick={() => setDocumentoSelecionadoParaExcluir(row.id)}
                    />
                  ) : null}
                </div>
              ),
            },
          ]}
        />
      )}

      {!carregando && documentos.length > 0 ? (
        <p className={styles.resultInfo}>
          {documentos.length} registro{documentos.length > 1 ? "s" : ""} exibido
          {documentos.length > 1 ? "s" : ""}. Situação atual:{" "}
          {filtros.situacao === "todos"
            ? "todas"
            : formatarSituacao(filtros.situacao)}
          .
        </p>
      ) : null}
    </PageLayout>
  );
}
