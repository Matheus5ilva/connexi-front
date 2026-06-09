import { useCallback, useEffect, useState } from "react";
import { FaChevronLeft, FaEdit, FaFilePdf, FaPlay } from "react-icons/fa";
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";
import { NotFoundCard } from "../../../components/ui/not-found-card";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout } from "../../../components/ui/page-layout";
import { CarregamentoCentral } from "../../../components/ui/carregamento-central";
import { getSegmentoLabels } from "../../../config/segmento-labels";
import type { LayoutOutletContext } from "../../../layout";
import { resolveReturnTo } from "../../../routes/return-to";
import { parseRouteNumericId } from "../../../schemas/runtime-input.schema";
import {
  consultaService,
  isApiError,
  toErrorMessage,
  type RespostaDetalheProntuarioPaciente,
  type RespostaProntuariosPaciente,
  type ProntuarioAnexo,
  type StatusConsulta,
} from "../../../services/api";
import { ItemHistorico } from "./components/item-historico";
import { VisualizacaoProntuario } from "./components/visualizacao-prontuario";
import styles from "./styles.module.css";

type ErroHistoricoProntuario = {
  titulo: string;
  descricao: string;
};

function resolverErroHistoricoProntuario(
  erro: unknown,
  pessoaLabel = "Paciente",
): ErroHistoricoProntuario {
  const pessoaMinuscula = pessoaLabel.toLowerCase();

  if (isApiError(erro)) {
    if (erro.status === 401 || erro.status === 403) {
      return {
        titulo: "Acesso não autorizado",
        descricao: toErrorMessage(
          erro,
          `Você não tem permissão para acessar o histórico deste ${pessoaMinuscula}.`,
        ),
      };
    }

    if (erro.status === 404) {
      return {
        titulo: `${pessoaLabel} não encontrado`,
        descricao: `Não encontramos o ${pessoaMinuscula} informado. Ele pode ter sido removido ou não pertencer ao tenant atual.`,
      };
    }

    if (erro.code === "INVALID_PRONTUARIO_LIST_RESPONSE") {
      return {
        titulo: "Falha ao carregar histórico",
        descricao:
          "Recebemos dados em um formato diferente do esperado. A operação foi interrompida para manter o histórico seguro.",
      };
    }
  }

  return {
    titulo: "Não foi possível carregar o histórico",
    descricao: toErrorMessage(
      erro,
      "Não foi possível carregar o histórico de atendimentos.",
    ),
  };
}

function formatDateBr(value?: string): string {
  if (!value) {
    return "-";
  }

  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function formatDateTimeBr(value?: string): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("pt-BR");
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatConsultaStatus(status: StatusConsulta): string {
  switch (status) {
    case "EM_ATENDIMENTO":
      return "Em atendimento";
    case "FINALIZADO":
      return "Finalizado";
    case "CANCELADO":
      return "Cancelado";
    default:
      return status;
  }
}

function toStatusVariant(status: StatusConsulta) {
  switch (status) {
    case "FINALIZADO":
      return "success" as const;
    case "CANCELADO":
      return "danger" as const;
    default:
      return "info" as const;
  }
}

function downloadBlob(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  link.rel = "noopener";
  link.click();

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 1000);
}

function openBlob(blob: Blob): boolean {
  const objectUrl = URL.createObjectURL(blob);
  const popup = window.open(objectUrl, "_blank", "noopener,noreferrer");

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 60_000);

  return Boolean(popup);
}

