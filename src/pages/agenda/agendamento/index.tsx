import { useEffect, useState } from "react";
import { z } from "zod";
import {
  FaCalendarAlt,
  FaClock,
  FaFileMedicalAlt,
  FaMoneyBillWave,
  FaStethoscope,
  FaUser,
  FaUserPlus,
} from "react-icons/fa";
import { AvisoErroFormulario } from "../../../components/ui/aviso-erro-formulario";
import { FormField } from "../../../components/ui/form-field";
import { Modal } from "../../../components/ui/modal";
import { adicionarDiasDataSomenteDia } from "../../../domain/data-somente-dia";
import type {
  Agendamento,
  Configuracao,
  ConvenioListaItem,
  FormaPagamento as FormaPagamentoApi,
  PacienteListaItem,
  ServicoListaItem,
  TipoConsulta,
} from "../../../services/api";
import {
  mapAgendamentoParaFormularioRemarcacao,
  toErrorMessage,
} from "../../../services/api";
import type { ErroFormularioAmigavel } from "../../../services/api/errors/erro-formulario";
import { normalizarErroZodFormulario } from "../../../services/api/errors/erro-formulario-validacao";
import {
  formularioAgendamentoSchema,
  formularioRemarcacaoAgendamentoSchema,
  type AgendamentoFormularioData,
  type RemarcacaoAgendamentoFormularioData,
} from "../../../schemas/agendamento.schema";
import {
  formatarTipoAtendimento,
  formatarTipoConsulta,
  getStatusAgendamentoUi,
  isAgendamentoEditavel,
} from "../utils/status-agendamento";
import { validarAgendamentoNoFuncionamento } from "../utils/funcionamento-agenda";
import styles from "./styles.module.css";

type CatalogosAgendamento = {
  pacientes: PacienteListaItem[];
  servicos: ServicoListaItem[];
  convenios: ConvenioListaItem[];
  formasPagamento: FormaPagamentoApi[];
};

type ModalNovoProps = {
  open: boolean;
  onClose: () => void;
  onNovoPaciente: (prefillNome?: string) => void;
  onSubmit: (payload: AgendamentoFormularioData) => Promise<void> | void;
  defaultDate: string;
  defaultHorario?: string;
  defaultPacienteNome?: string;
  catalogos: CatalogosAgendamento;
  configuracaoFuncionamento: Configuracao | null;
};

type ModalConsultaAvulsaProps = ModalNovoProps;

type ModalVisualizarProps = {
  open: boolean;
  onClose: () => void;
  agendamento: Agendamento | null;
  onAbrirPaciente: (pacienteId: string) => void;
  onAbrirConsulta: (agendamentoId: string) => void;
  onConfirmar: (agendamentoId: string) => void;
  onFaltou: (agendamentoId: string) => void;
  onRemarcar: (agendamentoId: string) => void;
  onCancelar: (agendamentoId: string) => void;
};

type ModalRemarcarProps = {
  open: boolean;
  onClose: () => void;
  agendamento: Agendamento | null;
  onSubmit: (
    agendamentoId: string,
    payload: RemarcacaoAgendamentoFormularioData,
  ) => Promise<void> | void;
  catalogos: Pick<
    CatalogosAgendamento,
    "servicos" | "convenios" | "formasPagamento"
  >;
  configuracaoFuncionamento: Configuracao | null;
};

type ErrosFormulario<T> = Partial<Record<keyof T, string>>;

const DURACAO_OPTIONS = Array.from(
  { length: 48 },
  (_, index) => (index + 1) * 5,
);
const TIPO_CONSULTA_OPTIONS: readonly TipoConsulta[] = [
  "Consulta",
  "Retorno",
  "Primeira Vez",
  "Urgência",
] as const;

const mapaRotulosCamposAgendamento = {
  pacienteId: "Paciente",
  data: "Data",
  horario: "Horário",
  duracaoMinutos: "Duração",
  convenioId: "Convênio",
  servicoId: "Serviço",
  formaPagamentoId: "Forma de pagamento",
  tipoConsulta: "Tipo de consulta",
  observacao: "Observações",
} satisfies Record<string, string>;

const valoresPadraoAgendamento: AgendamentoFormularioData = {
  pacienteId: undefined as never,
  data: "",
  horario: "",
  duracaoMinutos: 30,
  tipoAtendimento: "PARTICULAR",
  convenioId: undefined,
  servicoId: undefined as never,
  formaPagamentoId: undefined,
  tipoConsulta: undefined,
  observacao: "",
};

const valoresPadraoRemarcacao: RemarcacaoAgendamentoFormularioData = {
  data: "",
  horario: "",
  duracaoMinutos: 30,
  tipoAtendimento: "PARTICULAR",
  convenioId: undefined,
  formaPagamentoId: undefined,
  tipoConsulta: undefined,
  observacao: "",
};

