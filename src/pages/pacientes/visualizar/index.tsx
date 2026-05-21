import { useEffect, useMemo, useState } from "react";
import {
  FaCalendarCheck,
  FaChevronLeft,
  FaClock,
  FaDollarSign,
  FaEdit,
  FaFileMedical,
  FaPhone,
  FaPlay,
  FaUser,
} from "react-icons/fa";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout } from "../../../components/ui/page-layout";
import { CarregamentoCentral } from "../../../components/ui/carregamento-central";
import {
  descreverDistanciaDataSomenteDia,
  formatarDataSomenteDia,
} from "../../../domain/data-somente-dia";
import {
  isAgendamentoStatusOperacional,
  shouldAutoStartConsultaOnOpen,
} from "../../../domain/atendimento-status";
import { resolveReturnTo } from "../../../routes/return-to";
import { parseRouteNumericId } from "../../../schemas/runtime-input.schema";
import {
  agendamentoService,
  consultaService,
  documentoReceberService,
  pacienteService,
  toErrorMessage,
  type Agendamento,
  type DocumentoReceber,
  type Paciente,
  type ProntuarioHistoricoItem,
} from "../../../services/api";
import {
  criarErroPacienteInvalido,
  resolverErroCarregamentoPaciente,
  type EstadoErroCarregamentoPaciente,
} from "../utils/erro-carregamento-paciente";
import styles from "./styles.module.css";

type FinanceiroPacienteResumo = {
  totalRecebido: number;
  totalPendente: number;
  totalAtrasado: number;
  consultasRecebidas: number;
  pendencias: number;
  ultimoRecebimento?: string;
};

const STATUS_OPERACIONAL_PRIORIDADE: Record<
  "EM_ATENDIMENTO" | "CONFIRMADO" | "AGUARDANDO",
  number
> = {
  EM_ATENDIMENTO: 0,
  CONFIRMADO: 1,
  AGUARDANDO: 2,
};

const resumoFinanceiroInicial: FinanceiroPacienteResumo = {
  totalRecebido: 0,
  totalPendente: 0,
  totalAtrasado: 0,
  consultasRecebidas: 0,
  pendencias: 0,
};

