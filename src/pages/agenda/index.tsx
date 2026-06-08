import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaFileMedicalAlt,
  FaPlay,
  FaPlus,
  FaRegCalendarCheck,
  FaTimes,
} from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import {
  obterContextoAcessoUsuarioAutenticado,
} from "../../auth/session";
import { useSessaoAutenticada } from "../../auth/use-auth-session";
import { NotFoundCard } from "../../components/ui/not-found-card";
import { PageHeader } from "../../components/ui/page-header";
import { PageLayout } from "../../components/ui/page-layout";
import { CarregamentoCentral } from "../../components/ui/carregamento-central";
import { Table } from "../../components/ui/table";
import { obterDataSomenteDiaAtual } from "../../domain/data-somente-dia";
import {
  agendamentoService,
  configuracaoService,
  convenioService,
  formaPagamentoService,
  LIMITE_MAXIMO_PAGINACAO,
  mapFormularioAgendamentoParaCriarRequest,
  mapFormularioRemarcacaoParaAtualizarRequest,
  mapStatusAgendamentoParaAtualizarRequest,
  pacienteService,
  servicoService,
  toErrorMessage,
  type Agendamento,
  type AtualizarStatusAgendamentoRequest,
  type Configuracao,
  type ConvenioListaItem,
  type FormaPagamento,
  type PacienteListaItem,
  type ServicoListaItem,
} from "../../services/api";
import type {
  AgendamentoFormularioData,
  RemarcacaoAgendamentoFormularioData,
} from "../../schemas/agendamento.schema";
import { carregarProfissionalPrincipal } from "../profissionais/utils/carregar-profissional-principal";
import {
  ModalConsultaAvulsa,
  ModalNovoAgendamento,
  ModalRemarcarAgendamento,
  ModalVisualizarAgendamento,
} from "./agendamento";
import {
  canTransitionStatusAgendamento,
  formatarTipoAtendimento,
  getStatusAgendamentoUi,
  isAgendamentoEditavel,
  shouldAutoStartConsulta,
} from "./utils/status-agendamento";
import styles from "./styles.module.css";

const agendaPath = "/agenda";

type AgendaLocationState = {
  openCreateModal?: boolean;
  openWalkInModal?: boolean;
  prefillPaciente?: string;
  prefillHorario?: string;
};

type CatalogosAgendamento = {
  pacientes: PacienteListaItem[];
  servicos: ServicoListaItem[];
  convenios: ConvenioListaItem[];
  formasPagamento: FormaPagamento[];
};

function getNowTime(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function toMinutes(horario: string): number {
  const [hour, minute] = horario.split(":").map((value) => Number(value));
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return -1;
  }

  return hour * 60 + minute;
}

function sortAgendamentos(a: Agendamento, b: Agendamento): number {
  if (a.data !== b.data) {
    return a.data.localeCompare(b.data);
  }

  return a.horario.localeCompare(b.horario);
}

function criarDataLocalDaAgenda(dataIso: string): Date | null {
  const [ano, mes, dia] = dataIso.split("-").map(Number);

  if (
    !Number.isInteger(ano) ||
    !Number.isInteger(mes) ||
    !Number.isInteger(dia)
  ) {
    return null;
  }

  return new Date(ano, mes - 1, dia);
}

