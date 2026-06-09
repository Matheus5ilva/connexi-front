import { useEffect, useState } from "react";
import {
  FaBan,
  FaCalendarAlt,
  FaCheck,
  FaChevronLeft,
  FaMoneyBillWave,
  FaUndo,
  FaUser,
} from "react-icons/fa";
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";
import { Modal } from "../../../components/ui/modal";
import { NotFoundCard } from "../../../components/ui/not-found-card";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout } from "../../../components/ui/page-layout";
import { CarregamentoCentral } from "../../../components/ui/carregamento-central";
import { getSegmentoLabels } from "../../../config/segmento-labels";
import type { LayoutOutletContext } from "../../../layout";
import { resolveReturnTo } from "../../../routes/return-to";
import { parseRouteNumericId } from "../../../schemas/runtime-input.schema";
import {
  cancelarDocumentoReceberSchema,
  marcarDocumentoRecebidoSchema,
  type CancelarDocumentoReceberFormData,
  type MarcarDocumentoRecebidoFormData,
} from "../../../schemas/documento-receber.schema";
import {
  documentoReceberService,
  mapCancelarDocumentoReceberFormToRequest,
  mapMarcarDocumentoRecebidoFormToRequest,
  toErrorMessage,
  type DocumentoReceber,
} from "../../../services/api";
import {
  formatarData,
  formatarMoeda,
  formatarPercentualTaxa,
  formatarRecebimento,
  formatarSituacaoDocumentoReceber,
  formatarStatusDocumentoReceber,
  formatarTipoAtendimento,
  obterRotuloParcela,
} from "../formatadores";
import styles from "./styles.module.css";

type ErrosFormulario = Record<string, string>;

const formularioRecebimentoInicial: MarcarDocumentoRecebidoFormData = {
  dataRecebimento: "",
  observacao: undefined,
};

const formularioCancelamentoInicial: CancelarDocumentoReceberFormData = {
  motivo: "",
};

function renderizarBadgeSituacao(situacao: DocumentoReceber["situacao"]) {
  const label = formatarSituacaoDocumentoReceber(situacao);

  if (situacao === "RECEBIDO") {
    return (
      <span className={`${styles.statusBadge} ${styles.statusRecebido}`}>
        {label}
      </span>
    );
  }

  if (situacao === "ATRASADO") {
    return (
      <span className={`${styles.statusBadge} ${styles.statusAtrasado}`}>
        {label}
      </span>
    );
  }

  if (situacao === "CANCELADO") {
    return (
      <span className={`${styles.statusBadge} ${styles.statusCancelado}`}>
        {label}
      </span>
    );
  }

  return (
    <span className={`${styles.statusBadge} ${styles.statusPrevisto}`}>
      {label}
    </span>
  );
}

function obterMensagemErroCampo(
  errors: ErrosFormulario,
  field: string,
): string | null {
  return errors[field] || null;
}

