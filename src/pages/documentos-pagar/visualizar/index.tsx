import { useEffect, useMemo, useState } from "react";
import {
  FaBan,
  FaCheck,
  FaChevronLeft,
  FaEdit,
  FaFileInvoiceDollar,
  FaTrash,
  FaUndo,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { Modal } from "../../../components/ui/modal";
import { NotFoundCard } from "../../../components/ui/not-found-card";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout } from "../../../components/ui/page-layout";
import { CarregamentoCentral } from "../../../components/ui/carregamento-central";
import { obterUsuarioAutenticado } from "../../../auth/session";
import { formatarDataSomenteDia } from "../../../domain/data-somente-dia";
import {
  cancelarDocumentoPagarSchema,
  marcarDocumentoPagarPagoSchema,
  type CancelarDocumentoPagarFormData,
  type MarcarDocumentoPagarPagoFormData,
} from "../../../schemas/documento-pagar.schema";
import { parseRouteNumericId } from "../../../schemas/runtime-input.schema";
import {
  documentoPagarService,
  mapCancelarDocumentoPagarFormToRequest,
  mapMarcarDocumentoPagarPagoFormToRequest,
  toErrorMessage,
  type DocumentoPagar,
  type SituacaoDocumentoPagar,
} from "../../../services/api";
import {
  usuarioPodeAlterarContaPagar,
  usuarioPodeCancelarContaPagar,
  usuarioPodeEstornarPagamentoContaPagar,
  usuarioPodeExcluirContaPagar,
  usuarioPodePagarContaPagar,
} from "../utils/permissoes-conta-pagar";
import {
  obterValorParcelaContaPagar,
  obterValorTotalContaPagar,
} from "../utils/valores-conta-pagar";
import styles from "./styles.module.css";

type ErrosFormulario = Record<string, string>;

const formularioPagamentoInicial: MarcarDocumentoPagarPagoFormData = {
  dataPagamento: "",
  observacao: undefined,
};

