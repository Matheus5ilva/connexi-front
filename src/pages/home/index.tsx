import { useEffect, useState } from "react";
import { FaClock, FaEye, FaFileMedicalAlt, FaUserClock } from "react-icons/fa";
import {
  FaArrowTrendDown,
  FaArrowTrendUp,
  FaScaleBalanced,
} from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { useSessaoAutenticada } from "../../auth/use-auth-session";
import { CarregamentoCentral } from "../../components/ui/carregamento-central";
import { Card } from "../../components/ui/card";
import { PageHeader } from "../../components/ui/page-header";
import { PageLayout } from "../../components/ui/page-layout";
import { StatusBadge } from "../../components/ui/status-badge";
import { Table } from "../../components/ui/table";
import { TableActionButton } from "../../components/ui/table-action-button";
import {
  getAgendaStatusUi,
  shouldAutoStartConsultaOnOpen,
} from "../../domain/atendimento-status";
import {
  agendamentoService,
  consultorioService,
  mapStatusAgendamentoParaAtualizarRequest,
  painelService,
  toErrorMessage,
  type Consultorio,
  type ItemFilaAtendimentoPainel,
  type OperacaoDeHojePainel,
  type Painel,
  type ProximaConsultaPainel,
  type ResumoFinanceiroPainel,
  type StatusAgendamento,
} from "../../services/api";
import styles from "./styles.module.css";

const TEXTO_INDISPONIVEL = "-";
const TITULO_CONSULTORIO_PADRAO = "Consultório";
const SUBTITULO_PADRAO = "Bem-vindo";