export function VisualizarContaReceber() {
  const navigate = useNavigate();
  const location = useLocation();
  const { segmento } = useOutletContext<LayoutOutletContext>();
  const labels = getSegmentoLabels(segmento);
  const pessoaMinuscula = labels.pessoa.toLowerCase();
  const returnTo = resolveReturnTo(location, "/financeiro/contas-a-receber");
  const { id } = useParams();
  const documentoId = parseRouteNumericId(id);

  const [documento, setDocumento] = useState<DocumentoReceber | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const [receberModalOpen, setReceberModalOpen] = useState(false);
  const [cancelarModalOpen, setCancelarModalOpen] = useState(false);
  const [estornarModalOpen, setEstornarModalOpen] = useState(false);
  const [receberForm, setReceberForm] =
    useState<MarcarDocumentoRecebidoFormData>(formularioRecebimentoInicial);
  const [cancelarForm, setCancelarForm] =
    useState<CancelarDocumentoReceberFormData>(formularioCancelamentoInicial);
  const [receberErrors, setReceberErrors] = useState<ErrosFormulario>({});
  const [cancelarErrors, setCancelarErrors] = useState<ErrosFormulario>({});

  useEffect(() => {
    const targetId = documentoId;
    if (!targetId) {
      setDocumento(null);
      setCarregando(false);
      setErroCarregamento("Identificador de conta a receber inválido.");
      return;
    }

    const safeDocumentoId = targetId;
    let isMounted = true;

    async function loadDocumento() {
      setCarregando(true);
      setErroCarregamento(null);

      try {
        const response = await documentoReceberService.buscarPorId(safeDocumentoId);
        if (isMounted) {
          setDocumento(response);
        }
      } catch (error) {
        if (isMounted) {
          setDocumento(null);
          setErroCarregamento(
            toErrorMessage(error, "Não foi possível carregar a conta a receber."),
          );
        }
      } finally {
        if (isMounted) {
          setCarregando(false);
        }
      }
    }

    void loadDocumento();

    return () => {
      isMounted = false;
    };
  }, [documentoId]);

  if (carregando) {
    return (
      <PageLayout>
        <CarregamentoCentral />
      </PageLayout>
    );
  }

  if (!documento) {
    return (
      <PageLayout>
        <NotFoundCard
          title={
            erroCarregamento ? "Falha ao carregar conta" : "Conta a receber não encontrada"
          }
          description={
            erroCarregamento || "Verifique se a conta ainda está disponível no financeiro."
          }
          actionLabel="Voltar para contas a receber"
          onAction={() => navigate(returnTo)}
        />
      </PageLayout>
    );
  }

  const documentoAtual = documento;
  const parcelaLabel = obterRotuloParcela(documentoAtual);
  const podeRegistrarRecebimento = documentoAtual.status === "PREVISTO";
  const podeCancelar = documentoAtual.status === "PREVISTO";
  const podeEstornarRecebimento = documentoAtual.status === "RECEBIDO";

  async function recarregarDocumento() {
    const refreshed = await documentoReceberService.buscarPorId(documentoAtual.id);
    setDocumento(refreshed);
  }

  function abrirPaciente() {
    navigate(`/pacientes/${documentoAtual.pacienteId}`, {
      state: { returnTo },
    });
  }

  function resetarFormularioRecebimento() {
    setReceberForm(formularioRecebimentoInicial);
    setReceberErrors({});
  }

  function resetarFormularioCancelamento() {
    setCancelarForm(formularioCancelamentoInicial);
    setCancelarErrors({});
  }

  function fecharModalRecebimento() {
    setReceberModalOpen(false);
    resetarFormularioRecebimento();
  }

  function fecharModalCancelamento() {
    setCancelarModalOpen(false);
    resetarFormularioCancelamento();
  }

  function fecharModalEstorno() {
    setEstornarModalOpen(false);
  }

  async function enviarRecebimento() {
    const parsed = marcarDocumentoRecebidoSchema.safeParse(receberForm);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setReceberErrors({
        dataRecebimento: fieldErrors.dataRecebimento?.[0] || "",
        observacao: fieldErrors.observacao?.[0] || "",
      });
      return;
    }

    try {
      setErroAcao(null);
      setReceberErrors({});
      await documentoReceberService.marcarComoRecebido(
        documentoAtual.id,
        mapMarcarDocumentoRecebidoFormToRequest(parsed.data),
      );
      fecharModalRecebimento();
      await recarregarDocumento();
    } catch (error) {
      setErroAcao(
        toErrorMessage(error, "Não foi possível registrar o recebimento."),
      );
    }
  }

  async function enviarCancelamento() {
    const parsed = cancelarDocumentoReceberSchema.safeParse(cancelarForm);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setCancelarErrors({
        motivo: fieldErrors.motivo?.[0] || "",
      });
      return;
    }

    try {
      setErroAcao(null);
      setCancelarErrors({});
      await documentoReceberService.cancelar(
        documentoAtual.id,
        mapCancelarDocumentoReceberFormToRequest(parsed.data),
      );
      fecharModalCancelamento();
      await recarregarDocumento();
    } catch (error) {
      setErroAcao(
        toErrorMessage(error, "Não foi possível cancelar a conta a receber."),
      );
    }
  }

  async function enviarEstornoRecebimento() {
    try {
      setErroAcao(null);
      await documentoReceberService.estornarRecebimento(documentoAtual.id);
      fecharModalEstorno();
      await recarregarDocumento();
    } catch (error) {
      setErroAcao(
        toErrorMessage(error, "Não foi possível estornar o recebimento."),
      );
    }
  }

  return (
    <PageLayout>
      <Modal
        open={receberModalOpen}
        onClose={fecharModalRecebimento}
        title="Registrar recebimento"
        subtitle="Informe os dados opcionais para dar baixa nesta conta."
        maxWidth="520px"
      >
        <div className={styles.formGrid}>
          <label className={styles.formField}>
            <span>Data de recebimento</span>
            <input
              type="date"
              value={receberForm.dataRecebimento || ""}
              onChange={(event) =>
                setReceberForm((prev) => ({
                  ...prev,
                  dataRecebimento: event.target.value,
                }))
              }
            />
            {obterMensagemErroCampo(receberErrors, "dataRecebimento") ? (
              <small className={styles.fieldError}>
                {obterMensagemErroCampo(receberErrors, "dataRecebimento")}
              </small>
            ) : null}
          </label>

          <label className={styles.formField}>
            <span>Observação</span>
            <textarea
              rows={4}
              value={receberForm.observacao || ""}
              placeholder="Observação opcional sobre o recebimento"
              onChange={(event) =>
                setReceberForm((prev) => ({
                  ...prev,
                  observacao: event.target.value || undefined,
                }))
              }
            />
            {obterMensagemErroCampo(receberErrors, "observacao") ? (
              <small className={styles.fieldError}>
                {obterMensagemErroCampo(receberErrors, "observacao")}
              </small>
            ) : null}
          </label>

          <div className={styles.confirmActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={fecharModalRecebimento}
            >
              Voltar
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => void enviarRecebimento()}
            >
              Confirmar recebimento
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={cancelarModalOpen}
        onClose={fecharModalCancelamento}
        title="Cancelar conta a receber"
        subtitle="Essa ação impede novas baixas neste documento."
        maxWidth="520px"
      >
        <div className={styles.formGrid}>
          <label className={styles.formField}>
            <span>Motivo do cancelamento</span>
            <textarea
              rows={4}
              value={cancelarForm.motivo || ""}
              placeholder="Informe o motivo do cancelamento"
              onChange={(event) =>
                setCancelarForm((prev) => ({
                  ...prev,
                  motivo: event.target.value,
                }))
              }
            />
            {obterMensagemErroCampo(cancelarErrors, "motivo") ? (
              <small className={styles.fieldError}>
                {obterMensagemErroCampo(cancelarErrors, "motivo")}
              </small>
            ) : null}
          </label>

          <div className={styles.confirmActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={fecharModalCancelamento}
            >
              Voltar
            </button>
            <button
              type="button"
              className={styles.btnDanger}
              onClick={() => void enviarCancelamento()}
            >
              Confirmar cancelamento
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={estornarModalOpen}
        onClose={fecharModalEstorno}
        title="Estornar recebimento"
        subtitle="O documento voltará para pendente e deixará de ser considerado recebido."
        maxWidth="520px"
      >
        <div className={styles.formGrid}>
          <p className={styles.infoValue}>
            Confirme para estornar o recebimento desta conta a receber.
          </p>

          <div className={styles.confirmActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={fecharModalEstorno}
            >
              Voltar
            </button>
            <button
              type="button"
              className={styles.btnDanger}
              onClick={() => void enviarEstornoRecebimento()}
            >
              Estornar recebimento
            </button>
          </div>
        </div>
      </Modal>

      <PageHeader
        title="Conta a receber"
        subtitle="Detalhes financeiros do documento gerado pelo backend"
        left={
          <div className={styles.titleWithBack}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => navigate(returnTo)}
              aria-label="Voltar para a lista de contas a receber"
            >
              <FaChevronLeft />
            </button>
            <div>
              <h1 className={styles.pageTitle}>{documentoAtual.pacienteNome}</h1>
              <p className={styles.pageSubtitle}>{documentoAtual.servicoNome}</p>
            </div>
          </div>
        }
        right={
          <div className={styles.headerActions}>
            <button type="button" className={styles.btnSecondary} onClick={abrirPaciente}>
              <FaUser />
              <span>Ver {pessoaMinuscula}</span>
            </button>
            {podeRegistrarRecebimento ? (
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => setReceberModalOpen(true)}
              >
                <FaCheck />
                <span>Registrar recebimento</span>
              </button>
            ) : null}
            {podeEstornarRecebimento ? (
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setEstornarModalOpen(true)}
              >
                <FaUndo />
                <span>Estornar recebimento</span>
              </button>
            ) : null}
            {podeCancelar ? (
              <button
                type="button"
                className={styles.btnDanger}
                onClick={() => setCancelarModalOpen(true)}
              >
                <FaBan />
                <span>Cancelar conta</span>
              </button>
            ) : null}
          </div>
        }
      />

      {erroAcao ? <section className={styles.feedbackCard}>{erroAcao}</section> : null}

      <section className={styles.kpiGrid}>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Valor líquido</span>
          <strong className={styles.kpiValue}>
            {formatarMoeda(documentoAtual.valorLiquido)}
          </strong>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Valor bruto</span>
          <strong className={styles.kpiValue}>
            {formatarMoeda(documentoAtual.valorBruto)}
          </strong>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Taxa</span>
          <strong className={styles.kpiValue}>
            {formatarPercentualTaxa(documentoAtual.percentualTaxa)}
          </strong>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Situação</span>
          <strong className={styles.kpiValue}>
            {renderizarBadgeSituacao(documentoAtual.situacao)}
          </strong>
        </article>
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>
            <FaCalendarAlt className={styles.sectionIcon} />
            Dados do recebimento
          </h2>
          <div className={styles.infoGrid}>
            <div>
              <span className={styles.infoLabel}>{labels.pessoa}</span>
              <p className={styles.infoValue}>{documentoAtual.pacienteNome}</p>
            </div>
            <div>
              <span className={styles.infoLabel}>{labels.servico}</span>
              <p className={styles.infoValue}>{documentoAtual.servicoNome}</p>
            </div>
            <div>
              <span className={styles.infoLabel}>Descrição</span>
              <p className={styles.infoValue}>{documentoAtual.descricao}</p>
            </div>
            <div>
              <span className={styles.infoLabel}>Tipo de atendimento</span>
              <p className={styles.infoValue}>
                {formatarTipoAtendimento(
                  documentoAtual.tipoAtendimento,
                  labels.parceria,
                )}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>{labels.parceria}</span>
              <p className={styles.infoValue}>{documentoAtual.convenioNome || "-"}</p>
            </div>
            <div>
              <span className={styles.infoLabel}>Forma de pagamento</span>
              <p className={styles.infoValue}>{documentoAtual.formaPagamento}</p>
            </div>
            <div>
              <span className={styles.infoLabel}>Tipo de recebimento</span>
              <p className={styles.infoValue}>{formatarRecebimento(documentoAtual)}</p>
            </div>
            <div>
              <span className={styles.infoLabel}>Parcela</span>
              <p className={styles.infoValue}>
                {parcelaLabel ? `Parcela ${parcelaLabel}` : "Conta única"}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>Data do atendimento</span>
              <p className={styles.infoValue}>
                {formatarData(documentoAtual.dataAtendimento)}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>Recebimento previsto</span>
              <p className={styles.infoValue}>
                {formatarData(documentoAtual.dataPrevistaRecebimento)}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>Data de recebimento</span>
              <p className={styles.infoValue}>
                {formatarData(documentoAtual.dataRecebimento)}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>Status do documento</span>
              <p className={styles.infoValue}>
                {formatarStatusDocumentoReceber(documentoAtual.status)}
              </p>
            </div>
          </div>
        </section>

        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>
            <FaMoneyBillWave className={styles.sectionIcon} />
            Composição financeira
          </h2>
          <div className={styles.infoGrid}>
            <div>
              <span className={styles.infoLabel}>Valor original</span>
              <p className={styles.infoValue}>
                {formatarMoeda(documentoAtual.valorOriginal)}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>Desconto</span>
              <p className={styles.infoValue}>
                {formatarMoeda(documentoAtual.valorDesconto)}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>Valor bruto</span>
              <p className={styles.infoValue}>
                {formatarMoeda(documentoAtual.valorBruto)}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>Percentual de taxa</span>
              <p className={styles.infoValue}>
                {formatarPercentualTaxa(documentoAtual.percentualTaxa)}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>Valor da taxa</span>
              <p className={styles.infoValue}>
                {formatarMoeda(documentoAtual.valorTaxa)}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>Valor líquido</span>
              <p className={styles.infoValue}>
                {formatarMoeda(documentoAtual.valorLiquido)}
              </p>
            </div>
          </div>
        </section>

        <section className={`${styles.sectionCard} ${styles.colSpan2}`}>
          <h2 className={styles.sectionTitle}>Observações</h2>
          <p className={styles.notesText}>
            {documentoAtual.observacao ||
              "Nenhuma observação vinculada a este documento."}
          </p>
        </section>

        {documentoAtual.status === "CANCELADO" || documentoAtual.motivoCancelamento ? (
          <section className={`${styles.sectionCard} ${styles.colSpan2}`}>
            <h2 className={styles.sectionTitle}>Cancelamento</h2>
            <div className={styles.infoGrid}>
              <div>
                <span className={styles.infoLabel}>Data de cancelamento</span>
                <p className={styles.infoValue}>
                  {formatarData(documentoAtual.dataCancelamento)}
                </p>
              </div>
              <div>
                <span className={styles.infoLabel}>Motivo</span>
                <p className={styles.infoValue}>
                  {documentoAtual.motivoCancelamento || "Não informado"}
                </p>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </PageLayout>
  );
}




