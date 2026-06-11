import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { FormPageHeader } from "../../../components/ui/form-page-header";
import { Modal } from "../../../components/ui/modal";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout } from "../../../components/ui/page-layout";
import { CarregamentoCentral } from "../../../components/ui/carregamento-central";
import { encerrarSessaoAutenticada } from "../../../auth/session";
import { getSegmentoLabels } from "../../../config/segmento-labels";
import type { LayoutOutletContext } from "../../../layout";
import { resolveReturnTo } from "../../../routes/return-to";
import type { ConsultorioFormularioData } from "../../../schemas/consultorio.schema";
import {
  consultorioService,
  mapConsultorioParaFormulario,
  mapFormularioConsultorioParaAtualizarRequest,
  mapFormularioConsultorioParaCriarRequest,
  toErrorMessage,
  type Consultorio as ConsultorioDetalhe,
} from "../../../services/api";
import { FormularioConsultorio } from "../components/formulario-consultorio";
import styles from "../styles.module.css";

const valoresIniciaisVazios: ConsultorioFormularioData = {
  nome: "",
  ativo: true,
  razaoSocial: "",
  cnpj: "",
  email: "",
  telefone: "",
  whatsapp: "",
  cep: "",
  logradouro: "",
  numero: undefined,
  complemento: "",
  bairro: "",
  nomeCidade: "",
  codigoIbgeCidade: "",
};

export function EditarConsultorio() {
  const navigate = useNavigate();
  const location = useLocation();
  const { segmento } = useOutletContext<LayoutOutletContext>();
  const labels = getSegmentoLabels(segmento);
  const negocioMinusculo = labels.negocioEntidade;
  const negocioTitulo =
    negocioMinusculo.charAt(0).toUpperCase() + negocioMinusculo.slice(1);
  const returnTo = resolveReturnTo(location, "/consultorio");
  const [consultorio, setConsultorio] = useState<ConsultorioDetalhe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadCounter, setReloadCounter] = useState(0);
  const [valoresInativacaoPendentes, setValoresInativacaoPendentes] =
    useState<ConsultorioFormularioData | null>(null);
  const [erroInativacao, setErroInativacao] = useState<string | null>(null);
  const [salvandoInativacao, setSalvandoInativacao] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function carregarConsultorio() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const consultorioAtual = await consultorioService.buscarPrincipal();

        if (!isMounted) {
          return;
        }

        setConsultorio(consultorioAtual);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setConsultorio(null);
        setLoadError(
          toErrorMessage(
            error,
            `Não foi possível carregar o ${negocioMinusculo}.`,
          ),
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void carregarConsultorio();

    return () => {
      isMounted = false;
    };
  }, [negocioMinusculo, reloadCounter]);

  const initialValues = useMemo<ConsultorioFormularioData>(() => {
    if (!consultorio) {
      return valoresIniciaisVazios;
    }

    return mapConsultorioParaFormulario(consultorio);
  }, [consultorio]);

  async function salvarConsultorio(values: ConsultorioFormularioData) {
    if (consultorio) {
      await consultorioService.atualizar(
        consultorio.id,
        mapFormularioConsultorioParaAtualizarRequest(values),
      );
    } else {
      await consultorioService.criar(
        mapFormularioConsultorioParaCriarRequest(values),
      );
    }

    if (consultorio && !values.ativo) {
      encerrarSessaoAutenticada();
      navigate("/tenant-inexistente", { replace: true });
      return;
    }

    navigate("/consultorio", {
      state: { returnTo },
    });
  }

  async function handleSubmit(values: ConsultorioFormularioData) {
    if (consultorio?.ativo && !values.ativo) {
      setErroInativacao(null);
      setValoresInativacaoPendentes(values);
      return;
    }

    await salvarConsultorio(values);
  }

  function fecharModalInativacao() {
    if (salvandoInativacao) {
      return;
    }

    setValoresInativacaoPendentes(null);
    setErroInativacao(null);
  }

  async function confirmarInativacaoConsultorio() {
    if (!valoresInativacaoPendentes) {
      return;
    }

    try {
      setSalvandoInativacao(true);
      setErroInativacao(null);
      await salvarConsultorio(valoresInativacaoPendentes);
      setValoresInativacaoPendentes(null);
    } catch (error) {
      setErroInativacao(
        toErrorMessage(
          error,
          `Não foi possível inativar o ${negocioMinusculo}.`,
        ),
      );
    } finally {
      setSalvandoInativacao(false);
    }
  }

  return (
    <PageLayout>
      <Modal
        open={Boolean(valoresInativacaoPendentes)}
        onClose={fecharModalInativacao}
        title="Confirmar inativação"
        subtitle="Esta ação suspende o acesso deste tenant."
        maxWidth="520px"
      >
        <div className={styles.modalConfirmacao}>
          <p className={styles.modalTexto}>
            Ao inativar este {negocioMinusculo}, o acesso ao sistema será
            suspenso.
          </p>

          {erroInativacao ? (
            <div className="alert alert-danger" role="alert">
              {erroInativacao}
            </div>
          ) : null}

          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={fecharModalInativacao}
              disabled={salvandoInativacao}
            >
              Voltar
            </button>
            <button
              type="button"
              className={styles.btnDanger}
              onClick={() => void confirmarInativacaoConsultorio()}
              disabled={salvandoInativacao}
            >
              {salvandoInativacao ? "Inativando..." : "Confirmar inativação"}
            </button>
          </div>
        </div>
      </Modal>

      <PageHeader
        title={
          consultorio
            ? `Editar ${negocioMinusculo}`
            : `Cadastrar ${negocioMinusculo}`
        }
        subtitle={`Atualize os dados principais, contato e endereço do ${negocioMinusculo}.`}
        left={
          <FormPageHeader
            title={
              consultorio
                ? `Editar ${negocioMinusculo}`
                : `Cadastrar ${negocioMinusculo}`
            }
            subtitle={
              consultorio
                ? consultorio.pessoa.nome
                : `Informe os dados principais do ${negocioMinusculo}.`
            }
            onBack={() => navigate(returnTo)}
            backLabel={`Voltar para ${negocioMinusculo}`}
          />
        }
      />

      {isLoading ? (
        <CarregamentoCentral />
      ) : loadError ? (
        <section className={styles.emptyCard}>
          <h2 className={styles.emptyTitle}>
            Falha ao carregar o {negocioMinusculo}
          </h2>
          <p className={styles.emptyDescription}>{loadError}</p>
          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => navigate(returnTo)}
            >
              Voltar
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => setReloadCounter((value) => value + 1)}
            >
              Tentar novamente
            </button>
          </div>
        </section>
      ) : (
        <FormularioConsultorio
          initialValues={initialValues}
          submitLabel={
            consultorio ? "Salvar alterações" : `Salvar ${negocioMinusculo}`
          }
          negocioLabel={negocioMinusculo}
          negocioTitulo={negocioTitulo}
          mostrarCampoAtivo={Boolean(consultorio)}
          onSubmit={handleSubmit}
          onCancel={() => navigate(returnTo)}
        />
      )}
    </PageLayout>
  );
}


