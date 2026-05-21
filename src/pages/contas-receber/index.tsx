import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CompactFilterField,
  CompactFilters,
} from "../../components/ui/compact-filters";
import { PageHeader } from "../../components/ui/page-header";
import { PageLayout } from "../../components/ui/page-layout";
import { CarregamentoCentral } from "../../components/ui/carregamento-central";
import { StatusBadge } from "../../components/ui/status-badge";
import { SummaryMetrics } from "../../components/ui/summary-metrics";
import { Table } from "../../components/ui/table";
import { TableTextCell } from "../../components/ui/table-text-cell";
import { parseOptionalSearchText } from "../../schemas/runtime-input.schema";
import {
  filtrosDocumentoReceberSchema,
  type FiltrosDocumentoReceberFormData,
} from "../../schemas/documento-receber.schema";
import {
  documentoReceberService,
  formaPagamentoService,
  mapFiltrosDocumentoReceberToListRequest,
  toErrorMessage,
  type DocumentoReceber,
  type FormaPagamento,
} from "../../services/api";
import {
  formatarData,
  formatarMoeda,
  formatarPercentualTaxa,
  formatarRecebimento,
  formatarSituacaoDocumentoReceber,
  formatarTipoAtendimento,
  obterDicaRecebimento,
  obterRotuloParcela,
  type SituacaoContaReceberFiltro,
} from "./formatadores";
import styles from "./styles.module.css";

type EstadoFiltros = {
  busca: string;
  situacao: SituacaoContaReceberFiltro;
  formaPagamentoId: string;
  dataPrevistaInicio: string;
  dataPrevistaFim: string;
};

const filtrosIniciais: EstadoFiltros = {
  busca: "",
  situacao: "todos",
  formaPagamentoId: "",
  dataPrevistaInicio: "",
  dataPrevistaFim: "",
};

type EstadoNavegacaoContasReceber = {
  prefillPaciente?: string;
};

function renderizarBadgeSituacao(situacao: DocumentoReceber["situacao"]) {
  if (situacao === "RECEBIDO") {
    return <StatusBadge label="Recebido" variant="success" />;
  }

  if (situacao === "ATRASADO") {
    return <StatusBadge label="Atrasado" variant="danger" />;
  }

  if (situacao === "CANCELADO") {
    return <StatusBadge label="Cancelado" variant="neutral" />;
  }

  return <StatusBadge label="Previsto" variant="warning" />;
}

function obterDescricaoSecundaria(documento: DocumentoReceber): string {
  const parts = [
    documento.servicoNome,
    formatarTipoAtendimento(documento.tipoAtendimento),
  ];

  if (documento.convenioNome) {
    parts.push(documento.convenioNome);
  }

  const parcela = obterRotuloParcela(documento);
  if (parcela) {
    parts.push(`Parcela ${parcela}`);
  }

  return parts.join(" • ");
}

function obterValorSecundario(documento: DocumentoReceber): string {
  const parts = [`Bruto ${formatarMoeda(documento.valorBruto)}`];

  if (documento.valorDesconto > 0) {
    parts.push(`Desconto ${formatarMoeda(documento.valorDesconto)}`);
  }

  if (documento.valorTaxa > 0) {
    parts.push(`Taxa ${formatarMoeda(documento.valorTaxa)}`);
  }

  return parts.join(" • ");
}

function normalizarFiltros(
  filters: EstadoFiltros,
): FiltrosDocumentoReceberFormData {
  return filtrosDocumentoReceberSchema.parse({
    busca: filters.busca || undefined,
    situacao: filters.situacao,
    formaPagamentoId: filters.formaPagamentoId || undefined,
    dataPrevistaInicio: filters.dataPrevistaInicio,
    dataPrevistaFim: filters.dataPrevistaFim,
  });
}

