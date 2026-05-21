import { useEffect, useState } from "react";
import { FaArrowDown, FaArrowUp, FaScaleBalanced } from "react-icons/fa6";
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
import { formatarDataSomenteDia } from "../../domain/data-somente-dia";
import {
  filtrosFluxoCaixaSchema,
  type FiltrosFluxoCaixaFormData,
} from "../../schemas/fluxo-caixa.schema";
import {
  fluxoCaixaService,
  formaPagamentoService,
  mapFiltrosFluxoCaixaParaRequest,
  toErrorMessage,
  type FluxoCaixa as DadosFluxoCaixa,
  type FormaPagamento,
  type MovimentacaoFluxoCaixa,
  type OrigemFluxoCaixa,
  type StatusFluxoCaixa,
  type TipoMovimentacaoFluxoCaixa,
} from "../../services/api";
import styles from "./styles.module.css";

const resumoInicial = {
  saldoInicial: 0,
  saldoPeriodo: 0,
  entradasLiquidasPeriodo: 0,
  saidasPeriodo: 0,
  saldoLiquidado: 0,
  atrasadoPeriodo: 0,
};

const filtrosIniciais: FiltrosFluxoCaixaFormData = {
  busca: undefined,
  tipo: "TODOS",
  status: "TODOS",
  dataInicio: "",
  dataFim: "",
  categoria: undefined,
  formaPagamentoId: undefined,
  origemTipo: undefined,
};

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(dataIso?: string | null): string {
  return formatarDataSomenteDia(dataIso);
}

function formatarTipoMovimentacao(tipo: TipoMovimentacaoFluxoCaixa): string {
  return tipo === "ENTRADA" ? "Entrada" : "Saída";
}

function formatarStatus(status: StatusFluxoCaixa): string {
  if (status === "LIQUIDADO") {
    return "Liquidado";
  }

  if (status === "ATRASADO") {
    return "Atrasado";
  }

  return "Pendente";
}

function formatarOrigem(origem: OrigemFluxoCaixa): string {
  return origem === "CONTA_RECEBER" ? "Conta a receber" : "Conta a pagar";
}

function formatarGrupoFinanceiro(grupoFinanceiro?: string): string | undefined {
  if (!grupoFinanceiro) {
    return undefined;
  }

  if (grupoFinanceiro === "Convenio") {
    return "Convênio";
  }

  return grupoFinanceiro;
}

function obterVarianteStatus(status: StatusFluxoCaixa) {
  if (status === "LIQUIDADO") {
    return "success" as const;
  }

  if (status === "ATRASADO") {
    return "danger" as const;
  }

  return "warning" as const;
}

function obterCorSaldo(valor: number): "positive" | "negative" | "default" {
  if (valor > 0) {
    return "positive";
  }

  if (valor < 0) {
    return "negative";
  }

  return "default";
}

function obterResumoValidacaoFiltros(
  filtros: FiltrosFluxoCaixaFormData,
): string | null {
  const validacao = filtrosFluxoCaixaSchema.safeParse(filtros);
  if (validacao.success) {
    return null;
  }

  const erros = validacao.error.flatten().fieldErrors;
  return (
    Object.values(erros).flat().find((mensagem) => Boolean(mensagem)) ||
    "Os filtros informados são inválidos."
  );
}

function obterResumoDatas(movimentacao: MovimentacaoFluxoCaixa): string {
  const detalhes = [`Vencimento ${formatarData(movimentacao.dataVencimento)}`];

  if (movimentacao.dataLiquidacao) {
    detalhes.push(`Liquidação ${formatarData(movimentacao.dataLiquidacao)}`);
  }

  return detalhes.join(" • ");
}

function obterDetalhesMovimentacao(
  movimentacao: MovimentacaoFluxoCaixa,
): string | undefined {
  const detalhes = [
    movimentacao.descricaoSecundaria,
    movimentacao.observacaoResumida,
  ].filter(Boolean);

  return detalhes.length > 0 ? detalhes.join(" • ") : undefined;
}

function obterDetalhesOrigem(
  movimentacao: MovimentacaoFluxoCaixa,
): string | undefined {
  const detalhes = [
    formatarGrupoFinanceiro(movimentacao.grupoFinanceiro),
    movimentacao.formaPagamentoDescricao,
    movimentacao.categoria,
  ].filter(Boolean);

  return detalhes.length > 0 ? detalhes.join(" • ") : undefined;
}

