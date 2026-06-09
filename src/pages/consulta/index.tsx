import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import type { ReactNode } from "react";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaChevronLeft,
  FaClock,
  FaDownload,
  FaEnvelope,
  FaExternalLinkAlt,
  FaFilePdf,
  FaPaperclip,
  FaPhone,
  FaSave,
  FaTrash,
} from "react-icons/fa";
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";
import { AvisoErroFormulario } from "../../components/ui/aviso-erro-formulario";
import { FormField } from "../../components/ui/form-field";
import { NotFoundCard } from "../../components/ui/not-found-card";
import { PageHeader } from "../../components/ui/page-header";
import { PageLayout } from "../../components/ui/page-layout";
import { CarregamentoCentral } from "../../components/ui/carregamento-central";
import { StatusBadge } from "../../components/ui/status-badge";
import { getSegmentoIcons } from "../../config/segmento-icons";
import { getSegmentoLabels } from "../../config/segmento-labels";
import type { LayoutOutletContext } from "../../layout";
import { resolveReturnTo } from "../../routes/return-to";
import {
  finalizarConsultaSchema,
  salvarConsultaSchema,
  type ConsultaFormData,
} from "../../schemas/consulta.schema";
import { parseRouteNumericId } from "../../schemas/runtime-input.schema";
import {
  consultaService,
  isApiError,
  mapFinalizarConsultaRequest,
  mapSalvarConsultaRequest,
  toErrorMessage,
  type ContextoConsulta,
  type ProntuarioAnexo,
  type StatusConsulta,
} from "../../services/api";
import type { ErroFormularioAmigavel } from "../../services/api/errors/erro-formulario";
import { normalizarErroZodFormulario } from "../../services/api/errors/erro-formulario-validacao";
import styles from "./styles.module.css";

const INPUT_ACCEPT = ".pdf,image/*,.doc,.docx,.xls,.xlsx,.txt,.csv";
const LIMITE_ANEXOS_CONSULTA = 8;
const VALOR_AUSENTE = "—";
const LIMITE_TEMPO_CONSULTA_MINUTOS = 480;

type ErroCarregamentoConsulta = {
  titulo: string;
  descricao: string;
};

const mapaRotulosCamposConsulta = {
  tempoConsultaMinutos: "Tempo do atendimento",
  queixaPrincipal: "Motivo do atendimento",
  registroConsulta: "Registro do atendimento",
  conduta: "Ações realizadas",
  observacoes: "Observações",
  receitaDigitada: "Recomendações",
} satisfies Record<string, string>;

const camposAvancadosConsulta = [
  "queixaPrincipal",
  "conduta",
  "observacoes",
  "receitaDigitada",
] satisfies Array<keyof ConsultaFormData>;

type FormTextareaProps = {
  id: string;
  label: string;
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  maxLength?: number;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  className?: string;
};

function FormTextarea({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
  rows = 4,
  maxLength,
  error,
  helperText,
  disabled,
  className,
}: FormTextareaProps) {
  return (
    <div className={className}>
      <FormField
        id={id}
        label={label}
        required={required}
        error={error}
        hint={helperText}
        colSpan="full"
      >
        <textarea
          rows={rows}
          maxLength={maxLength}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
        />
      </FormField>
    </div>
  );
}

type AdvancedSectionProps = {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
};

function AdvancedSection({
  title,
  open,
  onToggle,
  children,
}: AdvancedSectionProps) {
  return (
    <section className={styles.advancedSection} aria-label={title}>
      <button
        type="button"
        className={styles.advancedToggle}
        aria-expanded={open}
        onClick={onToggle}
      >
        {open ? "− Ocultar informações avançadas" : "+ Informações avançadas"}
      </button>

      {open && <div className={styles.advancedFields}>{children}</div>}
    </section>
  );
}