function toNumberOrUndefined(value: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const convertido = Number(value);
  return Number.isNaN(convertido) ? undefined : convertido;
}

function mapZodErrors<T extends Record<string, unknown>>(
  error: z.ZodError<T>,
): ErrosFormulario<T> {
  const fieldErrors: ErrosFormulario<T> = {};

  error.issues.forEach((issue) => {
    const field = issue.path[0] as keyof T | undefined;
    if (!field || fieldErrors[field]) {
      return;
    }

    fieldErrors[field] = issue.message;
  });

  return fieldErrors;
}

function formatDateForDisplay(value: string): string {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function formatarMoeda(value?: number): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "Não informado";
  }

  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function addDaysToIsoDate(isoDate: string, days: number): string {
  return adicionarDiasDataSomenteDia(isoDate, days);
}

function obterNomeProfissional(agendamento: Agendamento): string {
  const nomeProfissional = agendamento.profissional?.trim();
  return nomeProfissional && nomeProfissional.length > 0
    ? nomeProfissional
    : "Profissional nao informado";
}

function createInitialAgendamentoForm(
  defaultDate: string,
  defaultHorario?: string,
  defaultPacienteNome?: string,
  pacientes: PacienteListaItem[] = [],
): AgendamentoFormularioData {
  const pacienteEncontrado = defaultPacienteNome
    ? pacientes.find((item) => item.nome === defaultPacienteNome)
    : undefined;

  return {
    ...valoresPadraoAgendamento,
    data: defaultDate,
    horario: defaultHorario ?? "",
    pacienteId: (pacienteEncontrado?.id
      ? Number(pacienteEncontrado.id)
      : undefined) as never,
  };
}

function createInitialRemarcarForm(
  agendamento: Agendamento | null,
): RemarcacaoAgendamentoFormularioData {
  if (!agendamento) {
    return valoresPadraoRemarcacao;
  }

  return mapAgendamentoParaFormularioRemarcacao(agendamento);
}

function getPacienteNomeById(
  pacientes: PacienteListaItem[],
  pacienteId?: number,
): string | undefined {
  if (!pacienteId) {
    return undefined;
  }

  return pacientes.find((item) => Number(item.id) === pacienteId)?.nome;
}

function obterServicoSelecionado(
  servicos: ServicoListaItem[],
  servicoId?: number,
): ServicoListaItem | undefined {
  if (!servicoId) {
    return undefined;
  }

  return servicos.find((servico) => Number(servico.id) === Number(servicoId));
}

function convenioPertenceAoServico(
  servico: ServicoListaItem | undefined,
  convenioId?: number,
): boolean {
  if (!servico || !convenioId) {
    return false;
  }

  return servico.servicosConvenios.some(
    (vinculo) => Number(vinculo.convenioId) === Number(convenioId),
  );
}

function obterConveniosDisponiveis(
  catalogos: Pick<CatalogosAgendamento, "servicos" | "convenios">,
  servicoId?: number,
): ConvenioListaItem[] {
  const servico = obterServicoSelecionado(catalogos.servicos, servicoId);
  const idsPermitidos = new Set(
    servico?.servicosConvenios.map((vinculo) => Number(vinculo.convenioId)) ??
      [],
  );

  return catalogos.convenios.filter((convenio) =>
    idsPermitidos.has(Number(convenio.id)),
  );
}

function validarConvenioDoServico(params: {
  tipoAtendimento: "PARTICULAR" | "CONVENIO";
  servicoId?: number;
  convenioId?: number;
  servicos: ServicoListaItem[];
}) {
  if (params.tipoAtendimento === "PARTICULAR" || !params.servicoId) {
    return null;
  }

  const servico = obterServicoSelecionado(params.servicos, params.servicoId);

  if (!servico || servico.servicosConvenios.length === 0) {
    return "Este serviço não possui convênios disponíveis.";
  }

  if (!params.convenioId) {
    return null;
  }

  if (!convenioPertenceAoServico(servico, params.convenioId)) {
    return "O convênio selecionado não está vinculado ao serviço escolhido.";
  }

  return null;
}

function montarErroConvenioServico(mensagem: string): ErroFormularioAmigavel[] {
  return [
    {
      campo: mapaRotulosCamposAgendamento.convenioId,
      mensagem,
    },
  ];
}

function renderCoverageSelector(
  tipoAtendimento:
    | AgendamentoFormularioData["tipoAtendimento"]
    | RemarcacaoAgendamentoFormularioData["tipoAtendimento"],
  onChange: (value: "PARTICULAR" | "CONVENIO") => void,
  titleId: string,
) {
  return (
    <section className={styles.coverageSection} aria-labelledby={titleId}>
      <h3 className={styles.sectionLabel} id={titleId}>
        Tipo de atendimento
      </h3>
      <div className={styles.coverageOptions}>
        <label
          className={`${styles.coverageOption} ${tipoAtendimento === "PARTICULAR" ? styles.coverageOptionActive : ""}`}
        >
          <input
            type="radio"
            name={titleId}
            value="PARTICULAR"
            checked={tipoAtendimento === "PARTICULAR"}
            onChange={() => onChange("PARTICULAR")}
          />
          <span>Particular</span>
        </label>

        <label
          className={`${styles.coverageOption} ${tipoAtendimento === "CONVENIO" ? styles.coverageOptionActive : ""}`}
        >
          <input
            type="radio"
            name={titleId}
            value="CONVENIO"
            checked={tipoAtendimento === "CONVENIO"}
            onChange={() => onChange("CONVENIO")}
          />
          <span>Convênio</span>
        </label>
      </div>
    </section>
  );
}