export function FluxoCaixa() {
  const [filtros, setFiltros] =
    useState<FiltrosFluxoCaixaFormData>(filtrosIniciais);
  const [mostrarFiltrosAvancados, setMostrarFiltrosAvancados] = useState(false);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [fluxoCaixa, setFluxoCaixa] = useState<DadosFluxoCaixa | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    async function carregarFormasPagamento() {
      try {
        const resposta = await formaPagamentoService.listar();
        if (ativo) {
          setFormasPagamento(resposta);
        }
      } catch {
        if (ativo) {
          setFormasPagamento([]);
        }
      }
    }

    void carregarFormasPagamento();

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    let ativo = true;

    async function carregarFluxoCaixa() {
      const mensagemValidacao = obterResumoValidacaoFiltros(filtros);
      if (mensagemValidacao) {
        if (ativo) {
          setFluxoCaixa(null);
          setErro(mensagemValidacao);
          setCarregando(false);
        }
        return;
      }

      try {
        setCarregando(true);
        setErro(null);

        const resposta = await fluxoCaixaService.consultar(
          mapFiltrosFluxoCaixaParaRequest(
            filtrosFluxoCaixaSchema.parse(filtros),
          ),
        );

        if (!ativo) {
          return;
        }

        setFluxoCaixa(resposta);
      } catch (error) {
        if (!ativo) {
          return;
        }

        setFluxoCaixa(null);
        setErro(
          toErrorMessage(error, "Não foi possível carregar o fluxo de caixa."),
        );
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    void carregarFluxoCaixa();

    return () => {
      ativo = false;
    };
  }, [filtros]);

  const resumo = fluxoCaixa?.resumo ?? resumoInicial;
  const movimentacoes = fluxoCaixa?.movimentacoes ?? [];
  const temFiltroPeriodo = Boolean(filtros.dataInicio || filtros.dataFim);
  const temFiltrosAvancadosAtivos =
    temFiltroPeriodo ||
    Boolean(filtros.categoria?.trim()) ||
    filtros.formaPagamentoId !== undefined ||
    filtros.origemTipo !== undefined;
  const temFiltrosAtivos =
    Boolean(filtros.busca?.trim()) ||
    filtros.tipo !== "TODOS" ||
    filtros.status !== "TODOS" ||
    temFiltrosAvancadosAtivos;

  function atualizarFiltro<K extends keyof FiltrosFluxoCaixaFormData>(
    campo: K,
    valor: FiltrosFluxoCaixaFormData[K],
  ) {
    setFiltros((anterior) => ({ ...anterior, [campo]: valor }));
  }

  function limparFiltros() {
    setFiltros(filtrosIniciais);
    setMostrarFiltrosAvancados(false);
  }

  return (
    <PageLayout>
      <PageHeader
        title="Fluxo de Caixa"
        subtitle="Movimentações consolidadas de contas a receber e contas a pagar"
      />

      <SummaryMetrics
        ariaLabel="Resumo do fluxo de caixa"
        columns={4}
        items={[
          {
            label: "Saldo inicial",
            value: formatarMoeda(resumo.saldoInicial),
            tone: obterCorSaldo(resumo.saldoInicial),
          },
          {
            label: "Saldo no período",
            value: formatarMoeda(resumo.saldoPeriodo),
            tone: obterCorSaldo(resumo.saldoPeriodo),
            highlight: true,
          },
          {
            label: "Entradas líquidas no período",
            value: formatarMoeda(resumo.entradasLiquidasPeriodo),
            tone: "positive",
          },
          {
            label: "Saídas no período",
            value: formatarMoeda(resumo.saidasPeriodo),
            tone: "negative",
          },
          {
            label: "Saldo liquidado",
            value: formatarMoeda(resumo.saldoLiquidado),
            tone: obterCorSaldo(resumo.saldoLiquidado),
          },
          {
            label: "Atrasado no período",
            value: formatarMoeda(resumo.atrasadoPeriodo),
            tone: resumo.atrasadoPeriodo > 0 ? "negative" : "default",
          },
        ]}
      />

      <CompactFilters
        fields={
          <>
            <CompactFilterField label="Buscar" grow>
              <input
                value={filtros.busca ?? ""}
                placeholder="Descrição, observação ou referência"
                onChange={(event) =>
                  atualizarFiltro("busca", event.target.value || undefined)
                }
              />
            </CompactFilterField>

            <CompactFilterField label="Tipo">
              <select
                value={filtros.tipo}
                onChange={(event) =>
                  atualizarFiltro(
                    "tipo",
                    event.target.value as FiltrosFluxoCaixaFormData["tipo"],
                  )
                }
              >
                <option value="TODOS">Todos</option>
                <option value="ENTRADA">Entrada</option>
                <option value="SAIDA">Saída</option>
              </select>
            </CompactFilterField>

            <CompactFilterField label="Status">
              <select
                value={filtros.status}
                onChange={(event) =>
                  atualizarFiltro(
                    "status",
                    event.target.value as FiltrosFluxoCaixaFormData["status"],
                  )
                }
              >
                <option value="TODOS">Todos</option>
                <option value="LIQUIDADO">Liquidado</option>
                <option value="PENDENTE">Pendente</option>
                <option value="ATRASADO">Atrasado</option>
              </select>
            </CompactFilterField>
          </>
        }
        advancedFields={
          <>
            <CompactFilterField label="Data inicial">
              <input
                type="date"
                value={filtros.dataInicio}
                onChange={(event) =>
                  atualizarFiltro("dataInicio", event.target.value)
                }
              />
            </CompactFilterField>

            <CompactFilterField label="Data final">
              <input
                type="date"
                value={filtros.dataFim}
                onChange={(event) =>
                  atualizarFiltro("dataFim", event.target.value)
                }
              />
            </CompactFilterField>

            <CompactFilterField label="Origem">
              <select
                value={filtros.origemTipo ?? ""}
                onChange={(event) =>
                  atualizarFiltro(
                    "origemTipo",
                    event.target.value
                      ? (event.target.value as FiltrosFluxoCaixaFormData["origemTipo"])
                      : undefined,
                  )
                }
              >
                <option value="">Todas</option>
                <option value="CONTA_RECEBER">Conta a receber</option>
                <option value="CONTA_PAGAR">Conta a pagar</option>
              </select>
            </CompactFilterField>

            <CompactFilterField label="Forma de pagamento">
              <select
                value={filtros.formaPagamentoId?.toString() ?? ""}
                onChange={(event) =>
                  atualizarFiltro(
                    "formaPagamentoId",
                    event.target.value ? Number(event.target.value) : undefined,
                  )
                }
              >
                <option value="">Todas</option>
                {formasPagamento.map((formaPagamento) => (
                  <option
                    key={formaPagamento.id}
                    value={formaPagamento.id.toString()}
                  >
                    {formaPagamento.nome}
                  </option>
                ))}
              </select>
            </CompactFilterField>

            <CompactFilterField label="Categoria">
              <input
                value={filtros.categoria ?? ""}
                placeholder="Categoria financeira"
                onChange={(event) =>
                  atualizarFiltro("categoria", event.target.value || undefined)
                }
              />
            </CompactFilterField>
          </>
        }
        advancedVisible={mostrarFiltrosAvancados}
        advancedActive={temFiltrosAvancadosAtivos}
        onToggleAdvanced={() => setMostrarFiltrosAvancados((anterior) => !anterior)}
        toggleCollapsedLabel="Mais filtros"
        toggleExpandedLabel="Ocultar filtros"
        advancedId="fluxo-caixa-filtros-avancados"
        showClear={temFiltrosAtivos}
        onClear={limparFiltros}
      />

      {erro ? <section className={styles.feedbackCard}>{erro}</section> : null}

      {carregando && movimentacoes.length === 0 ? (
        <CarregamentoCentral />
      ) : (
        <Table
          data={movimentacoes}
          caption="Tabela do fluxo de caixa"
          emptyMessage="Nenhuma movimentação encontrada para os filtros selecionados."
          columns={[
            {
              key: "dataMovimentacao",
              label: "Data",
              render: (row) => (
                <TableTextCell
                  primary={
                    <strong className={styles.dateValue}>
                      {formatarData(row.dataMovimentacao)}
                    </strong>
                  }
                  secondary={obterResumoDatas(row)}
                  primaryTone={row.indicaAtraso ? "danger" : "default"}
                  secondaryTone="muted"
                />
              ),
            },
            {
              key: "descricao",
              label: "Movimentação",
              render: (row) => (
                <TableTextCell
                  primary={row.descricao}
                  secondary={obterDetalhesMovimentacao(row)}
                />
              ),
            },
            {
              key: "origem",
              label: "Origem",
              render: (row) => (
                <TableTextCell
                  primary={formatarOrigem(row.origemTipo)}
                  secondary={obterDetalhesOrigem(row)}
                />
              ),
            },
            {
              key: "tipoMovimentacao",
              label: "Tipo",
              align: "center",
              render: (row) => (
                <StatusBadge
                  label={formatarTipoMovimentacao(row.tipoMovimentacao)}
                  variant={row.tipoMovimentacao === "ENTRADA" ? "info" : "neutral"}
                />
              ),
            },
            {
              key: "valor",
              label: "Valor",
              align: "right",
              render: (row) => (
                <strong
                  className={
                    row.tipoMovimentacao === "ENTRADA"
                      ? styles.valuePositiveStrong
                      : styles.valueNegativeStrong
                  }
                >
                  {row.tipoMovimentacao === "ENTRADA" ? <FaArrowUp /> : <FaArrowDown />}
                  <span>{formatarMoeda(row.valor)}</span>
                </strong>
              ),
            },
            {
              key: "status",
              label: "Status",
              align: "center",
              render: (row) => (
                <StatusBadge
                  label={formatarStatus(row.status)}
                  variant={obterVarianteStatus(row.status)}
                />
              ),
            },
            {
              key: "saldoAcumulado",
              label: "Saldo acumulado",
              align: "right",
              render: (row) => (
                <strong
                  className={
                    row.saldoAcumulado < 0
                      ? styles.runningBalanceNegative
                      : styles.runningBalance
                  }
                >
                  <FaScaleBalanced />
                  <span>{formatarMoeda(row.saldoAcumulado)}</span>
                </strong>
              ),
            },
          ]}
        />
      )}
    </PageLayout>
  );
}