export function ProntuariosPaciente() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { segmento } = useOutletContext<LayoutOutletContext>();
  const labels = getSegmentoLabels(segmento);
  const pessoaMinuscula = labels.pessoa.toLowerCase();
  const pacienteId = parseRouteNumericId(id);
  const defaultReturnTo = pacienteId ? `/pacientes/${pacienteId}` : "/pacientes";
  const returnTo = resolveReturnTo(location, defaultReturnTo);

  const [historicoResponse, setHistoricoResponse] =
    useState<RespostaProntuariosPaciente | null>(null);
  const [detalheResponse, setDetalheResponse] =
    useState<RespostaDetalheProntuarioPaciente | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loadingHistorico, setLoadingHistorico] = useState(true);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);
  const [erroHistorico, setErroHistorico] =
    useState<ErroHistoricoProntuario | null>(null);
  const [detalheError, setDetalheError] = useState<string | null>(null);
  const [acaoError, setAcaoError] = useState<string | null>(null);

  const carregarHistorico = useCallback(async () => {
    if (!pacienteId) {
      setLoadingHistorico(false);
      setErroHistorico({
        titulo: `${labels.pessoa} não encontrado`,
        descricao: `O identificador informado para o ${pessoaMinuscula} é inválido.`,
      });
      return;
    }

    try {
      setLoadingHistorico(true);
      setErroHistorico(null);
      const response = await consultaService.listarProntuariosPaciente(pacienteId);
      setHistoricoResponse(response);
      setSelectedId((current) => {
        if (current && response.prontuarios.some((item) => item.id === current)) {
          return current;
        }

        return response.prontuarios[0]?.id ?? null;
      });
    } catch (error) {
      setErroHistorico(resolverErroHistoricoProntuario(error, labels.pessoa));
    } finally {
      setLoadingHistorico(false);
    }
  }, [labels.pessoa, pacienteId, pessoaMinuscula]);

  const carregarDetalhe = useCallback(
    async (prontuarioId: number) => {
      if (!pacienteId) {
        return;
      }

      try {
        setLoadingDetalhe(true);
        setDetalheError(null);
        const response = await consultaService.detalharProntuarioPaciente(
          pacienteId,
          prontuarioId,
        );
        setDetalheResponse(response);
      } catch (error) {
        setDetalheResponse(null);
        setDetalheError(
          toErrorMessage(error, "Não foi possível carregar o atendimento."),
        );
      } finally {
        setLoadingDetalhe(false);
      }
    },
    [pacienteId],
  );

  useEffect(() => {
    void carregarHistorico();
  }, [carregarHistorico]);

  useEffect(() => {
    if (!selectedId) {
      setDetalheResponse(null);
      return;
    }

    void carregarDetalhe(selectedId);
  }, [carregarDetalhe, selectedId]);

  const paciente = historicoResponse?.paciente ?? detalheResponse?.paciente ?? null;
  const prontuarios = historicoResponse?.prontuarios ?? [];
  const prontuarioSelecionadoResumo =
    prontuarios.find((item) => item.id === selectedId) ?? null;

  if (!pacienteId) {
    return (
      <PageLayout>
        <NotFoundCard
          title={`${labels.pessoa} não encontrado`}
          description={`O identificador informado para o ${pessoaMinuscula} é inválido.`}
          actionLabel="Voltar"
          onAction={() => navigate(returnTo)}
        />
      </PageLayout>
    );
  }

  if (loadingHistorico) {
    return (
      <PageLayout>
        <CarregamentoCentral />
      </PageLayout>
    );
  }

  if (erroHistorico || !historicoResponse || !paciente) {
    const estadoErro = erroHistorico ?? {
      titulo: "Não foi possível carregar o histórico",
      descricao: "Não foi possível carregar o histórico de atendimentos.",
    };

    return (
      <PageLayout>
        <NotFoundCard
          title={estadoErro.titulo}
          description={estadoErro.descricao}
          actionLabel="Voltar"
          onAction={() => navigate(returnTo)}
        />
      </PageLayout>
    );
  }

  const pacienteAtual = paciente;
  const currentPath = `/pacientes/${pacienteAtual.id}/prontuarios`;
  const consultaAberta =
    detalheResponse?.consulta.statusConsulta === "EM_ATENDIMENTO"
      ? detalheResponse.consulta.agendamentoId
      : undefined;

  async function handleOpenAnexo(anexo: ProntuarioAnexo) {
    if (!detalheResponse) {
      return;
    }

    try {
      setAcaoError(null);
      const blob = await consultaService.obterArquivoAnexo(
        detalheResponse.consulta.agendamentoId,
        anexo.id,
      );

      if (!openBlob(blob)) {
        setAcaoError(
          "Não foi possível abrir a visualização do anexo. Verifique o bloqueador de pop-up.",
        );
      }
    } catch (error) {
      setAcaoError(toErrorMessage(error, "Não foi possível abrir o anexo."));
    }
  }

  async function handleDownloadAnexo(anexo: ProntuarioAnexo) {
    if (!detalheResponse) {
      return;
    }

    try {
      setAcaoError(null);
      const blob = await consultaService.obterArquivoAnexo(
        detalheResponse.consulta.agendamentoId,
        anexo.id,
        { download: true },
      );

      downloadBlob(blob, anexo.nomeArquivo);
    } catch (error) {
      setAcaoError(toErrorMessage(error, "Não foi possível baixar o anexo."));
    }
  }

  async function handleExportarProntuario() {
    if (!detalheResponse) {
      return;
    }

    try {
      setAcaoError(null);
      const blob = await consultaService.exportarPorProntuario(
        pacienteAtual.id,
        detalheResponse.prontuario.id,
      );
      downloadBlob(blob, `atendimento-${detalheResponse.prontuario.id}.pdf`);
    } catch (error) {
      setAcaoError(
        toErrorMessage(error, "Não foi possível exportar o atendimento em PDF."),
      );
    }
  }

  function handleNovoAtendimento() {
    navigate("/agenda", {
      state: {
        returnTo: currentPath,
        openWalkInModal: true,
        prefillPaciente: pacienteAtual.nome,
      },
    });
  }

  function handleOpenConsulta(agendamentoId: number) {
    navigate(`/consultas/${agendamentoId}`, {
      state: { returnTo: currentPath },
    });
  }

  return (
    <PageLayout>
      <PageHeader
        title="Histórico de atendimentos"
        left={
          <div className={styles.titleWithBack}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => navigate(returnTo)}
              aria-label={`Voltar para ${pessoaMinuscula}`}
            >
              <FaChevronLeft />
            </button>
            <div>
              <h1 className={styles.pageTitle}>{pacienteAtual.nome}</h1>
              <p className={styles.pageSubtitle}>
                Histórico de atendimentos
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
                  state: { returnTo: currentPath },
                })
              }
            >
              <FaEdit />
              <span>Editar {pessoaMinuscula}</span>
            </button>
            {detalheResponse && (
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => void handleExportarProntuario()}
              >
                <FaFilePdf />
                <span>Exportar PDF</span>
              </button>
            )}
            {consultaAberta && (
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => handleOpenConsulta(consultaAberta)}
              >
                <FaPlay />
                <span>Abrir atendimento</span>
              </button>
            )}
          </div>
        }
      />

      {!prontuarios.length ? (
        <section className={styles.emptyState} aria-label="Histórico vazio">
          <div className={styles.emptyStateInner}>
            <span className={styles.emptyDivider} aria-hidden="true" />
            <h2>Histórico de atendimentos</h2>
            <strong>Nenhum atendimento registrado.</strong>
            <p>Quando houver registros eles aparecerão aqui.</p>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleNovoAtendimento}
            >
              <FaPlay />
              <span>Novo atendimento</span>
            </button>
          </div>
        </section>
      ) : (
        <div className={styles.workspaceGrid}>
          <aside className={styles.historyPanel}>
            <div className={styles.historyHeader}>
              <h2>Atendimentos</h2>
              <p>
                {prontuarios.length === 1
                  ? "1 atendimento"
                  : `${prontuarios.length} atendimentos`}
              </p>
            </div>

            <div className={styles.historyList}>
              {prontuarios.map((prontuario) => (
                <ItemHistorico
                  key={prontuario.id}
                  rotuloData={formatDateBr(prontuario.dataConsulta)}
                  rotuloHora={prontuario.horaConsulta}
                  profissional={prontuario.profissionalNome}
                  tipoAtendimento={prontuario.tipoAtendimento}
                  resumo={prontuario.resumo}
                  rotuloStatus={formatConsultaStatus(prontuario.statusConsulta)}
                  varianteStatus={toStatusVariant(prontuario.statusConsulta)}
                  ativo={prontuario.id === selectedId}
                  aoSelecionar={() => setSelectedId(prontuario.id)}
                  aoAbrirConsulta={
                    prontuario.statusConsulta === "EM_ATENDIMENTO"
                      ? () => handleOpenConsulta(prontuario.agendamentoId)
                      : undefined
                  }
                />
              ))}
            </div>
          </aside>

          {loadingDetalhe && !detalheResponse ? (
            <CarregamentoCentral />
          ) : detalheError || !detalheResponse || !prontuarioSelecionadoResumo ? (
            <section className={styles.emptyCard}>
              <h2>Atendimento indisponível</h2>
              <p>
                {detalheError ||
                  "Não foi possível carregar os detalhes do atendimento selecionado."}
              </p>
            </section>
          ) : (
            <VisualizacaoProntuario
              paciente={detalheResponse.paciente}
              consulta={detalheResponse.consulta}
              prontuario={detalheResponse.prontuario}
              formatarData={formatDateBr}
              formatarDataHora={formatDateTimeBr}
              formatarTamanhoArquivo={formatFileSize}
              pessoaLabel={labels.pessoa}
              servicoLabel={labels.servico}
              aoAbrirPaciente={() =>
                navigate(`/pacientes/${pacienteAtual.id}`, {
                  state: { returnTo: currentPath },
                })
              }
              aoAbrirConsulta={
                consultaAberta ? () => handleOpenConsulta(consultaAberta) : undefined
              }
              aoAbrirAnexo={(anexo) => void handleOpenAnexo(anexo)}
              aoBaixarAnexo={(anexo) => void handleDownloadAnexo(anexo)}
            />
          )}
        </div>
      )}

      {acaoError ? (
        <section className={styles.emptyCard}>
          <h2>Atenção</h2>
          <p>{acaoError}</p>
        </section>
      ) : null}
    </PageLayout>
  );
}