export function Agenda() {
  const navigate = useNavigate();
  const location = useLocation();
  const sessaoAutenticada = useSessaoAutenticada();
  const navigationState = location.state as AgendaLocationState | null;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [clockNow, setClockNow] = useState(() => new Date());
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [modalRemarcacaoAberto, setModalRemarcacaoAberto] = useState(false);
  const [prefillHorario, setPrefillHorario] = useState<string | undefined>(
    undefined,
  );
  const [prefillPacienteNome, setPrefillPacienteNome] = useState<
    string | undefined
  >(undefined);
  const [catalogos, setCatalogos] = useState<CatalogosAgendamento>({
    pacientes: [],
    servicos: [],
    convenios: [],
    formasPagamento: [],
  });
  const [configuracaoFuncionamento, setConfiguracaoFuncionamento] =
    useState<Configuracao | null>(null);
  const requisicaoAgendamentosAtual = useRef(0);
  const [profissionalOperacionalId, setProfissionalOperacionalId] = useState<
    number | null
  >(null);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);
  const [loadingAgendamentos, setLoadingAgendamentos] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const contextoAcesso = useMemo(
    () => obterContextoAcessoUsuarioAutenticado(sessaoAutenticada),
    [sessaoAutenticada],
  );

  const navigationModalOpen = Boolean(navigationState?.openCreateModal);
  const navigationWalkInModalOpen = Boolean(navigationState?.openWalkInModal);
  const navigationPrefillHorario =
    typeof navigationState?.prefillHorario === "string"
      ? navigationState.prefillHorario
      : undefined;
  const navigationPrefillPaciente =
    typeof navigationState?.prefillPaciente === "string"
      ? navigationState.prefillPaciente
      : undefined;

  const resolvedPrefillHorario = prefillHorario ?? navigationPrefillHorario;
  const resolvedPrefillPacienteNome =
    prefillPacienteNome ?? navigationPrefillPaciente;
  const resolvedWalkInHorario = resolvedPrefillHorario || getNowTime();
  const podeCriarAgendamento = Boolean(profissionalOperacionalId);
  const mensagemProfissionalOperacionalInexistente =
    "Cadastre um profissional ativo para registrar agendamentos e consultas avulsas.";
  const createModalResolvedOpen =
    (createModalOpen || navigationModalOpen) && podeCriarAgendamento;
  const walkInModalResolvedOpen =
    (walkInModalOpen || navigationWalkInModalOpen) && podeCriarAgendamento;

  useEffect(() => {
    if (contextoAcesso.exigeProfissionalVinculado) {
      setProfissionalOperacionalId(contextoAcesso.profissionalId);
      return;
    }

    if (!contextoAcesso.sessaoValidaNoTenantAtual) {
      setProfissionalOperacionalId(null);
    }
  }, [
    contextoAcesso.exigeProfissionalVinculado,
    contextoAcesso.profissionalId,
    contextoAcesso.sessaoValidaNoTenantAtual,
  ]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setClockNow(new Date());
    }, 30000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadCatalogos() {
      setLoadingCatalogos(true);
      setLoadError(null);

      try {
        const [
          profissional,
          pacientesResponse,
          servicos,
          convenios,
          formasPagamento,
          configuracao,
        ] = await Promise.all([
          carregarProfissionalPrincipal(),
          pacienteService.listar({ page: 1, limit: 100, ativo: true }),
          servicoService.listar(),
          convenioService.listar(),
          formaPagamentoService.listar(),
          configuracaoService.buscarPrincipal(),
        ]);

        if (!isMounted) {
          return;
        }

        setProfissionalOperacionalId(profissional ? Number(profissional.id) : null);
        setCatalogos({
          pacientes: pacientesResponse.items,
          servicos: servicos.filter((item) => item.ativo),
          convenios: convenios.filter((item) => item.ativo),
          formasPagamento,
        });
        setConfiguracaoFuncionamento(configuracao);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setLoadError(
          toErrorMessage(
            error,
            "Não foi possível carregar os dados necessários para a agenda.",
          ),
        );
      } finally {
        if (isMounted) {
          setLoadingCatalogos(false);
        }
      }
    }

    void loadCatalogos();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const tentouAbrirFluxoCriacao =
      navigationModalOpen || navigationWalkInModalOpen;

    if (!tentouAbrirFluxoCriacao || podeCriarAgendamento) {
      return;
    }

    setActionError(mensagemProfissionalOperacionalInexistente);
    navigate(location.pathname, { replace: true, state: null });
  }, [
    location.pathname,
    mensagemProfissionalOperacionalInexistente,
    navigate,
    navigationModalOpen,
    navigationWalkInModalOpen,
    podeCriarAgendamento,
  ]);

  const currentDateIso = obterDataSomenteDiaAtual(currentDate);
  const currentNowMinutes = clockNow.getHours() * 60 + clockNow.getMinutes();
  const isCurrentDateToday = currentDateIso === obterDataSomenteDiaAtual(clockNow);

  const carregarAgendamentos = useCallback(async (dataConsulta = currentDateIso) => {
    const numeroRequisicao = requisicaoAgendamentosAtual.current + 1;
    requisicaoAgendamentosAtual.current = numeroRequisicao;
    if (
      contextoAcesso.exigeProfissionalVinculado &&
      !profissionalOperacionalId
    ) {
      setAgendamentos([]);
      setLoadingAgendamentos(false);
      return;
    }

    setLoadingAgendamentos(true);
    setActionError(null);

    try {
      const response = await agendamentoService.listar({
        data: dataConsulta,
        profissionalId: contextoAcesso.possuiAcessoGlobal
          ? undefined
          : (profissionalOperacionalId ?? undefined),
        page: 1,
        limit: LIMITE_MAXIMO_PAGINACAO,
      });

      if (requisicaoAgendamentosAtual.current === numeroRequisicao) {
        setAgendamentos(response.items.slice().sort(sortAgendamentos));
      }
    } catch (error) {
      if (requisicaoAgendamentosAtual.current !== numeroRequisicao) {
        return;
      }

      setActionError(
        toErrorMessage(error, "Não foi possível carregar os agendamentos do dia."),
      );
      setAgendamentos([]);
    } finally {
      if (requisicaoAgendamentosAtual.current === numeroRequisicao) {
        setLoadingAgendamentos(false);
      }
    }
  }, [
    contextoAcesso.exigeProfissionalVinculado,
    contextoAcesso.possuiAcessoGlobal,
    currentDateIso,
    profissionalOperacionalId,
  ]);

  const atualizarAgendaAposAcao = useCallback(
    async (agendamentoAtualizado: Agendamento) => {
      const dataAtualizada = criarDataLocalDaAgenda(agendamentoAtualizado.data);

      if (dataAtualizada) {
        setCurrentDate(dataAtualizada);
      }

      await carregarAgendamentos(agendamentoAtualizado.data);
    },
    [carregarAgendamentos],
  );

  useEffect(() => {
    void carregarAgendamentos();
  }, [carregarAgendamentos]);

  const resumoDia = useMemo(() => {
    return agendamentos.reduce(
      (acc, agendamento) => {
        acc.total += 1;

        if (agendamento.status === "AGUARDANDO") {
          acc.agendados += 1;
        }

        if (agendamento.status === "CONFIRMADO") {
          acc.confirmados += 1;
        }

        if (agendamento.status === "EM_ATENDIMENTO") {
          acc.emAtendimento += 1;
        }

        if (agendamento.status === "REALIZADO") {
          acc.realizados += 1;
        }

        return acc;
      },
      {
        total: 0,
        agendados: 0,
        confirmados: 0,
        emAtendimento: 0,
        realizados: 0,
      },
    );
  }, [agendamentos]);

  const selectedAgendamento = useMemo(
    () => agendamentos.find((agendamento) => agendamento.id === selectedId) || null,
    [agendamentos, selectedId],
  );

  function prevDay() {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  }

  function nextDay() {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  function openCreateModal(options?: { horario?: string; pacienteNome?: string }) {
    if (!podeCriarAgendamento) {
      setActionError(mensagemProfissionalOperacionalInexistente);
      return;
    }

    setActionError(null);
    setPrefillHorario(options?.horario);
    setPrefillPacienteNome(options?.pacienteNome);
    setCreateModalOpen(true);
  }

  function openWalkInModal(options?: { horario?: string; pacienteNome?: string }) {
    if (!podeCriarAgendamento) {
      setActionError(mensagemProfissionalOperacionalInexistente);
      return;
    }

    setActionError(null);
    setPrefillHorario(options?.horario);
    setPrefillPacienteNome(options?.pacienteNome);
    setWalkInModalOpen(true);
  }

  function closeCreateModal() {
    setCreateModalOpen(false);
    setPrefillHorario(undefined);
    setPrefillPacienteNome(undefined);
    if (navigationModalOpen) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }

  function closeWalkInModal() {
    setWalkInModalOpen(false);
    setPrefillHorario(undefined);
    setPrefillPacienteNome(undefined);
    if (navigationWalkInModalOpen) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }

  function openViewModal(id: string) {
    setActionError(null);
    setSelectedId(id);
    setViewModalOpen(true);
  }

  async function openConsulta(agendamentoId: string) {
    const agendamento = agendamentos.find((item) => item.id === agendamentoId);

    if (!agendamento) {
      setActionError("Não foi possível localizar o agendamento selecionado.");
      return;
    }

    try {
      setActionError(null);

      if (
        shouldAutoStartConsulta(agendamento.status) &&
        canTransitionStatusAgendamento(agendamento.status, "EM_ATENDIMENTO")
      ) {
      const agendamentoAtualizado = await agendamentoService.atualizarStatus(
          agendamento.id,
          mapStatusAgendamentoParaAtualizarRequest("EM_ATENDIMENTO"),
        );
        await atualizarAgendaAposAcao(agendamentoAtualizado);
      }

      setViewModalOpen(false);
      navigate(`/consultas/${agendamentoId}`, {
        state: { returnTo: agendaPath },
      });
    } catch (error) {
      setActionError(toErrorMessage(error, "Não foi possível abrir a consulta."));
    }
  }

  function openPaciente(pacienteId: string) {
    navigate(`/pacientes/${pacienteId}`, {
      state: { returnTo: agendaPath },
    });
  }

  function abrirModalRemarcacao(id: string) {
    setActionError(null);
    setSelectedId(id);
    setViewModalOpen(false);
    setModalRemarcacaoAberto(true);
  }

  function fecharModalRemarcacao() {
    setModalRemarcacaoAberto(false);
  }

  async function handleCreateAgendamento(payload: AgendamentoFormularioData) {
    if (!profissionalOperacionalId) {
      setActionError(mensagemProfissionalOperacionalInexistente);
      return;
    }

    const agendamentoCriado = await agendamentoService.criar(
      mapFormularioAgendamentoParaCriarRequest(payload, {
        profissionalId: profissionalOperacionalId,
      }),
    );
    closeCreateModal();
    await atualizarAgendaAposAcao(agendamentoCriado);
    setActionError(null);
  }

  async function handleCreateConsultaAvulsa(payload: AgendamentoFormularioData) {
    if (!profissionalOperacionalId) {
      setActionError(mensagemProfissionalOperacionalInexistente);
      return;
    }

    const agendamentoCriado = await agendamentoService.criarConsultaAvulsa(
      mapFormularioAgendamentoParaCriarRequest(payload, {
        profissionalId: profissionalOperacionalId,
      }),
    );

    closeWalkInModal();
    await atualizarAgendaAposAcao(agendamentoCriado);
    setActionError(null);
    navigate(`/consultas/${agendamentoCriado.id}`, {
      state: { returnTo: agendaPath },
    });
  }

  async function handleRemarcar(
    agendamentoId: string,
    payload: RemarcacaoAgendamentoFormularioData,
  ) {
    const agendamentoAtualizado = await agendamentoService.atualizar(
      agendamentoId,
      mapFormularioRemarcacaoParaAtualizarRequest(payload),
    );
    fecharModalRemarcacao();
    await atualizarAgendaAposAcao(agendamentoAtualizado);
    setActionError(null);
  }

  async function handleStatusTransition(
    agendamento: Agendamento,
    nextStatus: AtualizarStatusAgendamentoRequest["status"],
  ) {
    if (!canTransitionStatusAgendamento(agendamento.status, nextStatus)) {
      setActionError("A transição de status informada não é permitida.");
      return;
    }

    try {
      const agendamentoAtualizado = await agendamentoService.atualizarStatus(
        agendamento.id,
        mapStatusAgendamentoParaAtualizarRequest(nextStatus),
      );
      setViewModalOpen(false);
      setModalRemarcacaoAberto(false);
      await atualizarAgendaAposAcao(agendamentoAtualizado);
    } catch (error) {
      setActionError(
        toErrorMessage(error, "Não foi possível atualizar o status do agendamento."),
      );
    }
  }

  function isCurrentSlot(agendamento: Agendamento): boolean {
    if (!isCurrentDateToday) {
      return false;
    }

    const startMinutes = toMinutes(agendamento.horario);
    if (startMinutes < 0) {
      return false;
    }

    const endMinutes = startMinutes + agendamento.duracaoMinutos;
    return currentNowMinutes >= startMinutes && currentNowMinutes < endMinutes;
  }

  const isToday = new Date().toDateString() === currentDate.toDateString();

  if (loadingCatalogos && !loadError) {
    return (
      <PageLayout>
        <CarregamentoCentral />
      </PageLayout>
    );
  }

  if (loadError) {
    return (
      <PageLayout>
        <NotFoundCard
          title="Falha ao carregar a agenda"
          description={loadError}
          actionLabel="Atualizar página"
          onAction={() => window.location.reload()}
        />
      </PageLayout>
    );
  }

  if (
    contextoAcesso.exigeProfissionalVinculado &&
    !profissionalOperacionalId
  ) {
    return (
      <PageLayout>
        <NotFoundCard
          title="Profissional não encontrado"
          description="Não foi possível identificar o profissional responsável pela agenda."
          actionLabel="Voltar para o perfil"
          onAction={() => navigate("/profissional")}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <ModalNovoAgendamento
        open={createModalResolvedOpen}
        onClose={closeCreateModal}
        onNovoPaciente={(prefillNome) =>
          navigate("/pacientes/novo", {
            state: { returnTo: agendaPath, prefillNome },
          })
        }
        onSubmit={handleCreateAgendamento}
        defaultDate={currentDateIso}
        defaultHorario={resolvedPrefillHorario}
        defaultPacienteNome={resolvedPrefillPacienteNome}
        catalogos={catalogos}
        configuracaoFuncionamento={configuracaoFuncionamento}
      />

      <ModalConsultaAvulsa
        open={walkInModalResolvedOpen}
        onClose={closeWalkInModal}
        onNovoPaciente={(prefillNome) =>
          navigate("/pacientes/novo", {
            state: { returnTo: agendaPath, prefillNome },
          })
        }
        onSubmit={handleCreateConsultaAvulsa}
        defaultDate={currentDateIso}
        defaultHorario={resolvedWalkInHorario}
        defaultPacienteNome={resolvedPrefillPacienteNome}
        catalogos={catalogos}
        configuracaoFuncionamento={configuracaoFuncionamento}
      />

      <ModalVisualizarAgendamento
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        agendamento={selectedAgendamento}
        onAbrirPaciente={openPaciente}
        onAbrirConsulta={openConsulta}
        onConfirmar={(id) => {
          const agendamento = agendamentos.find((item) => item.id === id);
          if (agendamento) {
            void handleStatusTransition(agendamento, "CONFIRMADO");
          }
        }}
        onFaltou={(id) => {
          const agendamento = agendamentos.find((item) => item.id === id);
          if (agendamento) {
            void handleStatusTransition(agendamento, "FALTOU");
          }
        }}
        onRemarcar={abrirModalRemarcacao}
        onCancelar={(id) => {
          const agendamento = agendamentos.find((item) => item.id === id);
          if (agendamento) {
            void handleStatusTransition(agendamento, "CANCELADO");
          }
        }}
      />

      <ModalRemarcarAgendamento
        open={modalRemarcacaoAberto}
        onClose={fecharModalRemarcacao}
        agendamento={selectedAgendamento}
        onSubmit={handleRemarcar}
        catalogos={{
          servicos: catalogos.servicos,
          convenios: catalogos.convenios,
          formasPagamento: catalogos.formasPagamento,
        }}
        configuracaoFuncionamento={configuracaoFuncionamento}
      />

      <PageHeader
        title="Agenda"
        left={
          <div className={styles.headerLeft}>
            <h1 className={styles.agendaTitle}>Agenda</h1>
            <div className={styles.dateNav} role="group" aria-label="Navegar por data">
              <button
                className={styles.navBtn}
                onClick={prevDay}
                type="button"
                aria-label="Dia anterior"
              >
                <FaChevronLeft />
              </button>
              <span className={styles.dateLabel}>{formatDate(currentDate)}</span>
              <button
                className={styles.navBtn}
                onClick={nextDay}
                type="button"
                aria-label="Próximo dia"
              >
                <FaChevronRight />
              </button>
              {!isToday && (
                <button className={styles.todayBtn} onClick={goToToday} type="button">
                  Hoje
                </button>
              )}
            </div>
          </div>
        }
        right={
          <div className={styles.headerActions}>
            <button
              className={`${styles.btnSecondaryHeader} ${
                !podeCriarAgendamento ? styles.botaoDesabilitado : ""
              }`}
              onClick={() => openWalkInModal()}
              type="button"
              disabled={!podeCriarAgendamento}
              title={
                !podeCriarAgendamento
                  ? mensagemProfissionalOperacionalInexistente
                  : undefined
              }
            >
              <FaFileMedicalAlt />
              <span>Consulta avulsa</span>
            </button>
            <button
              className={`${styles.btnPrimary} ${
                !podeCriarAgendamento ? styles.botaoDesabilitado : ""
              }`}
              onClick={() => openCreateModal()}
              type="button"
              disabled={!podeCriarAgendamento}
              title={
                !podeCriarAgendamento
                  ? mensagemProfissionalOperacionalInexistente
                  : undefined
              }
            >
              <FaPlus />
              <span>Novo agendamento</span>
            </button>
          </div>
        }
      />

      <section className={styles.flowCard} aria-label="Fluxo do dia">
        <div className={styles.flowTrack}>
          <span className={styles.flowStep}>Agendado</span>
          <span className={styles.flowArrow}>-&gt;</span>
          <span className={styles.flowStep}>Confirmado</span>
          <span className={styles.flowArrow}>-&gt;</span>
          <span className={styles.flowStep}>Em atendimento</span>
          <span className={styles.flowArrow}>-&gt;</span>
          <span className={styles.flowStep}>Realizado</span>
        </div>
        <div className={styles.flowSummary}>
          <span>Total: {resumoDia.total}</span>
          <span>Agendados: {resumoDia.agendados}</span>
          <span>Confirmados: {resumoDia.confirmados}</span>
          <span>Em atendimento: {resumoDia.emAtendimento}</span>
          <span>Realizados: {resumoDia.realizados}</span>
        </div>
      </section>

      {actionError && <p className={styles.pageFeedbackError}>{actionError}</p>}

      {loadingAgendamentos && agendamentos.length === 0 ? (
        <CarregamentoCentral />
      ) : (
        <Table
          data={agendamentos}
          caption="Lista de agendamentos do dia"
          emptyMessage="Nenhum agendamento para esta data."
          getRowClassName={(row) => (isCurrentSlot(row) ? styles.currentTimeRow : "")}
          columns={[
          {
            key: "horario",
            label: "Horário",
            render: (row) => (
              <div className={styles.timeCell}>
                <span className={styles.horario}>{row.horario}</span>
                {isCurrentSlot(row) && <span className={styles.nowBadge}>Agora</span>}
              </div>
            ),
          },
          {
            key: "paciente",
            label: "Paciente",
            render: (row) => <span>{row.paciente}</span>,
          },
          {
            key: "servico",
            label: "Serviço",
            render: (row) => <span>{row.servico}</span>,
          },
          {
            key: "atendimento",
            label: "Atendimento",
            render: (row) => (
              <span
                className={`${styles.coverageBadge} ${row.tipoAtendimento === "CONVENIO" ? styles.coverageConvenio : styles.coverageParticular}`}
              >
                {formatarTipoAtendimento(row.tipoAtendimento, row.convenio)}
              </span>
            ),
          },
          {
            key: "status",
            label: "Status",
            align: "center",
            render: (row) => {
              const statusUi = getStatusAgendamentoUi(row.status);

              return (
                <span className={`${styles.status} ${styles[statusUi.className]}`}>
                  {statusUi.label}
                </span>
              );
            },
          },
          {
            key: "acoes",
            label: "Ações",
            align: "right",
            render: (row) => {
              const primaryAction =
                row.status === "AGUARDANDO"
                  ? {
                      label: "Confirmar",
                      icon: <FaCheck />,
                      className: styles.primaryConfirm,
                      onClick: () => void handleStatusTransition(row, "CONFIRMADO"),
                    }
                  : row.status === "CONFIRMADO"
                    ? {
                        label: "Iniciar atendimento",
                        icon: <FaPlay />,
                        className: styles.primaryStart,
                        onClick: () => void openConsulta(row.id),
                      }
                    : row.status === "EM_ATENDIMENTO"
                      ? {
                          label: "Abrir consulta",
                          icon: <FaPlay />,
                          className: styles.primaryStart,
                          onClick: () => void openConsulta(row.id),
                        }
                      : {
                          label: "Visualizar",
                          icon: <FaEye />,
                          className: styles.primaryView,
                          onClick: () => openViewModal(row.id),
                        };

              const canAdjust = isAgendamentoEditavel(row.status);

              return (
                <div className={styles.actionColumn}>
                  <button
                    className={`${styles.rowPrimaryAction} ${primaryAction.className}`}
                    onClick={primaryAction.onClick}
                    type="button"
                  >
                    {primaryAction.icon}
                    <span>{primaryAction.label}</span>
                  </button>

                  <div className={styles.actionButtons}>
                    <button
                      className={styles.actionBtn}
                      title="Visualizar"
                      type="button"
                      aria-label={`Visualizar agendamento de ${row.paciente}`}
                      onClick={() => openViewModal(row.id)}
                    >
                      <FaEye color="var(--color-brand-dark)" />
                    </button>

                    {canAdjust && (
                      <button
                        className={styles.actionBtn}
                        title="Remarcar"
                        type="button"
                        aria-label={`Remarcar ${row.paciente}`}
                        onClick={() => abrirModalRemarcacao(row.id)}
                      >
                        <FaRegCalendarCheck color="#d97706" />
                      </button>
                    )}

                    {canAdjust && (
                      <button
                        className={`${styles.actionBtn} ${styles.actionDanger}`}
                        title="Cancelar"
                        type="button"
                        aria-label={`Cancelar agendamento de ${row.paciente}`}
                        onClick={() => void handleStatusTransition(row, "CANCELADO")}
                      >
                        <FaTimes color="var(--color-danger)" />
                      </button>
                    )}
                  </div>
                </div>
              );
            },
          },
          ]}
        />
      )}
    </PageLayout>
  );
}