function AgendamentoFormModal({
  open,
  onClose,
  onNovoPaciente,
  onSubmit,
  defaultDate,
  defaultHorario,
  defaultPacienteNome,
  catalogos,
  configuracaoFuncionamento,
  title,
  subtitle,
  submitLabel,
  submitErrorMessage,
}: ModalNovoProps & {
  title: string;
  subtitle: string;
  submitLabel: string;
  submitErrorMessage: string;
}) {
  const [form, setForm] = useState<AgendamentoFormularioData>(() =>
    createInitialAgendamentoForm(
      defaultDate,
      defaultHorario,
      defaultPacienteNome,
      catalogos.pacientes,
    ),
  );
  const [fieldErrors, setFieldErrors] = useState<
    ErrosFormulario<AgendamentoFormularioData>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [errosFormulario, setErrosFormulario] = useState<
    ErroFormularioAmigavel[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      createInitialAgendamentoForm(
        defaultDate,
        defaultHorario,
        defaultPacienteNome,
        catalogos.pacientes,
      ),
    );
    setFieldErrors({});
    setFormError(null);
    setErrosFormulario([]);
    setIsSubmitting(false);
  }, [
    catalogos.pacientes,
    defaultDate,
    defaultHorario,
    defaultPacienteNome,
    open,
  ]);

  function updateField<K extends keyof AgendamentoFormularioData>(
    key: K,
    value: AgendamentoFormularioData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    setFormError(null);
    setErrosFormulario([]);
  }

  function atualizarServicoSelecionado(servicoId?: number) {
    setForm((prev) => {
      const servico = obterServicoSelecionado(catalogos.servicos, servicoId);
      const convenioContinuaValido = convenioPertenceAoServico(
        servico,
        prev.convenioId,
      );

      return {
        ...prev,
        servicoId: servicoId as AgendamentoFormularioData["servicoId"],
        convenioId: convenioContinuaValido ? prev.convenioId : undefined,
      };
    });
    setFieldErrors((prev) => ({
      ...prev,
      servicoId: undefined,
      convenioId: undefined,
    }));
    setFormError(null);
    setErrosFormulario([]);
  }

  function atualizarTipoAtendimento(
    tipoAtendimento: AgendamentoFormularioData["tipoAtendimento"],
  ) {
    setForm((prev) => ({
      ...prev,
      tipoAtendimento,
      convenioId:
        tipoAtendimento === "PARTICULAR" ? undefined : prev.convenioId,
    }));
    setFieldErrors((prev) => ({
      ...prev,
      convenioId: undefined,
    }));
    setFormError(null);
    setErrosFormulario([]);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const erroConvenioServicoAntesDoSchema = validarConvenioDoServico({
      tipoAtendimento: form.tipoAtendimento,
      servicoId: form.servicoId,
      convenioId: form.convenioId,
      servicos: catalogos.servicos,
    });

    if (erroConvenioServicoAntesDoSchema) {
      setFieldErrors((errosAtuais) => ({
        ...errosAtuais,
        convenioId: erroConvenioServicoAntesDoSchema,
      }));
      setFormError("Revise os campos destacados antes de continuar.");
      setErrosFormulario(
        montarErroConvenioServico(erroConvenioServicoAntesDoSchema),
      );
      return;
    }

    const parsed = formularioAgendamentoSchema.safeParse(form);
    if (!parsed.success) {
      setFieldErrors(mapZodErrors(parsed.error));
      const resultadoErro = normalizarErroZodFormulario(parsed.error, {
        mapaRotulosCampos: mapaRotulosCamposAgendamento,
        mensagemPadrao: "Revise os campos destacados antes de continuar.",
      });
      setFormError(resultadoErro.mensagemGlobal);
      setErrosFormulario(resultadoErro.erros);
      return;
    }

    const validacaoFuncionamento = validarAgendamentoNoFuncionamento(
      parsed.data,
      configuracaoFuncionamento,
    );
    if (!validacaoFuncionamento.valido) {
      setFieldErrors((errosAtuais) => ({
        ...errosAtuais,
        ...validacaoFuncionamento.errosCampos,
      }));
      setFormError(validacaoFuncionamento.mensagemGlobal);
      setErrosFormulario(validacaoFuncionamento.errosFormulario);
      return;
    }

    const erroConvenioServico = validarConvenioDoServico({
      tipoAtendimento: parsed.data.tipoAtendimento,
      servicoId: parsed.data.servicoId,
      convenioId: parsed.data.convenioId,
      servicos: catalogos.servicos,
    });

    if (erroConvenioServico) {
      setFieldErrors((errosAtuais) => ({
        ...errosAtuais,
        convenioId: erroConvenioServico,
      }));
      setFormError("Revise os campos destacados antes de continuar.");
      setErrosFormulario(montarErroConvenioServico(erroConvenioServico));
      return;
    }

    try {
      setIsSubmitting(true);
      setFieldErrors({});
      setFormError(null);
      setErrosFormulario([]);
      await onSubmit(parsed.data);
    } catch (error) {
      setFormError(toErrorMessage(error, submitErrorMessage));
      setErrosFormulario([]);
    } finally {
      setIsSubmitting(false);
    }
  }

  const pacienteSelecionado = getPacienteNomeById(
    catalogos.pacientes,
    form.pacienteId,
  );
  const conveniosDisponiveis = obterConveniosDisponiveis(
    catalogos,
    form.servicoId,
  );
  const dicaConvenio =
    !form.servicoId
      ? "Selecione um serviço antes de escolher o convênio."
      : conveniosDisponiveis.length === 0
        ? "Este serviço não possui convênios disponíveis."
        : "Mostrando apenas convênios vinculados ao serviço selecionado.";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      maxWidth="680px"
    >
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        {formError ? (
          <AvisoErroFormulario
            titulo={
              errosFormulario.length > 0
                ? "Verifique os campos abaixo:"
                : "Não foi possível concluir o envio."
            }
            mensagem={errosFormulario.length === 0 ? formError : undefined}
            erros={errosFormulario}
          />
        ) : null}

        <div className={styles.sectionLabel}>Paciente e atendimento</div>

        <div className={styles.fieldWithAction}>
          <FormField
            id="agendamento-paciente"
            label="Paciente"
            required
            error={fieldErrors.pacienteId}
          >
            <select
              className={styles.input}
              value={form.pacienteId ?? ""}
              onChange={(event) =>
                updateField(
                  "pacienteId",
                  toNumberOrUndefined(event.target.value) as never,
                )
              }
            >
              <option value="">Selecione um paciente...</option>
              {catalogos.pacientes.map((paciente) => (
                <option key={paciente.id} value={paciente.id}>
                  {paciente.nome}
                  {paciente.telefone ? ` • ${paciente.telefone}` : ""}
                </option>
              ))}
            </select>
          </FormField>

          <button
            type="button"
            className={styles.newPatientBtn}
            onClick={() => onNovoPaciente(pacienteSelecionado)}
            title="Cadastrar novo paciente"
            aria-label="Cadastrar novo paciente"
          >
            <FaUserPlus />
            <span>Novo</span>
          </button>
        </div>

        <p className={styles.selectHint}>
          Você pode cadastrar um novo paciente sem sair do fluxo de agendamento.
        </p>

        {renderCoverageSelector(
          form.tipoAtendimento,
          atualizarTipoAtendimento,
          "agendamento-tipo-atendimento-title",
        )}

        <FormField
          id="agendamento-servico"
          label="Serviço"
          required
          error={fieldErrors.servicoId}
        >
          <select
            className={styles.input}
            value={form.servicoId ?? ""}
            onChange={(event) =>
              atualizarServicoSelecionado(
                toNumberOrUndefined(event.target.value),
              )
            }
          >
            <option value="">Selecione o serviço...</option>
            {catalogos.servicos.map((servico) => (
              <option key={servico.id} value={servico.id}>
                {servico.nome}
              </option>
            ))}
          </select>
        </FormField>

        {form.tipoAtendimento === "CONVENIO" && (
          <FormField
            id="agendamento-convenio"
            label="Convênio"
            required
            hint={dicaConvenio}
            error={fieldErrors.convenioId}
          >
            <select
              className={styles.input}
              value={form.convenioId ?? ""}
              disabled={!form.servicoId || conveniosDisponiveis.length === 0}
              onChange={(event) =>
                updateField(
                  "convenioId",
                  toNumberOrUndefined(event.target.value),
                )
              }
            >
              <option value="">
                {conveniosDisponiveis.length
                  ? "Selecione o convênio..."
                  : dicaConvenio}
              </option>
              {conveniosDisponiveis.map((convenio) => (
                <option key={convenio.id} value={convenio.id}>
                  {convenio.nome}
                </option>
              ))}
            </select>
          </FormField>
        )}

        <div className={styles.gridTriple}>
          <FormField
            id="agendamento-data"
            label="Data"
            required
            error={fieldErrors.data}
          >
            <input
              className={styles.input}
              type="date"
              value={form.data}
              onChange={(event) => updateField("data", event.target.value)}
            />
          </FormField>

          <FormField
            id="agendamento-horario"
            label="Horário"
            required
            error={fieldErrors.horario}
          >
            <input
              className={styles.input}
              type="time"
              value={form.horario}
              onChange={(event) => updateField("horario", event.target.value)}
            />
          </FormField>

          <FormField
            id="agendamento-duracao"
            label="Duração (min)"
            required
            error={fieldErrors.duracaoMinutos}
          >
            <select
              className={styles.input}
              value={String(form.duracaoMinutos)}
              onChange={(event) =>
                updateField("duracaoMinutos", Number(event.target.value))
              }
            >
              {DURACAO_OPTIONS.map((duracao) => (
                <option key={duracao} value={duracao}>
                  {duracao}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div className={styles.gridTriple}>
          <FormField
            id="agendamento-tipo-consulta"
            label="Tipo de consulta"
            error={fieldErrors.tipoConsulta}
          >
            <select
              className={styles.input}
              value={form.tipoConsulta ?? ""}
              onChange={(event) =>
                updateField(
                  "tipoConsulta",
                  (event.target.value ||
                    undefined) as AgendamentoFormularioData["tipoConsulta"],
                )
              }
            >
              <option value="">Selecione...</option>
              {TIPO_CONSULTA_OPTIONS.map((tipoConsulta) => (
                <option key={tipoConsulta} value={tipoConsulta}>
                  {tipoConsulta}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            id="agendamento-forma-pagamento"
            label="Forma de pagamento"
            hint={
              form.tipoConsulta === "Retorno"
                ? "Consulta de retorno não gera cobrança."
                : form.tipoAtendimento === "PARTICULAR"
                  ? "Campo opcional."
                : "Opcional para convênios."
            }
            error={fieldErrors.formaPagamentoId}
            colSpan="wide"
          >
            <select
              className={styles.input}
              value={form.formaPagamentoId ?? ""}
              onChange={(event) =>
                updateField(
                  "formaPagamentoId",
                  toNumberOrUndefined(event.target.value),
                )
              }
            >
              <option value="">Selecione...</option>
              {catalogos.formasPagamento.map((formaPagamento) => (
                <option key={formaPagamento.id} value={formaPagamento.id}>
                  {formaPagamento.nome}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField
          id="agendamento-observacao"
          label="Observações"
          hint="Opcional. Registre apenas informações relevantes para o atendimento."
          error={fieldErrors.observacao}
        >
          <textarea
            className={styles.textarea}
            value={form.observacao ?? ""}
            onChange={(event) => updateField("observacao", event.target.value)}
            placeholder="Ex.: paciente prefere atendimento no início do horário."
            rows={3}
          />
        </FormField>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Salvando..." : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function ModalNovoAgendamento(props: ModalNovoProps) {
  return (
    <AgendamentoFormModal
      {...props}
      title="Novo agendamento"
      subtitle="Preencha os dados principais para criar o atendimento."
      submitLabel="Confirmar agendamento"
      submitErrorMessage="Não foi possível criar o agendamento."
    />
  );
}

export function ModalConsultaAvulsa(props: ModalConsultaAvulsaProps) {
  return (
    <AgendamentoFormModal
      {...props}
      title="Consulta avulsa"
      subtitle="Inicie um atendimento sem depender de agendamento prévio."
      submitLabel="Iniciar consulta"
      submitErrorMessage="Não foi possível iniciar a consulta avulsa."
    />
  );
}

export function ModalVisualizarAgendamento({
  open,
  onClose,
  agendamento,
  onAbrirPaciente,
  onAbrirConsulta,
  onConfirmar,
  onFaltou,
  onRemarcar,
  onCancelar,
}: ModalVisualizarProps) {
  if (!agendamento) {
    return null;
  }

  const statusUi = getStatusAgendamentoUi(agendamento.status);
  const podeEditar = isAgendamentoEditavel(agendamento.status);
  const nomeProfissional = obterNomeProfissional(agendamento);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detalhes do agendamento"
      subtitle="Visualize rapidamente as informações principais."
      maxWidth="620px"
    >
      <div className={styles.detailsRoot}>
        <div className={styles.detailsHeader}>
          <div>
            <p className={styles.detailsLabel}>Paciente</p>
            <strong className={styles.detailsPatient}>
              {agendamento.paciente}
            </strong>
          </div>
          <span
            className={`${styles.statusBadge} ${styles[statusUi.modalClassName]}`}
          >
            {statusUi.label}
          </span>
        </div>

        <div className={styles.detailsGrid}>
          <div className={styles.detailsItem}>
            <FaUser className={styles.detailsIcon} />
            <div>
              <span className={styles.detailsItemLabel}>Profissional</span>
              <span className={styles.detailsItemValue}>
                {nomeProfissional}
              </span>
            </div>
          </div>

          <div className={styles.detailsItem}>
            <FaCalendarAlt className={styles.detailsIcon} />
            <div>
              <span className={styles.detailsItemLabel}>Data</span>
              <span className={styles.detailsItemValue}>
                {formatDateForDisplay(agendamento.data)}
              </span>
            </div>
          </div>

          <div className={styles.detailsItem}>
            <FaClock className={styles.detailsIcon} />
            <div>
              <span className={styles.detailsItemLabel}>Horário e duração</span>
              <span className={styles.detailsItemValue}>
                {agendamento.horario} às {agendamento.horarioFim} (
                {agendamento.duracaoMinutos} min)
              </span>
            </div>
          </div>

          <div className={styles.detailsItem}>
            <FaStethoscope className={styles.detailsIcon} />
            <div>
              <span className={styles.detailsItemLabel}>Serviço</span>
              <span className={styles.detailsItemValue}>
                {agendamento.servico}
              </span>
            </div>
          </div>

          <div className={styles.detailsItem}>
            <FaFileMedicalAlt className={styles.detailsIcon} />
            <div>
              <span className={styles.detailsItemLabel}>Atendimento</span>
              <span className={styles.detailsItemValue}>
                {formatarTipoAtendimento(
                  agendamento.tipoAtendimento,
                  agendamento.convenio,
                )}
              </span>
            </div>
          </div>

          <div className={styles.detailsItem}>
            <FaFileMedicalAlt className={styles.detailsIcon} />
            <div>
              <span className={styles.detailsItemLabel}>Tipo de consulta</span>
              <span className={styles.detailsItemValue}>
                {formatarTipoConsulta(agendamento.tipoConsulta)}
              </span>
            </div>
          </div>

          <div className={styles.detailsItem}>
            <FaFileMedicalAlt className={styles.detailsIcon} />
            <div>
              <span className={styles.detailsItemLabel}>
                Forma de pagamento
              </span>
              <span className={styles.detailsItemValue}>
                {agendamento.formaPagamento || "Não informada"}
              </span>
            </div>
          </div>

          <div className={styles.detailsItem}>
            <FaMoneyBillWave className={styles.detailsIcon} />
            <div>
              <span className={styles.detailsItemLabel}>Valor do serviço</span>
              <span className={styles.detailsItemValue}>
                {formatarMoeda(agendamento.valorServico)}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.notesCard}>
          <div className={styles.notesHeader}>
            <FaFileMedicalAlt className={styles.detailsIcon} />
            <span>Observações</span>
          </div>
          <p className={styles.notesText}>
            {agendamento.observacao || "Nenhuma observação registrada."}
          </p>
        </div>

        <div className={styles.actions}>
          {agendamento.status === "AGUARDANDO" && (
            <button
              type="button"
              className={`${styles.btnPrimary} ${styles.detailsPrimaryAction}`}
              onClick={() => onConfirmar(agendamento.id)}
            >
              Confirmar consulta
            </button>
          )}

          {agendamento.status === "CONFIRMADO" && (
            <button
              type="button"
              className={`${styles.btnPrimary} ${styles.detailsPrimaryAction}`}
              onClick={() => void onAbrirConsulta(agendamento.id)}
            >
              Iniciar atendimento
            </button>
          )}

          {agendamento.status === "EM_ATENDIMENTO" && (
            <button
              type="button"
              className={`${styles.btnPrimary} ${styles.detailsPrimaryAction}`}
              onClick={() => void onAbrirConsulta(agendamento.id)}
            >
              Abrir consulta
            </button>
          )}

          <button
            type="button"
            className={styles.btnGhost}
            onClick={() => onAbrirPaciente(agendamento.pacienteId)}
          >
            Ver paciente
          </button>

          {podeEditar && (
            <>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => onRemarcar(agendamento.id)}
              >
                Remarcar
              </button>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => onFaltou(agendamento.id)}
              >
                Marcar falta
              </button>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => onCancelar(agendamento.id)}
              >
                Cancelar
              </button>
            </>
          )}

          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function ModalRemarcarAgendamento({
  open,
  onClose,
  agendamento,
  onSubmit,
  catalogos,
  configuracaoFuncionamento,
}: ModalRemarcarProps) {
  const [form, setForm] = useState<RemarcacaoAgendamentoFormularioData>(() =>
    createInitialRemarcarForm(agendamento),
  );
  const [fieldErrors, setFieldErrors] = useState<
    ErrosFormulario<RemarcacaoAgendamentoFormularioData>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [errosFormulario, setErrosFormulario] = useState<
    ErroFormularioAmigavel[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(createInitialRemarcarForm(agendamento));
    setFieldErrors({});
    setFormError(null);
    setErrosFormulario([]);
    setIsSubmitting(false);
  }, [agendamento, open]);

  if (!agendamento) {
    return null;
  }

  const agendamentoAtual = agendamento;

  function updateField<K extends keyof RemarcacaoAgendamentoFormularioData>(
    key: K,
    value: RemarcacaoAgendamentoFormularioData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    setFormError(null);
    setErrosFormulario([]);
  }

  function atualizarTipoAtendimentoRemarcacao(
    tipoAtendimento: RemarcacaoAgendamentoFormularioData["tipoAtendimento"],
  ) {
    setForm((prev) => {
      const servico = obterServicoSelecionado(
        catalogos.servicos,
        agendamentoAtual.servicoId,
      );
      const convenioContinuaValido = convenioPertenceAoServico(
        servico,
        prev.convenioId,
      );

      return {
        ...prev,
        tipoAtendimento,
        convenioId:
          tipoAtendimento === "PARTICULAR" || !convenioContinuaValido
            ? undefined
            : prev.convenioId,
      };
    });
    setFieldErrors((prev) => ({ ...prev, convenioId: undefined }));
    setFormError(null);
    setErrosFormulario([]);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const erroConvenioServicoAntesDoSchema = validarConvenioDoServico({
      tipoAtendimento: form.tipoAtendimento,
      servicoId: agendamentoAtual.servicoId,
      convenioId: form.convenioId,
      servicos: catalogos.servicos,
    });

    if (erroConvenioServicoAntesDoSchema) {
      setFieldErrors((errosAtuais) => ({
        ...errosAtuais,
        convenioId: erroConvenioServicoAntesDoSchema,
      }));
      setFormError("Revise os campos destacados antes de confirmar a remarcação.");
      setErrosFormulario(
        montarErroConvenioServico(erroConvenioServicoAntesDoSchema),
      );
      return;
    }

    const parsed = formularioRemarcacaoAgendamentoSchema.safeParse(form);
    if (!parsed.success) {
      setFieldErrors(mapZodErrors(parsed.error));
      const resultadoErro = normalizarErroZodFormulario(parsed.error, {
        mapaRotulosCampos: mapaRotulosCamposAgendamento,
        mensagemPadrao:
          "Revise os campos destacados antes de confirmar a remarcação.",
      });
      setFormError(resultadoErro.mensagemGlobal);
      setErrosFormulario(resultadoErro.erros);
      return;
    }

    const validacaoFuncionamento = validarAgendamentoNoFuncionamento(
      parsed.data,
      configuracaoFuncionamento,
    );
    if (!validacaoFuncionamento.valido) {
      setFieldErrors((errosAtuais) => ({
        ...errosAtuais,
        ...validacaoFuncionamento.errosCampos,
      }));
      setFormError(validacaoFuncionamento.mensagemGlobal);
      setErrosFormulario(validacaoFuncionamento.errosFormulario);
      return;
    }

    const erroConvenioServico = validarConvenioDoServico({
      tipoAtendimento: parsed.data.tipoAtendimento,
      servicoId: agendamentoAtual.servicoId,
      convenioId: parsed.data.convenioId,
      servicos: catalogos.servicos,
    });

    if (erroConvenioServico) {
      setFieldErrors((errosAtuais) => ({
        ...errosAtuais,
        convenioId: erroConvenioServico,
      }));
      setFormError("Revise os campos destacados antes de confirmar a remarcação.");
      setErrosFormulario(montarErroConvenioServico(erroConvenioServico));
      return;
    }

    try {
      setIsSubmitting(true);
      setFieldErrors({});
      setFormError(null);
      setErrosFormulario([]);
      await onSubmit(agendamentoAtual.id, parsed.data);
    } catch (error) {
      setFormError(
        toErrorMessage(error, "Não foi possível remarcar o agendamento."),
      );
      setErrosFormulario([]);
    } finally {
      setIsSubmitting(false);
    }
  }

  const conveniosDisponiveisRemarcacao = obterConveniosDisponiveis(
    catalogos,
    agendamentoAtual.servicoId,
  );
  const dicaConvenioRemarcacao =
    conveniosDisponiveisRemarcacao.length === 0
      ? "Este serviço não possui convênios disponíveis."
      : "Mostrando apenas convênios vinculados ao serviço selecionado.";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Remarcar agendamento"
      subtitle="Altere data e horário sem perder o histórico do atendimento."
      maxWidth="620px"
    >
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        {formError ? (
          <AvisoErroFormulario
            titulo={
              errosFormulario.length > 0
                ? "Verifique os campos abaixo:"
                : "Não foi possível concluir a remarcação."
            }
            mensagem={errosFormulario.length === 0 ? formError : undefined}
            erros={errosFormulario}
          />
        ) : null}

        <div className={styles.resumoRemarcacao}>
          <p className={styles.detailsLabel}>Agendamento selecionado</p>
          <strong>{agendamentoAtual.paciente}</strong>
          <span>
            {agendamentoAtual.servico} com{" "}
            {obterNomeProfissional(agendamentoAtual)}
          </span>
          <small>
            Atual: {formatDateForDisplay(agendamentoAtual.data)} às{" "}
            {agendamentoAtual.horario}
          </small>
          <small>
            Atendimento:{" "}
            {formatarTipoAtendimento(
              agendamentoAtual.tipoAtendimento,
              agendamentoAtual.convenio,
            )}
          </small>
          <div className={styles.acoesRapidasRemarcacao}>
            <button
              type="button"
              className={styles.botaoRapidoRemarcacao}
              onClick={() =>
                updateField(
                  "data",
                  addDaysToIsoDate(form.data || agendamentoAtual.data, 1),
                )
              }
            >
              +1 dia
            </button>
            <button
              type="button"
              className={styles.botaoRapidoRemarcacao}
              onClick={() =>
                updateField(
                  "data",
                  addDaysToIsoDate(form.data || agendamentoAtual.data, 7),
                )
              }
            >
              +7 dias
            </button>
          </div>
        </div>

        <div className={styles.gridTriple}>
          <FormField
            id="remarcar-data"
            label="Nova data"
            required
            error={fieldErrors.data}
          >
            <input
              className={styles.input}
              type="date"
              value={form.data}
              onChange={(event) => updateField("data", event.target.value)}
            />
          </FormField>

          <FormField
            id="remarcar-horario"
            label="Novo horário"
            required
            error={fieldErrors.horario}
          >
            <input
              className={styles.input}
              type="time"
              value={form.horario}
              onChange={(event) => updateField("horario", event.target.value)}
            />
          </FormField>

          <FormField
            id="remarcar-duracao"
            label="Duração (min)"
            required
            error={fieldErrors.duracaoMinutos}
          >
            <select
              className={styles.input}
              value={String(form.duracaoMinutos)}
              onChange={(event) =>
                updateField("duracaoMinutos", Number(event.target.value))
              }
            >
              {DURACAO_OPTIONS.map((duracao) => (
                <option key={duracao} value={duracao}>
                  {duracao}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {renderCoverageSelector(
          form.tipoAtendimento,
          atualizarTipoAtendimentoRemarcacao,
          "remarcar-tipo-atendimento-title",
        )}

        {form.tipoAtendimento === "CONVENIO" && (
          <FormField
            id="remarcar-convenio"
            hint={dicaConvenioRemarcacao}
            label="Convênio"
            required
            error={fieldErrors.convenioId}
          >
            <select
              className={styles.input}
              value={form.convenioId ?? ""}
              disabled={conveniosDisponiveisRemarcacao.length === 0}
              onChange={(event) =>
                updateField(
                  "convenioId",
                  toNumberOrUndefined(event.target.value),
                )
              }
            >
              <option value="">
                {conveniosDisponiveisRemarcacao.length
                  ? "Selecione o convênio..."
                  : dicaConvenioRemarcacao}
              </option>
              {conveniosDisponiveisRemarcacao.map((convenio) => (
                <option key={convenio.id} value={convenio.id}>
                  {convenio.nome}
                </option>
              ))}
            </select>
          </FormField>
        )}

        <div className={styles.gridTriple}>
          <FormField
            id="remarcar-tipo-consulta"
            label="Tipo de consulta"
            error={fieldErrors.tipoConsulta}
          >
            <select
              className={styles.input}
              value={form.tipoConsulta ?? ""}
              onChange={(event) =>
                updateField(
                  "tipoConsulta",
                  (event.target.value ||
                    undefined) as RemarcacaoAgendamentoFormularioData["tipoConsulta"],
                )
              }
            >
              <option value="">Selecione...</option>
              {TIPO_CONSULTA_OPTIONS.map((tipoConsulta) => (
                <option key={tipoConsulta} value={tipoConsulta}>
                  {tipoConsulta}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            id="remarcar-forma-pagamento"
            label="Forma de pagamento"
            hint={
              form.tipoConsulta === "Retorno"
                ? "Consulta de retorno não gera cobrança."
                : "Campo opcional."
            }
            error={fieldErrors.formaPagamentoId}
            colSpan="wide"
          >
            <select
              className={styles.input}
              value={form.formaPagamentoId ?? ""}
              onChange={(event) =>
                updateField(
                  "formaPagamentoId",
                  toNumberOrUndefined(event.target.value),
                )
              }
            >
              <option value="">Selecione...</option>
              {catalogos.formasPagamento.map((formaPagamento) => (
                <option key={formaPagamento.id} value={formaPagamento.id}>
                  {formaPagamento.nome}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField
          id="remarcar-observacao"
          label="Observações da remarcação"
          hint="Opcional. Descreva o motivo da mudança de horário."
          error={fieldErrors.observacao}
        >
          <textarea
            className={styles.textarea}
            value={form.observacao ?? ""}
            onChange={(event) => updateField("observacao", event.target.value)}
            placeholder="Ex.: paciente solicitou mudança para o período da tarde."
            rows={3}
          />
        </FormField>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onClose}
          >
            Voltar
          </button>
          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Salvando..." : "Confirmar remarcação"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