function formatDateBr(value?: string): string {
  return formatarDataSomenteDia(value);
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatRelativePastLabel(isoDate?: string, emptyLabel = "-"): string {
  return descreverDistanciaDataSomenteDia(isoDate, emptyLabel);
}

function formatProximoAgendamentoLabel(
  agendamento?: Pick<Agendamento, "data" | "horario"> | null,
): string {
  if (!agendamento) {
    return "Sem agendamento em aberto";
  }

  return `${formatDateBr(agendamento.data)} às ${agendamento.horario}`;
}

function formatStatusPaciente(ativo: boolean): string {
  return ativo ? "Ativo" : "Inativo";
}

function formatSexo(sexo?: Paciente["sexo"]): string {
  if (!sexo) {
    return "Não informado";
  }

  if (sexo === "MASCULINO") {
    return "Masculino";
  }

  if (sexo === "FEMININO") {
    return "Feminino";
  }

  return "Outro";
}

function compareDateTimeAsc(
  firstDate: string,
  firstTime: string,
  secondDate: string,
  secondTime: string,
): number {
  if (firstDate !== secondDate) {
    return firstDate.localeCompare(secondDate);
  }

  return firstTime.localeCompare(secondTime);
}

function sortHistoricoDesc(
  first: ProntuarioHistoricoItem,
  second: ProntuarioHistoricoItem,
): number {
  return compareDateTimeAsc(
    second.dataConsulta,
    second.horaConsulta,
    first.dataConsulta,
    first.horaConsulta,
  );
}

function sortAgendamentoOperacional(
  first: Agendamento,
  second: Agendamento,
): number {
  const firstPriority =
    STATUS_OPERACIONAL_PRIORIDADE[
      first.status as keyof typeof STATUS_OPERACIONAL_PRIORIDADE
    ] ?? 99;
  const secondPriority =
    STATUS_OPERACIONAL_PRIORIDADE[
      second.status as keyof typeof STATUS_OPERACIONAL_PRIORIDADE
    ] ?? 99;

  if (firstPriority !== secondPriority) {
    return firstPriority - secondPriority;
  }

  return compareDateTimeAsc(
    first.data,
    first.horario,
    second.data,
    second.horario,
  );
}

export function VisualizarPaciente() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = resolveReturnTo(location, "/pacientes");
  const { id } = useParams();
  const pacienteId = parseRouteNumericId(id);
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [historico, setHistorico] = useState<ProntuarioHistoricoItem[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loadingPaciente, setLoadingPaciente] = useState(true);
  const [erroPaciente, setErroPaciente] =
    useState<EstadoErroCarregamentoPaciente | null>(null);
  const [historicoErro, setHistoricoErro] = useState<string | null>(null);
  const [agendaErro, setAgendaErro] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [financeiro, setFinanceiro] = useState<FinanceiroPacienteResumo>(
    resumoFinanceiroInicial,
  );
  const [financeiroErro, setFinanceiroErro] = useState<string | null>(null);

  useEffect(() => {
    if (!pacienteId) {
      setPaciente(null);
      setLoadingPaciente(false);
      setErroPaciente(criarErroPacienteInvalido());
      return;
    }

    const identificadorPaciente = pacienteId;
    let active = true;

    async function carregarPaciente() {
      try {
        setLoadingPaciente(true);
        setErroPaciente(null);
        const response = await pacienteService.buscarPorId(
          identificadorPaciente,
        );

        if (!active) {
          return;
        }

        setPaciente(response);
      } catch (error) {
        if (!active) {
          return;
        }

        setPaciente(null);
        setErroPaciente(
          resolverErroCarregamentoPaciente(
            error,
            "Não foi possível carregar o paciente.",
          ),
        );
      } finally {
        if (active) {
          setLoadingPaciente(false);
        }
      }
    }

    void carregarPaciente();

    return () => {
      active = false;
    };
  }, [pacienteId]);

  useEffect(() => {
    if (!pacienteId) {
      return;
    }

    const safePacienteId = pacienteId;
    let active = true;

    async function carregarHistorico() {
      try {
        setHistoricoErro(null);
        const response =
          await consultaService.listarProntuariosPaciente(safePacienteId);

        if (!active) {
          return;
        }

        setHistorico(response.prontuarios);
      } catch (error) {
        if (!active) {
          return;
        }

        setHistorico([]);
        setHistoricoErro(
          toErrorMessage(
            error,
            "Não foi possível carregar o histórico de prontuários.",
          ),
        );
      }
    }

    void carregarHistorico();

    return () => {
      active = false;
    };
  }, [pacienteId]);

  useEffect(() => {
    if (!pacienteId) {
      return;
    }

    const safePacienteId = pacienteId;
    let active = true;

    async function carregarAgendamentos() {
      try {
        setAgendaErro(null);
        const response = await agendamentoService.listar({
          page: 1,
          limit: 100,
          pacienteId: safePacienteId,
        });

        if (!active) {
          return;
        }

        setAgendamentos(response.items);
      } catch (error) {
        if (!active) {
          return;
        }

        setAgendamentos([]);
        setAgendaErro(
          toErrorMessage(
            error,
            "Não foi possível carregar os agendamentos do paciente.",
          ),
        );
      }
    }

    void carregarAgendamentos();

    return () => {
      active = false;
    };
  }, [pacienteId]);

  useEffect(() => {
    if (!pacienteId) {
      return;
    }

    const safePacienteId = pacienteId;
    let active = true;

    async function carregarFinanceiro(documentosReceber: DocumentoReceber[]) {
      const resumo = documentosReceber.reduce<FinanceiroPacienteResumo>(
        (acc, conta) => {
          if (conta.status === "RECEBIDO") {
            acc.totalRecebido += conta.valorLiquido;
            acc.consultasRecebidas += 1;
            const dataReferenciaRecebimento =
              conta.dataRecebimento || conta.dataPrevistaRecebimento;

            if (
              !acc.ultimoRecebimento ||
              dataReferenciaRecebimento > acc.ultimoRecebimento
            ) {
              acc.ultimoRecebimento = dataReferenciaRecebimento;
            }

            return acc;
          }

          if (conta.status === "PREVISTO") {
            acc.totalPendente += conta.valorLiquido;
            acc.pendencias += 1;

            if (conta.situacao === "ATRASADO") {
              acc.totalAtrasado += conta.valorLiquido;
            }
          }

          return acc;
        },
        { ...resumoFinanceiroInicial },
      );

      if (active) {
        setFinanceiro(resumo);
      }
    }

    async function carregarResumoFinanceiro() {
      try {
        setFinanceiroErro(null);
        const response = await documentoReceberService.listar({
          page: 1,
          limit: 100,
          pacienteId: safePacienteId,
        });

        if (!active) {
          return;
        }

        await carregarFinanceiro(response.items);
      } catch (error) {
        if (!active) {
          return;
        }

        setFinanceiro(resumoFinanceiroInicial);
        setFinanceiroErro(
          toErrorMessage(
            error,
            "Não foi possível carregar o resumo financeiro.",
          ),
        );
      }
    }

    void carregarResumoFinanceiro();

    return () => {
      active = false;
    };
  }, [pacienteId]);

  const historicoOrdenado = useMemo(
    () => historico.slice().sort(sortHistoricoDesc),
    [historico],
  );
  const prontuariosRecentes = historicoOrdenado.slice(0, 3);
  const ultimoAtendimento = historicoOrdenado[0]?.dataConsulta;
  const proximoAgendamentoOperacional = useMemo(
    () =>
      agendamentos
        .filter((agendamento) =>
          isAgendamentoStatusOperacional(agendamento.status),
        )
        .slice()
        .sort(sortAgendamentoOperacional)[0] ?? null,
    [agendamentos],
  );

  if (loadingPaciente) {
    return (
      <PageLayout>
        <CarregamentoCentral />
      </PageLayout>
    );
  }

  if (!paciente || erroPaciente) {
    const estadoErro = erroPaciente ?? {
      titulo: "Paciente não encontrado",
      descricao: "Verifique se o paciente existe e tente novamente.",
    };

    return (
      <PageLayout>
        <div className={styles.notFoundCard}>
          <h2>{estadoErro.titulo}</h2>
          <p>{estadoErro.descricao}</p>
          <button type="button" onClick={() => navigate(returnTo)}>
            Voltar para pacientes
          </button>
        </div>
      </PageLayout>
    );
  }

  const pacienteAtual = paciente;
  const nestedReturnTo =
    returnTo === "/pacientes" ? `/pacientes/${pacienteAtual.id}` : returnTo;
  const contato = pacienteAtual.pessoa.contato;
  const endereco = pacienteAtual.pessoa.endereco;
  const cidade = pacienteAtual.pessoa.cidade;
  const statusPaciente = formatStatusPaciente(pacienteAtual.ativo);

  async function handleNovoAtendimento() {
    setActionError(null);

    if (!proximoAgendamentoOperacional) {
      navigate("/agenda", {
        state: {
          returnTo: nestedReturnTo,
          openWalkInModal: true,
          prefillPaciente: pacienteAtual.nome,
        },
      });
      return;
    }

    try {
      let agendamentoAtual = proximoAgendamentoOperacional;

      if (shouldAutoStartConsultaOnOpen(agendamentoAtual.status)) {
        agendamentoAtual = await agendamentoService.atualizarStatus(
          agendamentoAtual.id,
          { status: "EM_ATENDIMENTO" },
        );

        setAgendamentos((current) =>
          current.map((item) =>
            item.id === agendamentoAtual.id ? agendamentoAtual : item,
          ),
        );
      }

      navigate(`/consultas/${agendamentoAtual.id}`, {
        state: { returnTo: nestedReturnTo },
      });
    } catch (error) {
      setActionError(
        toErrorMessage(
          error,
          "Não foi possível iniciar o atendimento deste paciente.",
        ),
      );
    }
  }

  function handleAgendarConsulta() {
    navigate("/agenda", {
      state: {
        returnTo: nestedReturnTo,
        openCreateModal: true,
        prefillPaciente: pacienteAtual.nome,
      },
    });
  }

  return (
    <PageLayout>
      <PageHeader
        title="Paciente"
        left={
          <div className={styles.titleWithBack}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => navigate(returnTo)}
              aria-label="Voltar para pacientes"
            >
              <FaChevronLeft />
            </button>
            <div>
              <h1 className={styles.pageTitle}>{pacienteAtual.nome}</h1>
              <p className={styles.pageSubtitle}>
                CPF {pacienteAtual.cpf || "não informado"} • {statusPaciente}
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
                navigate(`/pacientes/${pacienteAtual.id}/editar`, {
                  state: { returnTo: nestedReturnTo },
                })
              }
            >
              <FaEdit />
              <span>Editar</span>
            </button>
          </div>
        }
      />

      <section
        className={styles.quickActions}
        aria-label="Ações rápidas do paciente"
      >
        <button
          type="button"
          className={styles.quickPrimary}
          onClick={handleNovoAtendimento}
        >
          <FaPlay />
          <span>Novo atendimento</span>
        </button>
        <button
          type="button"
          className={styles.quickSecondary}
          onClick={handleAgendarConsulta}
        >
          <FaCalendarCheck />
          <span>Agendar consulta</span>
        </button>
        <button
          type="button"
          className={styles.quickSecondary}
          onClick={() =>
            navigate(`/pacientes/${pacienteAtual.id}/prontuarios`, {
              state: { returnTo: nestedReturnTo },
            })
          }
        >
          <FaFileMedical />
          <span>Ver prontuários</span>
        </button>
        <button
          type="button"
          className={styles.quickSecondary}
          onClick={() =>
            navigate("/financeiro/contas-a-receber", {
              state: {
                returnTo: nestedReturnTo,
                prefillPaciente: pacienteAtual.nome,
              },
            })
          }
        >
          <FaDollarSign />
          <span>Ver financeiro</span>
        </button>
      </section>

      {actionError ? <p className={styles.notesText}>{actionError}</p> : null}

      <section
        className={styles.contextRow}
        aria-label="Contexto rápido do paciente"
      >
        <span className={styles.contextChip}>
          Cadastro {statusPaciente.toLowerCase()}
        </span>
        <span className={styles.contextChip}>
          Último atendimento{" "}
          {formatRelativePastLabel(ultimoAtendimento, "sem registro")}
        </span>
        <span className={styles.contextChip}>
          Próximo agendamento{" "}
          {formatProximoAgendamentoLabel(proximoAgendamentoOperacional)}
        </span>
      </section>

      {agendaErro ? <p className={styles.notesText}>{agendaErro}</p> : null}

      <section className={styles.kpiGrid}>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Status</span>
          <strong
            className={`${styles.statusBadge} ${
              pacienteAtual.ativo
                ? styles.statusBadgeAtivo
                : styles.statusBadgeInativo
            }`}
          >
            {statusPaciente}
          </strong>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total de prontuários</span>
          <strong className={styles.kpiValue}>
            {historicoOrdenado.length}
          </strong>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Último atendimento</span>
          <strong className={styles.kpiValue}>
            {formatDateBr(ultimoAtendimento)}
          </strong>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Próximo agendamento</span>
          <strong className={styles.kpiValue}>
            {proximoAgendamentoOperacional
              ? `${formatDateBr(proximoAgendamentoOperacional.data)} às ${proximoAgendamentoOperacional.horario}`
              : "Não há"}
          </strong>
        </article>
      </section>

      <section
        className={styles.financeGrid}
        aria-label="Resumo financeiro do paciente"
      >
        {financeiroErro ? (
          <p className={styles.notesText}>{financeiroErro}</p>
        ) : null}

        <article className={styles.financeCard}>
          <span className={styles.financeLabel}>Total recebido</span>
          <strong className={styles.financeValue}>
            {formatCurrency(financeiro.totalRecebido)}
          </strong>
          <span className={styles.financeMeta}>
            {financeiro.consultasRecebidas} consulta(s) recebida(s)
          </span>
        </article>

        <article className={styles.financeCard}>
          <span className={styles.financeLabel}>Total pendente</span>
          <strong className={styles.financeValue}>
            {formatCurrency(financeiro.totalPendente)}
          </strong>
          <span className={styles.financeMeta}>
            {financeiro.pendencias} pendência(s) em aberto
          </span>
        </article>

        <article className={styles.financeCard}>
          <span className={styles.financeLabel}>Total atrasado</span>
          <strong className={styles.financeValueDanger}>
            {formatCurrency(financeiro.totalAtrasado)}
          </strong>
          <span className={styles.financeMeta}>
            Acompanhar pendências vencidas
          </span>
        </article>

        <article className={styles.financeCard}>
          <span className={styles.financeLabel}>Último recebimento</span>
          <strong className={styles.financeValue}>
            {formatDateBr(financeiro.ultimoRecebimento)}
          </strong>
          <span className={styles.financeMeta}>
            Baseado nas consultas realizadas
          </span>
        </article>
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>
            <FaUser className={styles.sectionIcon} />
            Dados principais
          </h2>
          <div className={styles.infoGrid}>
            <div>
              <span className={styles.infoLabel}>Nascimento</span>
              <p className={styles.infoValue}>
                {formatDateBr(pacienteAtual.dataNascimento)}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>Sexo</span>
              <p className={styles.infoValue}>
                {formatSexo(pacienteAtual.sexo)}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>Gênero</span>
              <p className={styles.infoValue}>
                {pacienteAtual.genero || "Não informado"}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>Nome da mãe</span>
              <p className={styles.infoValue}>
                {pacienteAtual.nomeMae || "Não informado"}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>Convênio</span>
              <p className={styles.infoValue}>
                {pacienteAtual.convenio || "Não informado"}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>Carteirinha</span>
              <p className={styles.infoValue}>
                {pacienteAtual.numeroCarteirinha || "Não informada"}
              </p>
            </div>
          </div>
        </section>

        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>
            <FaPhone className={styles.sectionIcon} />
            Contato
          </h2>
          <div className={styles.infoGrid}>
            <div>
              <span className={styles.infoLabel}>Telefone</span>
              <p className={styles.infoValue}>
                {contato.telefone || "Não informado"}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>WhatsApp</span>
              <p className={styles.infoValue}>
                {contato.whatsapp || "Não informado"}
              </p>
            </div>
            <div className={styles.colFull}>
              <span className={styles.infoLabel}>E-mail</span>
              <p className={styles.infoValue}>
                {contato.email || "Não informado"}
              </p>
            </div>
          </div>
        </section>

        <section className={`${styles.sectionCard} ${styles.colSpan2}`}>
          <h2 className={styles.sectionTitle}>Endereço</h2>
          <div className={styles.infoGrid}>
            <div>
              <span className={styles.infoLabel}>CEP</span>
              <p className={styles.infoValue}>{endereco?.cep || "-"}</p>
            </div>
            <div className={styles.colSpan2}>
              <span className={styles.infoLabel}>Logradouro</span>
              <p className={styles.infoValue}>{endereco?.logradouro || "-"}</p>
            </div>
            <div>
              <span className={styles.infoLabel}>Número</span>
              <p className={styles.infoValue}>{endereco?.numero ?? "-"}</p>
            </div>
            <div>
              <span className={styles.infoLabel}>Complemento</span>
              <p className={styles.infoValue}>{endereco?.complemento || "-"}</p>
            </div>
            <div>
              <span className={styles.infoLabel}>Bairro</span>
              <p className={styles.infoValue}>{endereco?.bairro || "-"}</p>
            </div>
            <div>
              <span className={styles.infoLabel}>Cidade</span>
              <p className={styles.infoValue}>{cidade?.nome || "-"}</p>
            </div>
          </div>
        </section>

        <section className={`${styles.sectionCard} ${styles.colSpan2}`}>
          <h2 className={styles.sectionTitle}>Dados do cadastro</h2>
          <div className={styles.infoGrid}>
            <div>
              <span className={styles.infoLabel}>Nome cadastrado</span>
              <p className={styles.infoValue}>{pacienteAtual.pessoa.nome}</p>
            </div>
            <div>
              <span className={styles.infoLabel}>Status do cadastro</span>
              <p className={styles.infoValue}>{statusPaciente}</p>
            </div>
            <div>
              <span className={styles.infoLabel}>CPF</span>
              <p className={styles.infoValue}>
                {pacienteAtual.cpf || "Não informado"}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>Cidade vinculada</span>
              <p className={styles.infoValue}>
                {cidade?.nome || "Não informada"}
              </p>
            </div>
          </div>
        </section>

        <section className={`${styles.sectionCard} ${styles.colSpan2}`}>
          <div className={styles.sectionHeaderWithAction}>
            <h2 className={styles.sectionTitle}>
              Histórico resumido de prontuários
            </h2>
            <button
              type="button"
              className={styles.linkAction}
              onClick={() =>
                navigate(`/pacientes/${pacienteAtual.id}/prontuarios`, {
                  state: { returnTo: nestedReturnTo },
                })
              }
            >
              Ver histórico completo
            </button>
          </div>

          {historicoErro ? (
            <p className={styles.notesText}>{historicoErro}</p>
          ) : prontuariosRecentes.length === 0 ? (
            <p className={styles.notesText}>
              Este paciente ainda não possui prontuários.
            </p>
          ) : (
            <div className={styles.timelineList}>
              {prontuariosRecentes.map((prontuario) => (
                <article key={prontuario.id} className={styles.timelineItem}>
                  <div className={styles.timelineMeta}>
                    <span>{formatDateBr(prontuario.dataConsulta)}</span>
                    <span>{prontuario.horaConsulta}</span>
                  </div>
                  <strong>{prontuario.profissionalNome}</strong>
                  <p>{prontuario.resumo || prontuario.servicoNome}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <button
        type="button"
        className={styles.floatingAction}
        onClick={() =>
          navigate(`/pacientes/${pacienteAtual.id}/prontuarios`, {
            state: { returnTo: nestedReturnTo },
          })
        }
      >
        <FaClock />
        <span>Histórico</span>
      </button>
    </PageLayout>
  );
}