function formatDateBr(value?: string): string {
  if (!value) {
    return VALOR_AUSENTE;
  }

  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function formatDateTimeBr(value?: string): string {
  if (!value) {
    return VALOR_AUSENTE;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("pt-BR");
}

function limitarTempoConsulta(tempoMinutos: number): number {
  if (!Number.isFinite(tempoMinutos) || tempoMinutos < 0) {
    return 0;
  }

  return Math.min(Math.floor(tempoMinutos), LIMITE_TEMPO_CONSULTA_MINUTOS);
}

function formatarTempoConsulta(tempoMinutos: number): string {
  const tempoSeguro = limitarTempoConsulta(tempoMinutos);
  const horas = Math.floor(tempoSeguro / 60);
  const minutos = tempoSeguro % 60;

  return `${String(horas).padStart(2, "0")}h ${String(minutos).padStart(2, "0")}min`;
}

function exibirTexto(valor?: string | null): string {
  const texto = valor?.trim();
  return texto ? texto : VALOR_AUSENTE;
}

function formatTipoAtendimento(tipoAtendimento?: string | null): string {
  const tipo = tipoAtendimento?.trim();
  if (!tipo) {
    return VALOR_AUSENTE;
  }

  if (tipo === "CONVENIO") {
    return "Convênio";
  }

  if (tipo === "PARTICULAR") {
    return "Particular";
  }

  return tipo;
}

function exibirAtendimento(
  consulta: ContextoConsulta["consulta"],
  pessoaLabel: string,
): string {
  if (pessoaLabel.toLowerCase() === "cliente") {
    return "Atendimento";
  }

  const tipoAtendimento = formatTipoAtendimento(consulta.tipoAtendimento);
  return tipoAtendimento === VALOR_AUSENTE
    ? "Atendimento"
    : `${tipoAtendimento} • Atendimento`;
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

function toConsultaStatusVariant(status: StatusConsulta) {
  switch (status) {
    case "FINALIZADO":
      return "success" as const;
    case "CANCELADO":
      return "danger" as const;
    default:
      return "info" as const;
  }
}

function resolverErroCarregamentoConsulta(
  erro: unknown,
): ErroCarregamentoConsulta {
  if (isApiError(erro)) {
    if (erro.status === 401 || erro.status === 403) {
      return {
        titulo: "Acesso não autorizado",
        descricao: toErrorMessage(
          erro,
          "Você não tem permissão para acessar este atendimento.",
        ),
      };
    }

    if (erro.status === 404) {
      return {
        titulo: "Atendimento não encontrado",
        descricao:
          "Não encontramos o atendimento informado. Ele pode ter sido removido ou não pertencer ao tenant atual.",
      };
    }

    if (erro.code === "INVALID_CONSULTA_WORKSPACE_RESPONSE") {
      return {
        titulo: "Falha ao carregar o atendimento",
        descricao:
          "Recebemos dados em um formato diferente do esperado. A operação foi interrompida para manter o atendimento seguro.",
      };
    }
  }

  return {
    titulo: "Não foi possível carregar o atendimento",
    descricao: toErrorMessage(erro, "Não foi possível carregar o atendimento."),
  };
}

function createInitialForm(
  contextoConsulta: ContextoConsulta | null,
): ConsultaFormData {
  return {
    tempoConsultaMinutos: contextoConsulta?.consulta.tempoConsultaMinutos,
    queixaPrincipal: contextoConsulta?.prontuario?.queixaPrincipal ?? "",
    registroConsulta: contextoConsulta?.prontuario?.registroConsulta ?? "",
    conduta: contextoConsulta?.prontuario?.conduta ?? "",
    observacoes: contextoConsulta?.prontuario?.observacoes ?? "",
    receitaDigitada: contextoConsulta?.prontuario?.receitaDigitada ?? "",
  };
}

function possuiValorTexto(value?: string | null): boolean {
  return Boolean(value?.trim());
}

function possuiInformacoesAvancadas(formulario: ConsultaFormData): boolean {
  return camposAvancadosConsulta.some((campo) =>
    possuiValorTexto(formulario[campo] as string | null | undefined),
  );
}

function erroPossuiCampoAvancado(
  issues: Array<{ path: Array<string | number | symbol> }>,
): boolean {
  return issues.some((issue) =>
    camposAvancadosConsulta.includes(
      issue.path[0] as (typeof camposAvancadosConsulta)[number],
    ),
  );
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

export function ConsultaAtendimento() {
  const navigate = useNavigate();
  const location = useLocation();
  const { segmento } = useOutletContext<LayoutOutletContext>();
  const labels = getSegmentoLabels(segmento);
  const icons = getSegmentoIcons(segmento);
  const AtendimentoIcon = icons.atendimento;
  const HistoricoIcon = icons.historico;
  const PessoaIcon = icons.pessoa;
  const ServicoIcon = icons.servico;
  const returnTo = resolveReturnTo(location, "/agenda");
  const { agendamentoId } = useParams();
  const numericAgendamentoId = parseRouteNumericId(agendamentoId);

  const [contextoConsulta, setContextoConsulta] =
    useState<ContextoConsulta | null>(null);
  const [form, setForm] = useState<ConsultaFormData>(() =>
    createInitialForm(null),
  );
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [erroCarregamento, setErroCarregamento] =
    useState<ErroCarregamentoConsulta | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [errosFormulario, setErrosFormulario] = useState<
    ErroFormularioAmigavel[]
  >([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tempoBaseMinutos, setTempoBaseMinutos] = useState(0);
  const [inicioRelogioConsulta, setInicioRelogioConsulta] = useState<
    number | null
  >(null);
  const [agoraRelogioConsulta, setAgoraRelogioConsulta] = useState(() =>
    Date.now(),
  );
  const preservarRelogioNaProximaAtualizacao = useRef(false);

  const carregarContextoConsulta = useCallback(async () => {
    if (!numericAgendamentoId) {
      setLoading(false);
      setErroCarregamento({
        titulo: "Atendimento não encontrado",
        descricao: "O identificador informado para o atendimento é inválido.",
      });
      return;
    }

    try {
      setLoading(true);
      setErroCarregamento(null);
      const response =
        await consultaService.obterContexto(numericAgendamentoId);
      const initialForm = createInitialForm(response);
      setContextoConsulta(response);
      setForm(initialForm);
      setAdvancedOpen(possuiInformacoesAvancadas(initialForm));
    } catch (error) {
      setErroCarregamento(resolverErroCarregamentoConsulta(error));
    } finally {
      setLoading(false);
    }
  }, [numericAgendamentoId]);

  const atualizarContextoSemResetarFormulario = useCallback(async () => {
    if (!numericAgendamentoId) {
      return;
    }

    const response = await consultaService.obterContexto(numericAgendamentoId);
    preservarRelogioNaProximaAtualizacao.current = true;
    setContextoConsulta(response);
  }, [numericAgendamentoId]);

  useEffect(() => {
    void carregarContextoConsulta();
  }, [carregarContextoConsulta]);

  useEffect(() => {
    if (!contextoConsulta) {
      preservarRelogioNaProximaAtualizacao.current = false;
      setTempoBaseMinutos(0);
      setInicioRelogioConsulta(null);
      setAgoraRelogioConsulta(Date.now());
      return;
    }

    if (preservarRelogioNaProximaAtualizacao.current) {
      preservarRelogioNaProximaAtualizacao.current = false;
      return;
    }

    const tempoPersistido = contextoConsulta.prontuario
      ? contextoConsulta.consulta.tempoConsultaMinutos
      : 0;

    setTempoBaseMinutos(limitarTempoConsulta(tempoPersistido ?? 0));
    setInicioRelogioConsulta(
      contextoConsulta.consulta.statusConsulta === "EM_ATENDIMENTO"
        ? Date.now()
        : null,
    );
    setAgoraRelogioConsulta(Date.now());
  }, [contextoConsulta]);

  useEffect(() => {
    if (inicioRelogioConsulta === null) {
      return undefined;
    }

    const intervalo = window.setInterval(() => {
      setAgoraRelogioConsulta(Date.now());
    }, 30_000);

    return () => window.clearInterval(intervalo);
  }, [inicioRelogioConsulta]);

  if (!numericAgendamentoId) {
    return (
      <PageLayout>
        <NotFoundCard
          title="Atendimento não encontrado"
          description="O identificador informado para o atendimento é inválido."
          actionLabel="Voltar para a agenda"
          onAction={() => navigate(returnTo)}
        />
      </PageLayout>
    );
  }

  if (loading) {
    return (
      <PageLayout>
        <CarregamentoCentral />
      </PageLayout>
    );
  }

  if (erroCarregamento || !contextoConsulta) {
    const estadoErro = erroCarregamento ?? {
      titulo: "Atendimento não encontrado",
      descricao: "Não foi possível localizar o atendimento.",
    };

    return (
      <PageLayout>
        <NotFoundCard
          title={estadoErro.titulo}
          description={estadoErro.descricao}
          actionLabel="Voltar para a agenda"
          onAction={() => navigate(returnTo)}
          secondaryActionLabel="Tentar novamente"
          onSecondaryAction={() => void carregarContextoConsulta()}
        />
      </PageLayout>
    );
  }

  const paciente = contextoConsulta.paciente;
  const consulta = contextoConsulta.consulta;
  const prontuario = contextoConsulta.prontuario;
  const historico = contextoConsulta.historico;
  const consultaEditavel = consulta.statusConsulta === "EM_ATENDIMENTO";
  const anexos = prontuario?.anexos ?? [];
  const consultaPath = `/consultas/${consulta.agendamentoId}`;
  const minutosDecorridos =
    inicioRelogioConsulta === null
      ? 0
      : Math.floor((agoraRelogioConsulta - inicioRelogioConsulta) / 60_000);
  const tempoConsultaAtualMinutos = limitarTempoConsulta(
    tempoBaseMinutos + minutosDecorridos,
  );
  const tempoConsultaParaEnvio = Math.max(1, tempoConsultaAtualMinutos);
  const possuiProntuarioPersistido = Boolean(prontuario?.id);
  const podeExportarPdf = possuiProntuarioPersistido;

  function montarFormularioComTempoAtual(): ConsultaFormData {
    return {
      ...form,
      tempoConsultaMinutos: tempoConsultaParaEnvio,
    };
  }

  function handleFormChange<K extends keyof ConsultaFormData>(
    key: K,
    value: ConsultaFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormError(null);
    setErrosFormulario([]);
    setFeedback(null);
    setPdfError(null);
  }

  async function salvarConsulta() {
    const formularioComTempoAtual = montarFormularioComTempoAtual();
    const parsed = salvarConsultaSchema.safeParse(formularioComTempoAtual);
    if (!parsed.success) {
      if (erroPossuiCampoAvancado(parsed.error.issues)) {
        setAdvancedOpen(true);
      }

      const resultadoErro = normalizarErroZodFormulario(parsed.error, {
        mapaRotulosCampos: mapaRotulosCamposConsulta,
        mensagemPadrao: "Revise os campos do atendimento.",
      });
      setFormError(resultadoErro.mensagemGlobal);
      setErrosFormulario(resultadoErro.erros);
      setFeedback(null);
      return;
    }

    try {
      setSaving(true);
      setFormError(null);
      setErrosFormulario([]);
      setFeedback(null);

      const response = await consultaService.salvar(
        consulta.agendamentoId,
        mapSalvarConsultaRequest(parsed.data),
      );

      setContextoConsulta(response);
      setForm(createInitialForm(response));
      setFeedback("Atendimento salvo com sucesso.");
    } catch (error) {
      setFormError(
        toErrorMessage(error, "Não foi possível salvar o atendimento."),
      );
      setErrosFormulario([]);
    } finally {
      setSaving(false);
    }
  }

  async function finalizarConsulta() {
    const formularioComTempoAtual = montarFormularioComTempoAtual();
    const parsed = finalizarConsultaSchema.safeParse(formularioComTempoAtual);
    if (!parsed.success) {
      if (erroPossuiCampoAvancado(parsed.error.issues)) {
        setAdvancedOpen(true);
      }

      const resultadoErro = normalizarErroZodFormulario(parsed.error, {
        mapaRotulosCampos: mapaRotulosCamposConsulta,
        mensagemPadrao: "Revise os campos do atendimento.",
      });
      setFormError(resultadoErro.mensagemGlobal);
      setErrosFormulario(resultadoErro.erros);
      setFeedback(null);
      return;
    }

    try {
      setFinalizing(true);
      setFormError(null);
      setErrosFormulario([]);
      setFeedback(null);

      const response = await consultaService.finalizar(
        consulta.agendamentoId,
        mapFinalizarConsultaRequest(parsed.data),
      );

      setContextoConsulta(response);
      setForm(createInitialForm(response));
      setFeedback("Atendimento finalizado com sucesso.");
    } catch (error) {
      setFormError(
        toErrorMessage(error, "Não foi possível finalizar o atendimento."),
      );
      setErrosFormulario([]);
    } finally {
      setFinalizing(false);
    }
  }

  async function handleUploadAnexos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (!files.length) {
      return;
    }

    if (anexos.length + files.length > LIMITE_ANEXOS_CONSULTA) {
      setUploadError(
        `O limite é de ${LIMITE_ANEXOS_CONSULTA} anexos por atendimento.`,
      );
      setFeedback(null);
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      setFeedback(null);

      await consultaService.adicionarAnexos(consulta.agendamentoId, files);
      await atualizarContextoSemResetarFormulario();
      setFeedback("Anexos adicionados com sucesso.");
    } catch (error) {
      setUploadError(
        toErrorMessage(error, "Não foi possível adicionar os anexos."),
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveAnexo(anexoId: number) {
    try {
      setUploadError(null);
      setFeedback(null);

      await consultaService.removerAnexo(consulta.agendamentoId, anexoId);
      await atualizarContextoSemResetarFormulario();
      setFeedback("Anexo removido com sucesso.");
    } catch (error) {
      setUploadError(
        toErrorMessage(error, "Não foi possível remover o anexo."),
      );
    }
  }

  async function handleOpenAnexo(anexo: ProntuarioAnexo) {
    try {
      const blob = await consultaService.obterArquivoAnexo(
        consulta.agendamentoId,
        anexo.id,
      );

      if (!openBlob(blob)) {
        setUploadError(
          "Não foi possível abrir a visualização do anexo. Verifique o bloqueador de pop-up.",
        );
      }
    } catch (error) {
      setUploadError(toErrorMessage(error, "Não foi possível abrir o anexo."));
    }
  }

  async function handleDownloadAnexo(anexo: ProntuarioAnexo) {
    try {
      const blob = await consultaService.obterArquivoAnexo(
        consulta.agendamentoId,
        anexo.id,
        { download: true },
      );

      downloadBlob(blob, anexo.nomeArquivo);
    } catch (error) {
      setUploadError(toErrorMessage(error, "Não foi possível baixar o anexo."));
    }
  }

  async function handleExportarPdf() {
    if (!podeExportarPdf) {
      setPdfError("Salve o atendimento antes de exportar o PDF.");
      return;
    }

    try {
      setPdfError(null);
      const blob = await consultaService.exportarPorAgendamento(
        consulta.agendamentoId,
      );
      downloadBlob(blob, `atendimento-${consulta.agendamentoId}.pdf`);
    } catch (error) {
      setPdfError(
        toErrorMessage(error, "Não foi possível exportar o atendimento em PDF."),
      );
    }
  }

  return (
    <PageLayout>
      <PageHeader
        title="Atendimento"
        left={
          <div className={styles.titleWithBack}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => navigate(returnTo)}
              aria-label="Voltar para a agenda"
            >
              <FaChevronLeft />
            </button>
            <div>
              <h1 className={styles.pageTitle}>{paciente.nome}</h1>
              <p className={styles.pageSubtitle}>
                Atendimento e histórico
              </p>
            </div>
          </div>
        }
      />

      <section className={styles.headerCard}>
        <div className={styles.headerMetaItem}>
          <span>Data</span>
          <strong>
            <FaCalendarAlt /> {formatDateBr(consulta.dataConsulta)}
          </strong>
        </div>
        <div className={styles.headerMetaItem}>
          <span>Horário</span>
          <strong>
            <FaClock /> {exibirTexto(consulta.horaConsulta)}
          </strong>
        </div>
        <div className={styles.headerMetaItem}>
          <span>Profissional</span>
          <strong>
            <PessoaIcon /> {exibirTexto(consulta.profissionalNome)}
          </strong>
        </div>
        <div className={styles.headerMetaItem}>
          <span>{labels.servico}</span>
          <strong>
            <ServicoIcon /> {exibirTexto(consulta.servicoNome)}
          </strong>
        </div>
        <div className={styles.headerMetaItem}>
          <span>Atendimento</span>
          <strong>
            <AtendimentoIcon /> {exibirAtendimento(consulta, labels.pessoa)}
          </strong>
        </div>
        <div className={styles.headerStatus}>
          <span>Status do atendimento</span>
          <StatusBadge
            label={formatConsultaStatus(consulta.statusConsulta)}
            variant={toConsultaStatusVariant(consulta.statusConsulta)}
          />
        </div>
      </section>

      <section className={styles.mainGrid}>
        <article className={styles.recordCard}>
          <header className={styles.cardHeader}>
            <div>
              <h2>Registro do atendimento</h2>
            </div>
            {podeExportarPdf && (
              <button
                type="button"
                className={styles.pdfButton}
                onClick={() => void handleExportarPdf()}
              >
                <FaFilePdf />
                <span>Exportar PDF</span>
              </button>
            )}
          </header>

          {prontuario && (
            <div
              className={`${styles.currentRecordBanner} ${
                consultaEditavel ? styles.currentRecordBannerInfo : ""
              }`}
            >
              <FaCheckCircle />
              <span>
                {consultaEditavel
                  ? "Atendimento em andamento. Você pode continuar atualizando o registro."
                  : "Atendimento finalizado. O registro está em modo de leitura."}
              </span>
            </div>
          )}

          <div className={styles.formGrid}>
            <div className={styles.timerPanel} aria-live="polite">
              <span className={styles.timerLabel}>Tempo do atendimento</span>
              <strong className={styles.timerValue}>
                <FaClock /> {formatarTempoConsulta(tempoConsultaAtualMinutos)}
              </strong>
              <span className={styles.timerCaption}>
                O tempo é calculado automaticamente enquanto o atendimento está
                aberto.
              </span>
            </div>

            <FormTextarea
              id="consulta-registro"
              label="Registro do atendimento"
              helperText="Opcional. Máximo de 20.000 caracteres."
              rows={9}
              maxLength={20000}
              value={form.registroConsulta}
              onChange={(value) => handleFormChange("registroConsulta", value)}
              placeholder="Registre a evolução do atendimento."
              disabled={!consultaEditavel}
              className={styles.primaryTextarea}
            />

            <AdvancedSection
              title="Informações avançadas do atendimento"
              open={advancedOpen}
              onToggle={() => setAdvancedOpen((current) => !current)}
            >
              <FormTextarea
                id="consulta-queixa-principal"
                label="Motivo do atendimento"
                helperText="Opcional. Máximo de 500 caracteres."
                rows={3}
                maxLength={500}
                value={form.queixaPrincipal}
                onChange={(value) =>
                  handleFormChange("queixaPrincipal", value)
                }
                placeholder="Descreva o motivo do atendimento."
                disabled={!consultaEditavel}
              />

              <FormTextarea
                id="consulta-conduta"
                label="Ações realizadas"
                helperText="Opcional. Máximo de 5.000 caracteres."
                rows={4}
                maxLength={5000}
                value={form.conduta}
                onChange={(value) => handleFormChange("conduta", value)}
                placeholder="Descreva as ações realizadas."
                disabled={!consultaEditavel}
              />

              <FormTextarea
                id="consulta-observacoes"
                label="Observações"
                helperText="Opcional. Máximo de 5.000 caracteres."
                rows={4}
                maxLength={5000}
                value={form.observacoes}
                onChange={(value) => handleFormChange("observacoes", value)}
                placeholder="Inclua observações complementares, se necessário."
                disabled={!consultaEditavel}
              />

              <FormTextarea
                id="consulta-receita-digitada"
                label="Recomendações"
                helperText="Opcional. Máximo de 5.000 caracteres."
                rows={4}
                maxLength={5000}
                value={form.receitaDigitada}
                onChange={(value) =>
                  handleFormChange("receitaDigitada", value)
                }
                placeholder="Digite recomendações ou orientações que deverão ficar registradas."
                disabled={!consultaEditavel}
              />
            </AdvancedSection>
          </div>

          <section
            className={styles.attachmentsCard}
            aria-label="Anexos do atendimento"
          >
            <div className={styles.attachmentsHeader}>
              <div>
                <h3 className={styles.attachmentsTitle}>Anexos</h3>
                <p className={styles.attachmentsSubtitle}>
                  Arquivos vinculados ao registro deste atendimento.
                </p>
              </div>
              {consultaEditavel && (
                <label className={styles.uploadButton}>
                  <FaPaperclip />
                  <span>{uploading ? "Enviando..." : "Adicionar anexos"}</span>
                  <input
                    type="file"
                    multiple
                    accept={INPUT_ACCEPT}
                    onChange={(event) => void handleUploadAnexos(event)}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>

            {uploadError && <p className={styles.uploadError}>{uploadError}</p>}

            {!anexos.length ? (
              <div className={styles.emptyAttachment}>
                Nenhum anexo disponível para este atendimento.
              </div>
            ) : (
              <ul className={styles.attachmentList}>
                {anexos.map((anexo) => (
                  <li key={anexo.id} className={styles.attachmentItem}>
                    <div className={styles.attachmentMeta}>
                      <strong>{anexo.nomeArquivo}</strong>
                      <span>
                        {anexo.mimeType} • {formatFileSize(anexo.tamanhoBytes)}{" "}
                        • {formatDateTimeBr(anexo.dataUpload)}
                      </span>
                      <span>Visualização e download disponíveis.</span>
                    </div>
                    <div className={styles.attachmentActions}>
                      <button
                        type="button"
                        className={styles.attachmentBtn}
                        onClick={() => void handleOpenAnexo(anexo)}
                      >
                        <FaExternalLinkAlt />
                        <span>Visualizar</span>
                      </button>
                      <button
                        type="button"
                        className={styles.attachmentBtn}
                        onClick={() => void handleDownloadAnexo(anexo)}
                      >
                        <FaDownload />
                        <span>Baixar</span>
                      </button>
                      {consultaEditavel && (
                        <button
                          type="button"
                          className={`${styles.attachmentBtn} ${styles.attachmentBtnDanger}`}
                          onClick={() => void handleRemoveAnexo(anexo.id)}
                        >
                          <FaTrash />
                          <span>Remover</span>
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {formError ? (
            <AvisoErroFormulario
              titulo={
                errosFormulario.length > 0
                  ? "Verifique os campos abaixo:"
                  : "Não foi possível concluir a operação."
              }
              mensagem={errosFormulario.length === 0 ? formError : undefined}
              erros={errosFormulario}
            />
          ) : null}
          {pdfError && <p className={styles.formError}>{pdfError}</p>}
          {feedback && <p className={styles.formSuccess}>{feedback}</p>}

          <div className={styles.recordActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => void salvarConsulta()}
              disabled={!consultaEditavel || saving || finalizing}
            >
              <FaSave />
              <span>{saving ? "Salvando..." : "Salvar atendimento"}</span>
            </button>

            {consultaEditavel && (
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => void finalizarConsulta()}
                disabled={saving || finalizing}
              >
                <FaCheckCircle />
                <span>
                  {finalizing ? "Finalizando..." : "Finalizar atendimento"}
                </span>
              </button>
            )}
          </div>
        </article>

        <aside className={styles.sideColumn}>
          <section className={styles.patientCard}>
            <header className={styles.cardHeaderCompact}>
              <h3>{labels.pessoa}</h3>
            </header>
            <strong className={styles.patientName}>{paciente.nome}</strong>
            <div className={styles.patientDetails}>
              <p className={styles.patientMeta}>
                <span>CPF</span>
                <strong>{exibirTexto(paciente.cpf)}</strong>
              </p>
              <p className={styles.patientMeta}>
                <span>
                  <FaPhone /> Telefone
                </span>
                <strong>{exibirTexto(paciente.telefone)}</strong>
              </p>
              <p className={styles.patientMeta}>
                <span>
                  <FaEnvelope /> E-mail
                </span>
                <strong>{exibirTexto(paciente.email)}</strong>
              </p>
            </div>
            <div className={styles.patientActions}>
              <button
                type="button"
                className={styles.linkButton}
                onClick={() =>
                  navigate(`/pacientes/${paciente.id}`, {
                    state: { returnTo: consultaPath },
                  })
                }
              >
                Ver ficha completa
              </button>
              <button
                type="button"
                className={styles.linkButton}
                onClick={() =>
                  navigate(`/pacientes/${paciente.id}/prontuarios`, {
                    state: { returnTo: consultaPath },
                  })
                }
              >
                Ver histórico completo
              </button>
            </div>
          </section>

          <section className={styles.historyCard}>
            <header className={styles.cardHeaderCompact}>
              <h3>Histórico de atendimentos</h3>
            </header>

            {!historico.length ? (
              <div className={styles.emptyHistory}>
                <HistoricoIcon />
                <p>Nenhum atendimento anterior encontrado.</p>
              </div>
            ) : (
              <div className={styles.historyList}>
                {historico.map((item) => (
                  <article key={item.id} className={styles.historyItem}>
                    <div className={styles.historyHeader}>
                      <div className={styles.historyTitle}>
                        <strong>{formatDateBr(item.dataConsulta)}</strong>
                        <small>{exibirTexto(item.horaConsulta)}</small>
                      </div>
                      <div className={styles.historyHeaderMeta}>
                        <StatusBadge
                          label={formatConsultaStatus(item.statusConsulta)}
                          variant={toConsultaStatusVariant(item.statusConsulta)}
                        />
                      </div>
                    </div>
                    <div className={styles.historyBody}>
                      <p>
                        <strong>Resumo:</strong> {exibirTexto(item.resumo)}
                      </p>
                      <p>
                        <strong>Profissional:</strong>{" "}
                        {exibirTexto(item.profissionalNome)}
                      </p>
                      <p>
                        <strong>{labels.servico}:</strong>{" "}
                        {exibirTexto(item.servicoNome)}
                      </p>
                      <p>
                        <strong>Atendimento:</strong>{" "}
                        {exibirTexto(item.tipoAtendimento)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </aside>
      </section>
    </PageLayout>
  );
}