export function ContasReceber() {
  const navigate = useNavigate();
  const location = useLocation();
  const estadoNavegacao = location.state as EstadoNavegacaoContasReceber | null;
  const pacientePreenchidoBusca = parseOptionalSearchText(
    new URLSearchParams(location.search).get("paciente"),
  );
  const pacientePreenchido =
    parseOptionalSearchText(estadoNavegacao?.prefillPaciente) ||
    pacientePreenchidoBusca;
  const caminhoListaAtual = `${location.pathname}${location.search}`;

  const [filters, setFilters] = useState<EstadoFiltros>(() => ({
    ...filtrosIniciais,
    busca: pacientePreenchido,
  }));
  const [documentos, setDocumentos] = useState<DocumentoReceber[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [showDateFilters, setShowDateFilters] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);

  useEffect(() => {
    if (!pacientePreenchido) {
      return;
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, navigate, pacientePreenchido]);

  useEffect(() => {
    let isMounted = true;

    async function carregarFormasPagamento() {
      try {
        const response = await formaPagamentoService.listar();
        if (isMounted) {
          setFormasPagamento(response);
        }
      } catch {
        if (isMounted) {
          setFormasPagamento([]);
        }
      }
    }

    void carregarFormasPagamento();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function carregarDocumentos() {
      try {
        setCarregando(true);
        setErroCarregamento(null);

        const filtrosValidados = normalizarFiltros(filters);
        const query = mapFiltrosDocumentoReceberToListRequest(filtrosValidados);
        const response = await documentoReceberService.listar({
          page: 1,
          limit: 100,
          ...query,
        });

        const items =
          filtrosValidados.situacao === "PREVISTO"
            ? response.items.filter((item) => item.situacao === "PREVISTO")
            : response.items;

        if (isMounted) {
          setDocumentos(items);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setDocumentos([]);
        setErroCarregamento(
          toErrorMessage(
            error,
            "Não foi possível carregar as contas a receber.",
          ),
        );
      } finally {
        if (isMounted) {
          setCarregando(false);
        }
      }
    }

    void carregarDocumentos();

    return () => {
      isMounted = false;
    };
  }, [filters]);

  const hasDateFilter = Boolean(
    filters.dataPrevistaInicio || filters.dataPrevistaFim,
  );
  const hasActiveFilters =
    filters.busca.trim().length > 0 ||
    filters.situacao !== "todos" ||
    filters.formaPagamentoId.length > 0 ||
    hasDateFilter;

  const resumo = useMemo(() => {
    return documentos.reduce(
      (acc, documento) => {
        if (documento.situacao === "RECEBIDO") {
          acc.totalRecebido += documento.valorLiquido;
        }

        if (
          documento.situacao === "PREVISTO" ||
          documento.situacao === "ATRASADO"
        ) {
          acc.totalAReceber += documento.valorLiquido;
        }

        if (documento.situacao === "ATRASADO") {
          acc.totalAtrasado += documento.valorLiquido;
        }

        acc.totalTaxas += documento.valorTaxa;

        return acc;
      },
      {
        totalAReceber: 0,
        totalRecebido: 0,
        totalAtrasado: 0,
        totalTaxas: 0,
      },
    );
  }, [documentos]);

  function atualizarFiltro<K extends keyof EstadoFiltros>(
    key: K,
    value: EstadoFiltros[K],
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function limparFiltros() {
    setFilters(filtrosIniciais);
    setShowDateFilters(false);
  }

  function abrirContaDetalhe(documento: DocumentoReceber) {
    navigate(`/financeiro/contas-a-receber/${documento.id}`, {
      state: { returnTo: caminhoListaAtual },
    });
  }

  return (
    <PageLayout>
      <PageHeader
        title="Contas a receber"
        subtitle="Receitas previstas, recebidas e em atraso com base no financeiro real"
      />

      <SummaryMetrics
        ariaLabel="Resumo de contas a receber"
        items={[
          {
            label: "Total a receber (líquido)",
            value: formatarMoeda(resumo.totalAReceber),
          },
          {
            label: "Total recebido (líquido)",
            value: formatarMoeda(resumo.totalRecebido),
            tone: "positive",
          },
          {
            label: "Total em atraso",
            value: formatarMoeda(resumo.totalAtrasado),
            tone: "negative",
          },
          {
            label: "Taxas no período",
            value: formatarMoeda(resumo.totalTaxas),
          },
        ]}
      />

      <CompactFilters
        fields={
          <>
            <CompactFilterField label="Buscar" grow>
              <input
                value={filters.busca}
                placeholder="Paciente, serviço ou descrição"
                onChange={(event) =>
                  atualizarFiltro("busca", event.target.value)
                }
              />
            </CompactFilterField>

            <CompactFilterField label="Situação">
              <select
                value={filters.situacao}
                onChange={(event) =>
                  atualizarFiltro(
                    "situacao",
                    event.target.value as SituacaoContaReceberFiltro,
                  )
                }
              >
                <option value="todos">Todas</option>
                <option value="PREVISTO">Previsto</option>
                <option value="RECEBIDO">Recebido</option>
                <option value="ATRASADO">Atrasado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </CompactFilterField>

            <CompactFilterField label="Forma de pagamento">
              <select
                value={filters.formaPagamentoId}
                onChange={(event) =>
                  atualizarFiltro("formaPagamentoId", event.target.value)
                }
              >
                <option value="">Todas</option>
                {formasPagamento.map((formaPagamento) => (
                  <option
                    key={formaPagamento.id}
                    value={String(formaPagamento.id)}
                  >
                    {formaPagamento.nome}
                  </option>
                ))}
              </select>
            </CompactFilterField>
          </>
        }
        advancedFields={
          <>
            <CompactFilterField label="Recebimento previsto inicial">
              <input
                type="date"
                value={filters.dataPrevistaInicio}
                onChange={(event) =>
                  atualizarFiltro("dataPrevistaInicio", event.target.value)
                }
              />
            </CompactFilterField>

            <CompactFilterField label="Recebimento previsto final">
              <input
                type="date"
                value={filters.dataPrevistaFim}
                onChange={(event) =>
                  atualizarFiltro("dataPrevistaFim", event.target.value)
                }
              />
            </CompactFilterField>
          </>
        }
        advancedVisible={showDateFilters}
        advancedActive={hasDateFilter}
        onToggleAdvanced={() => setShowDateFilters((prev) => !prev)}
        toggleCollapsedLabel="Mais filtros"
        toggleExpandedLabel="Ocultar filtros"
        advancedId="contas-receber-filtros-avancados"
        showClear={hasActiveFilters}
        onClear={limparFiltros}
      />

      {erroCarregamento ? (
        <section className={styles.feedbackCard}>{erroCarregamento}</section>
      ) : null}

      {carregando && documentos.length === 0 ? (
        <CarregamentoCentral />
      ) : (
        <Table
          data={documentos}
          caption="Tabela de contas a receber"
          emptyMessage="Nenhuma conta a receber encontrada para os filtros selecionados."
          onRowClick={(row) => abrirContaDetalhe(row)}
          getRowClassName={() => styles.accountRow}
          getRowAriaLabel={(row) =>
            `Abrir detalhes da conta a receber de ${row.pacienteNome}`
          }
          columns={[
            {
              key: "paciente",
              label: "Paciente",
              render: (row) => (
                <TableTextCell
                  primary={row.pacienteNome}
                  secondary={obterDescricaoSecundaria(row)}
                />
              ),
            },
            {
              key: "forma-pagamento",
              label: "Forma de pagamento",
              render: (row) => {
                const taxaLabel =
                  row.percentualTaxa > 0
                    ? `Taxa ${formatarPercentualTaxa(row.percentualTaxa)}`
                    : "Sem taxa";

                return (
                  <TableTextCell
                    primary={row.formaPagamento}
                    secondary={`${taxaLabel} • ${formatarRecebimento(row)}`}
                  />
                );
              },
            },
            {
              key: "recebimento",
              label: "Recebimento",
              render: (row) => (
                <TableTextCell
                  primary={formatarData(row.dataPrevistaRecebimento)}
                  secondary={obterDicaRecebimento(row)}
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
              label: "Valor líquido",
              align: "right",
              render: (row) => (
                <TableTextCell
                  primary={formatarMoeda(row.valorLiquido)}
                  secondary={obterValorSecundario(row)}
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
          ]}
        />
      )}

      {!carregando && documentos.length > 0 ? (
        <p className={styles.resultInfo}>
          {documentos.length} registro{documentos.length > 1 ? "s" : ""} exibido
          {documentos.length > 1 ? "s" : ""}. Situação atual:{" "}
          {filters.situacao === "todos"
            ? "todas"
            : formatarSituacaoDocumentoReceber(filters.situacao)}
          .
        </p>
      ) : null}
    </PageLayout>
  );
}