const formularioCancelamentoInicial: CancelarDocumentoPagarFormData = {
  motivo: "",
};

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(valor?: string | null): string {
  return formatarDataSomenteDia(valor);
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

function obterClasseSituacao(situacao: SituacaoDocumentoPagar): string {
  if (situacao === "PAGO") {
    return styles.statusPago;
  }

  if (situacao === "ATRASADO") {
    return styles.statusAtrasado;
  }

  if (situacao === "CANCELADO") {
    return styles.statusCancelado;
  }

  return styles.statusPendente;
}

function obterRotuloParcela(documento: DocumentoPagar): string | null {
  if (!documento.parcelado || documento.totalParcelas < 2) {
    return null;
  }

  return `${documento.parcelaNumero}/${documento.totalParcelas}`;
}

function obterMensagemErroCampo(
  errors: ErrosFormulario,
  field: string,
): string | null {
  return errors[field] || null;
}

function formatarOrigem(origem: DocumentoPagar["origem"]): string {
  if (origem === "MANUAL") {
    return "Manual";
  }

  return origem;
}

export function VisualizarContaPagar() {
  const navigate = useNavigate();
  const { id } = useParams();
  const documentoId = parseRouteNumericId(id);
  const usuarioAtual = obterUsuarioAutenticado();

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [estornoModalOpen, setEstornoModalOpen] = useState(false);
  const [pagamentoModalOpen, setPagamentoModalOpen] = useState(false);
  const [cancelamentoModalOpen, setCancelamentoModalOpen] = useState(false);
  const [documento, setDocumento] = useState<DocumentoPagar | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pagamentoForm, setPagamentoForm] =
    useState<MarcarDocumentoPagarPagoFormData>(formularioPagamentoInicial);
  const [cancelamentoForm, setCancelamentoForm] =
    useState<CancelarDocumentoPagarFormData>(formularioCancelamentoInicial);
  const [pagamentoErrors, setPagamentoErrors] = useState<ErrosFormulario>({});
  const [cancelamentoErrors, setCancelamentoErrors] = useState<ErrosFormulario>(
    {},
  );

  useEffect(() => {
    const targetId = documentoId;
    if (!targetId) {
      setDocumento(null);
      setIsLoading(false);
      setLoadError("Identificador de conta inválido.");
      return;
    }

    const safeDocumentoId = targetId;
    let ativo = true;

    async function carregarDocumento() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const fetched =
          await documentoPagarService.buscarPorId(safeDocumentoId);
        if (ativo) {
          setDocumento(fetched);
        }
      } catch (error) {
        if (ativo) {
          setDocumento(null);
          setLoadError(
            toErrorMessage(
              error,
              "Não foi possível carregar os dados da conta.",
            ),
          );
        }
      } finally {
        if (ativo) {
          setIsLoading(false);
        }
      }
    }

    void carregarDocumento();

    return () => {
      ativo = false;
    };
  }, [documentoId]);

  const parcelaLabel = useMemo(
    () => (documento ? obterRotuloParcela(documento) : null),
    [documento],
  );

  if (isLoading) {
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
          title={loadError ? "Falha ao carregar conta" : "Conta não encontrada"}
          description={
            loadError || "Verifique se a conta existe para continuar."
          }
          actionLabel="Voltar para contas"
          onAction={() => navigate("/financeiro/contas-a-pagar")}
        />
      </PageLayout>
    );
  }

  const documentoAtual = documento;
  const documentoIdAtual = documentoAtual.id;
  const podeMarcarComoPago = usuarioPodePagarContaPagar(
    usuarioAtual,
    documentoAtual,
  );
  const podeCancelar = usuarioPodeCancelarContaPagar(
    usuarioAtual,
    documentoAtual,
  );
  const podeAlterarConta = usuarioPodeAlterarContaPagar(
    usuarioAtual,
    documentoAtual,
  );
  const podeExcluirConta = usuarioPodeExcluirContaPagar(usuarioAtual);
  const podeEstornarPagamento = usuarioPodeEstornarPagamentoContaPagar(
    usuarioAtual,
    documentoAtual,
  );
  const valorParcela = obterValorParcelaContaPagar(documentoAtual);
  const valorTotal = obterValorTotalContaPagar(documentoAtual);

  async function recarregarDocumento() {
    const refreshed = await documentoPagarService.buscarPorId(documentoIdAtual);
    setDocumento(refreshed);
  }

  function resetPagamentoForm() {
    setPagamentoForm(formularioPagamentoInicial);
    setPagamentoErrors({});
  }

  function resetCancelamentoForm() {
    setCancelamentoForm(formularioCancelamentoInicial);
    setCancelamentoErrors({});
  }

  function fecharModalPagamento() {
    setPagamentoModalOpen(false);
    resetPagamentoForm();
  }

  function fecharModalCancelamento() {
    setCancelamentoModalOpen(false);
    resetCancelamentoForm();
  }

  async function handleDelete() {
    try {
      setActionError(null);
      await documentoPagarService.remover(documentoIdAtual);
      navigate("/financeiro/contas-a-pagar");
    } catch (error) {
      setActionError(
        toErrorMessage(error, "Não foi possível excluir a conta a pagar."),
      );
      setConfirmDeleteOpen(false);
    }
  }

  async function estornarPagamento() {
    try {
      setActionError(null);
      await documentoPagarService.estornarPagamento(documentoIdAtual);
      setEstornoModalOpen(false);
      await recarregarDocumento();
    } catch (error) {
      setActionError(
        toErrorMessage(error, "Não foi possível estornar o pagamento."),
      );
      setEstornoModalOpen(false);
    }
  }

  async function confirmarPagamento() {
    const parsed = marcarDocumentoPagarPagoSchema.safeParse(pagamentoForm);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setPagamentoErrors({
        dataPagamento: fieldErrors.dataPagamento?.[0] || "",
        observacao: fieldErrors.observacao?.[0] || "",
      });
      return;
    }

    try {
      setActionError(null);
      setPagamentoErrors({});
      await documentoPagarService.marcarComoPago(
        documentoIdAtual,
        mapMarcarDocumentoPagarPagoFormToRequest(parsed.data),
      );
      fecharModalPagamento();
      await recarregarDocumento();
    } catch (error) {
      setActionError(
        toErrorMessage(error, "Não foi possível registrar o pagamento."),
      );
    }
  }

  async function confirmarCancelamento() {
    const parsed = cancelarDocumentoPagarSchema.safeParse(cancelamentoForm);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setCancelamentoErrors({
        motivo: fieldErrors.motivo?.[0] || "",
      });
      return;
    }

    try {
      setActionError(null);
      setCancelamentoErrors({});
      await documentoPagarService.cancelar(
        documentoIdAtual,
        mapCancelarDocumentoPagarFormToRequest(parsed.data),
      );
      fecharModalCancelamento();
      await recarregarDocumento();
    } catch (error) {
      setActionError(
        toErrorMessage(error, "Não foi possível cancelar a conta a pagar."),
      );
    }
  }

  return (
    <PageLayout>
      <Modal
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Excluir conta"
        subtitle="Essa ação remove a conta da base atual."
        maxWidth="480px"
      >
        <div className={styles.confirmBody}>
          <p>
            Deseja realmente excluir a conta{" "}
            <strong>{documentoAtual.descricao}</strong>?
          </p>
          <p>Essa ação não pode ser desfeita.</p>

          <div className={styles.confirmActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => setConfirmDeleteOpen(false)}
            >
              Cancelar
            </button>
            {podeExcluirConta ? (
              <button
                type="button"
                className={styles.btnDanger}
                onClick={() => void handleDelete()}
              >
                Excluir conta
              </button>
            ) : null}
          </div>
        </div>
      </Modal>

      <Modal
        open={estornoModalOpen}
        onClose={() => setEstornoModalOpen(false)}
        title="Estornar pagamento"
        subtitle="Essa ação reabre a conta e remove a liquidação financeira."
        maxWidth="480px"
      >
        <div className={styles.confirmBody}>
          <p>
            Deseja realmente estornar o pagamento da conta{" "}
            <strong>{documentoAtual.descricao}</strong>?
          </p>
          <p>A conta voltará para a situação pendente.</p>

          <div className={styles.confirmActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => setEstornoModalOpen(false)}
            >
              Voltar
            </button>
            <button
              type="button"
              className={styles.btnDanger}
              onClick={() => void estornarPagamento()}
            >
              Estornar pagamento
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={pagamentoModalOpen}
        onClose={fecharModalPagamento}
        title="Registrar pagamento"
        subtitle="Informe os dados opcionais para dar baixa nesta conta."
        maxWidth="520px"
      >
        <div className={styles.formGrid}>
          <label className={styles.formField}>
            <span>Data de pagamento</span>
            <input
              type="date"
              value={pagamentoForm.dataPagamento || ""}
              onChange={(event) =>
                setPagamentoForm((prev) => ({
                  ...prev,
                  dataPagamento: event.target.value,
                }))
              }
            />
            {obterMensagemErroCampo(pagamentoErrors, "dataPagamento") ? (
              <small className={styles.fieldError}>
                {obterMensagemErroCampo(pagamentoErrors, "dataPagamento")}
              </small>
            ) : null}
          </label>

          <label className={styles.formField}>
            <span>Observação</span>
            <textarea
              rows={4}
              value={pagamentoForm.observacao || ""}
              placeholder="Observação opcional sobre o pagamento"
              onChange={(event) =>
                setPagamentoForm((prev) => ({
                  ...prev,
                  observacao: event.target.value || undefined,
                }))
              }
            />
            {obterMensagemErroCampo(pagamentoErrors, "observacao") ? (
              <small className={styles.fieldError}>
                {obterMensagemErroCampo(pagamentoErrors, "observacao")}
              </small>
            ) : null}
          </label>

          <div className={styles.confirmActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={fecharModalPagamento}
            >
              Voltar
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => void confirmarPagamento()}
            >
              Confirmar pagamento
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={cancelamentoModalOpen}
        onClose={fecharModalCancelamento}
        title="Cancelar conta"
        subtitle="Essa ação interrompe o fluxo financeiro deste documento."
        maxWidth="520px"
      >
        <div className={styles.formGrid}>
          <label className={styles.formField}>
            <span>Motivo do cancelamento</span>
            <textarea
              rows={4}
              value={cancelamentoForm.motivo}
              placeholder="Informe o motivo do cancelamento"
              onChange={(event) =>
                setCancelamentoForm((prev) => ({
                  ...prev,
                  motivo: event.target.value,
                }))
              }
            />
            {obterMensagemErroCampo(cancelamentoErrors, "motivo") ? (
              <small className={styles.fieldError}>
                {obterMensagemErroCampo(cancelamentoErrors, "motivo")}
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
              onClick={() => void confirmarCancelamento()}
            >
              Confirmar cancelamento
            </button>
          </div>
        </div>
      </Modal>

      <PageHeader
        title="Conta a pagar"
        left={
          <div className={styles.titleWithBack}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => navigate("/financeiro/contas-a-pagar")}
              aria-label="Voltar para a lista de contas a pagar"
            >
              <FaChevronLeft />
            </button>
            <div>
              <h1 className={styles.pageTitle}>{documentoAtual.descricao}</h1>
              <p className={styles.pageSubtitle}>
                Vencimento {formatarData(documentoAtual.dataVencimento)}
                {parcelaLabel ? ` • Parcela ${parcelaLabel}` : ""}
              </p>
            </div>
          </div>
        }
        right={
          <div className={styles.headerActions}>
            {podeMarcarComoPago && (
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => setPagamentoModalOpen(true)}
              >
                <FaCheck />
                <span>Registrar pagamento</span>
              </button>
            )}
            {podeCancelar && (
              <button
                type="button"
                className={styles.btnDanger}
                onClick={() => setCancelamentoModalOpen(true)}
              >
                <FaBan />
                <span>Cancelar conta</span>
              </button>
            )}
            {podeEstornarPagamento ? (
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setEstornoModalOpen(true)}
              >
                <FaUndo />
                <span>Estornar pagamento</span>
              </button>
            ) : null}
            {documentoAtual.status !== "CANCELADO" && podeAlterarConta && (
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() =>
                  navigate(
                    `/financeiro/contas-a-pagar/${documentoIdAtual}/editar`,
                  )
                }
              >
                <FaEdit />
                <span>Editar</span>
              </button>
            )}
            {podeExcluirConta ? (
              <button
                type="button"
                className={styles.btnDanger}
                onClick={() => setConfirmDeleteOpen(true)}
              >
                <FaTrash />
                <span>Excluir</span>
              </button>
            ) : null}
          </div>
        }
      />

      {actionError ? (
        <section className={styles.notFoundCard}>
          <p>{actionError}</p>
        </section>
      ) : null}

      <section className={styles.kpiGrid}>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Valor da parcela</span>
          <strong className={styles.kpiValue}>
            {formatarMoeda(valorParcela)}
          </strong>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Valor total</span>
          <strong className={styles.kpiValue}>
            {formatarMoeda(valorTotal)}
          </strong>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Situação</span>
          <strong className={styles.kpiValue}>
            <span
              className={`${styles.statusBadge} ${obterClasseSituacao(
                documentoAtual.situacao,
              )}`}
            >
              {formatarSituacao(documentoAtual.situacao)}
            </span>
          </strong>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Pagamento</span>
          <strong className={styles.kpiValue}>
            {formatarData(documentoAtual.dataPagamento)}
          </strong>
        </article>
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>
            <FaFileInvoiceDollar className={styles.sectionIcon} />
            Dados principais
          </h2>
          <div className={styles.infoGrid}>
            <div>
              <span className={styles.infoLabel}>Descrição</span>
              <p className={styles.infoValue}>{documentoAtual.descricao}</p>
            </div>
            <div>
              <span className={styles.infoLabel}>Valor da parcela</span>
              <p className={styles.infoValue}>{formatarMoeda(valorParcela)}</p>
            </div>
            <div>
              <span className={styles.infoLabel}>Valor total</span>
              <p className={styles.infoValue}>{formatarMoeda(valorTotal)}</p>
            </div>
            <div>
              <span className={styles.infoLabel}>Data de vencimento</span>
              <p className={styles.infoValue}>
                {formatarData(documentoAtual.dataVencimento)}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>Status base</span>
              <p className={styles.infoValue}>
                {formatarSituacao(documentoAtual.status)}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>Situação</span>
              <p className={styles.infoValue}>
                {formatarSituacao(documentoAtual.situacao)}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>Origem</span>
              <p className={styles.infoValue}>
                {formatarOrigem(documentoAtual.origem)}
              </p>
            </div>
          </div>
        </section>

        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>Classificação</h2>
          <div className={styles.infoGrid}>
            <div>
              <span className={styles.infoLabel}>Categoria</span>
              <p className={styles.infoValue}>
                {documentoAtual.categoria || "Sem categoria"}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>Parcelamento</span>
              <p className={styles.infoValue}>
                {parcelaLabel ? `Parcela ${parcelaLabel}` : "Conta única"}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>Lançamento</span>
              <p className={styles.infoValue}>
                {documentoAtual.lancamentoId || "-"}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>Dias em atraso</span>
              <p className={styles.infoValue}>{documentoAtual.diasAtraso}</p>
            </div>
          </div>
        </section>

        <section className={`${styles.sectionCard} ${styles.colSpan2}`}>
          <h2 className={styles.sectionTitle}>Observações</h2>
          <p className={styles.notesText}>
            {documentoAtual.observacao ||
              "Nenhuma observação cadastrada para esta despesa."}
          </p>

          {(documentoAtual.dataCancelamento ||
            documentoAtual.motivoCancelamento) && (
            <div className={styles.infoGrid}>
              <div>
                <span className={styles.infoLabel}>Data de cancelamento</span>
                <p className={styles.infoValue}>
                  {formatarData(documentoAtual.dataCancelamento)}
                </p>
              </div>
              <div>
                <span className={styles.infoLabel}>Motivo do cancelamento</span>
                <p className={styles.infoValue}>
                  {documentoAtual.motivoCancelamento || "-"}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </PageLayout>
  );
}