function formatarMoeda(valor?: number): string {
  if (valor === undefined) {
    return TEXTO_INDISPONIVEL;
  }

  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarNumero(valor?: number): string {
  return valor === undefined ? TEXTO_INDISPONIVEL : String(valor);
}

function formatarMesReferencia(resumo?: ResumoFinanceiroPainel): string {
  if (!resumo) {
    return TEXTO_INDISPONIVEL;
  }

  const dataReferencia = new Date(
    resumo.anoReferencia,
    resumo.mesReferencia - 1,
    1,
  );

  return dataReferencia.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function obterCorSaldo(valor?: number): string {
  if (valor === undefined || valor >= 0) {
    return "var(--color-brand-dark)";
  }

  return "#b42318";
}

function obterFundoSaldo(valor?: number): string {
  if (valor === undefined || valor >= 0) {
    return "var(--color-brand-soft)";
  }

  return "var(--color-danger-soft)";
}

function obterSubtituloSaldo(valor?: number): string {
  if (valor === undefined) {
    return "Aguardando dados do painel";
  }

  return valor >= 0
    ? "Entradas maiores ou iguais às saídas"
    : "Saídas maiores que as entradas";
}

function obterVarianteStatusAgendamento(status: StatusAgendamento) {
  if (status === "CONFIRMADO") {
    return "success" as const;
  }

  if (status === "CANCELADO" || status === "FALTOU") {
    return "danger" as const;
  }

  if (status === "REALIZADO") {
    return "info" as const;
  }

  if (status === "EM_ATENDIMENTO") {
    return "neutral" as const;
  }

  return "warning" as const;
}

function montarSubtituloProximaConsulta(
  proximaConsulta?: ProximaConsultaPainel | null,
): string {
  if (!proximaConsulta) {
    return "Não há consultas pendentes para hoje";
  }

  const status = getAgendaStatusUi(proximaConsulta.status).label;
  return `${proximaConsulta.nomePaciente} - ${proximaConsulta.nomeServico} - ${status}`;
}

function obterNomeConsultorio(consultorio: Consultorio | null): string {
  const nome =
    consultorio?.pessoa.nome.trim() || consultorio?.razaoSocial?.trim() || "";

  return nome || TITULO_CONSULTORIO_PADRAO;
}

async function buscarNomeConsultorioAtual(): Promise<string> {
  const consultorio = await consultorioService.buscarPrincipal();
  return obterNomeConsultorio(consultorio);
}

function montarSubtituloBoasVindas(nome?: string): string {
  const nomeNormalizado = nome?.trim();

  return nomeNormalizado
    ? `${SUBTITULO_PADRAO}, ${nomeNormalizado}`
    : SUBTITULO_PADRAO;
}

type SecaoResumoFinanceiroProps = {
  resumo?: ResumoFinanceiroPainel;
  erro: string | null;
};

function SecaoResumoFinanceiro({ resumo, erro }: SecaoResumoFinanceiroProps) {
  return (
    <section
      className={styles.sectionBlock}
      aria-labelledby="resumo-mensal-title"
    >
      <div className={styles.sectionHeader}>
        <h2 id="resumo-mensal-title" className={styles.sectionTitle}>
          Resumo financeiro do mês
        </h2>
        <p className={styles.sectionSubtitle}>
          Referência: {formatarMesReferencia(resumo)}
        </p>
      </div>

      {erro ? <p className={styles.feedbackCard}>{erro}</p> : null}

      <div className={styles.cardsGridFinance}>
        <Card
          title="Entradas"
          value={formatarMoeda(resumo?.entradas)}
          subtitle="Receitas do mês de referência"
          icon={<FaArrowTrendUp />}
          iconColor="var(--color-success)"
          iconBg="var(--color-success-soft)"
        />
        <Card
          title="Saídas"
          value={formatarMoeda(resumo?.saidas)}
          subtitle="Despesas do mês de referência"
          icon={<FaArrowTrendDown />}
          iconColor="var(--color-danger)"
          iconBg="var(--color-danger-soft)"
        />
        <Card
          title="Saldo do mês"
          value={formatarMoeda(resumo?.saldoDoMes)}
          subtitle={obterSubtituloSaldo(resumo?.saldoDoMes)}
          icon={<FaScaleBalanced />}
          iconColor={obterCorSaldo(resumo?.saldoDoMes)}
          iconBg={obterFundoSaldo(resumo?.saldoDoMes)}
        />
        <Card
          title="Saldo atual"
          value={formatarMoeda(resumo?.saldoAtual)}
          subtitle="Valor realizado até o momento"
          icon={<FaClock />}
          iconColor={obterCorSaldo(resumo?.saldoAtual)}
          iconBg={obterFundoSaldo(resumo?.saldoAtual)}
        />
      </div>
    </section>
  );
}

type SecaoOperacaoHojeProps = {
  operacao?: OperacaoDeHojePainel;
  onAbrirAgenda: () => void;
};

function SecaoOperacaoHoje({
  operacao,
  onAbrirAgenda,
}: SecaoOperacaoHojeProps) {
  const proximaConsulta = operacao?.proximaConsulta;

  return (
    <section
      className={styles.sectionBlock}
      aria-labelledby="resumo-hoje-title"
    >
      <div className={styles.sectionHeader}>
        <h2 id="resumo-hoje-title" className={styles.sectionTitle}>
          Operação de hoje
        </h2>
      </div>

      <div className={styles.cardsGridDay}>
        <Card
          title="Consultas hoje"
          value={formatarNumero(operacao?.consultasHoje)}
          subtitle="Agendamentos do dia"
          icon={<FaUserClock />}
          iconColor="var(--color-brand-dark)"
          iconBg="var(--color-brand-soft)"
        />
        <Card
          title="Pendentes"
          value={formatarNumero(operacao?.pendentes)}
          subtitle="Consultas aguardando atendimento"
          icon={<FaClock />}
          iconColor="#d97706"
          iconBg="var(--color-warning-soft)"
        />
        <Card
          title="Em atendimento"
          value={formatarNumero(operacao?.emAtendimento)}
          subtitle="Consultas em andamento"
          icon={<FaFileMedicalAlt />}
          iconColor="#0f766e"
          iconBg="#ecfeff"
        />

        <button
          type="button"
          className={styles.nextCardButton}
          onClick={onAbrirAgenda}
          aria-label="Abrir agenda de hoje"
          title="Abrir agenda"
        >
          <Card
            title="Próxima consulta"
            value={proximaConsulta?.horario ?? "Sem pendências"}
            subtitle={montarSubtituloProximaConsulta(proximaConsulta)}
            icon={<FaFileMedicalAlt />}
            iconColor={proximaConsulta ? "#0f766e" : "var(--color-brand-hover)"}
            iconBg={proximaConsulta ? "#ecfeff" : "var(--color-brand-soft)"}
          />
        </button>
      </div>
    </section>
  );
}

type TabelaFilaAtendimentoProps = {
  fila: ItemFilaAtendimentoPainel[];
  onAbrirAgenda: () => void;
  onAbrirAtendimento: (item: ItemFilaAtendimentoPainel) => void;
};

function TabelaFilaAtendimento({
  fila,
  onAbrirAgenda,
}: TabelaFilaAtendimentoProps) {
  return (
    <section
      className={styles.tableSection}
      aria-labelledby="fila-atendimento-title"
    >
      <div className={styles.tableHeader}>
        <h2 id="fila-atendimento-title" className={styles.tableTitle}>
          Fila de atendimento de hoje
        </h2>
        <button
          type="button"
          className={styles.tableHeaderAction}
          onClick={onAbrirAgenda}
        >
          Ver agenda completa
        </button>
      </div>

      <Table
        data={fila}
        caption="Fila de atendimento do dia"
        emptyMessage="Nenhum atendimento encontrado para hoje."
        columns={[
          { key: "horario", label: "Horário" },
          { key: "nomePaciente", label: "Paciente" },
          { key: "nomeServico", label: "Serviço" },
          {
            key: "status",
            label: "Status",
            align: "center",
            render: (row) => (
              <StatusBadge
                label={getAgendaStatusUi(row.status).label}
                variant={obterVarianteStatusAgendamento(row.status)}
              />
            ),
          },
          {
            key: "acoes",
            label: "Ações",
            align: "right",
            render: (row) => (
              <div className={styles.actionButtons}>
                <TableActionButton
                  icon={<FaEye color="var(--color-brand-dark)" />}
                  label={`Visualizar agenda de ${row.nomePaciente}`}
                  title="Ver na agenda"
                  onClick={onAbrirAgenda}
                />
              </div>
            ),
          },
        ]}
      />
    </section>
  );
}

export function Home() {
  const navigate = useNavigate();
  const { user } = useSessaoAutenticada();
  const [painel, setPainel] = useState<Painel | null>(null);
  const [nomeConsultorio, setNomeConsultorio] = useState(
    TITULO_CONSULTORIO_PADRAO,
  );
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    async function carregarPainel() {
      try {
        setCarregando(true);
        setErro(null);

        const [respostaPainel, nomeConsultorioAtual] = await Promise.all([
          painelService.consultar(),
          buscarNomeConsultorioAtual(),
        ]);

        if (ativo) {
          setPainel(respostaPainel);
          setNomeConsultorio(nomeConsultorioAtual);
        }
      } catch (error) {
        if (ativo) {
          setPainel(null);
          setErro(toErrorMessage(error, "Não foi possível carregar o painel."));
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    void carregarPainel();

    return () => {
      ativo = false;
    };
  }, []);

  function abrirAgenda() {
    navigate("/agenda");
  }

  if (carregando && !erro) {
    return (
      <PageLayout>
        <CarregamentoCentral />
      </PageLayout>
    );
  }

  async function abrirAtendimento(item: ItemFilaAtendimentoPainel) {
    try {
      if (shouldAutoStartConsultaOnOpen(item.status)) {
        await agendamentoService.atualizarStatus(
          item.id,
          mapStatusAgendamentoParaAtualizarRequest("EM_ATENDIMENTO"),
        );
      }

      navigate(`/consultas/${item.id}`, {
        state: { returnTo: "/" },
      });
    } catch (error) {
      setErro(
        toErrorMessage(
          error,
          "Não foi possível abrir o atendimento selecionado.",
        ),
      );
    }
  }

  return (
    <PageLayout>
      <PageHeader
        title={nomeConsultorio}
        subtitle={montarSubtituloBoasVindas(user?.nome)}
      />

      <SecaoResumoFinanceiro resumo={painel?.resumoFinanceiro} erro={erro} />

      <SecaoOperacaoHoje
        operacao={painel?.operacaoDeHoje}
        onAbrirAgenda={abrirAgenda}
      />

      <TabelaFilaAtendimento
        fila={painel?.filaDeAtendimento ?? []}
        onAbrirAgenda={abrirAgenda}
        onAbrirAtendimento={(item) => void abrirAtendimento(item)}
      />
    </PageLayout>
  );
}
