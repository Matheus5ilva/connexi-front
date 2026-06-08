import { useEffect, useMemo, useState } from "react";
import { FaChevronLeft } from "react-icons/fa";
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout } from "../../../components/ui/page-layout";
import { CarregamentoCentral } from "../../../components/ui/carregamento-central";
import {
  getCamposPacienteVisiveis,
  getSegmentoLabels,
} from "../../../config/segmento-labels";
import type { LayoutOutletContext } from "../../../layout";
import { resolveReturnTo } from "../../../routes/return-to";
import type { PacienteFormData } from "../../../schemas/paciente.schema";
import { parseRouteNumericId } from "../../../schemas/runtime-input.schema";
import {
  mapPacienteFormToUpdateRequest,
  mapPacienteToFormData,
  pacienteService,
  type Paciente,
} from "../../../services/api";
import { PacienteForm } from "../components/paciente-form";
import {
  criarErroPacienteInvalido,
  resolverErroCarregamentoPaciente,
  type EstadoErroCarregamentoPaciente,
} from "../utils/erro-carregamento-paciente";
import styles from "./styles.module.css";

export function EditarPaciente() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { segmento } = useOutletContext<LayoutOutletContext>();
  const labels = getSegmentoLabels(segmento);
  const camposVisiveis = getCamposPacienteVisiveis(segmento);
  const pessoaMinuscula = labels.pessoa.toLowerCase();
  const pacienteId = parseRouteNumericId(id);
  const returnTo = resolveReturnTo(location, "/pacientes");

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [erroCarregamento, setErroCarregamento] =
    useState<EstadoErroCarregamentoPaciente | null>(null);

  useEffect(() => {
    if (!pacienteId) {
      setPaciente(null);
      setIsLoading(false);
      setErroCarregamento(criarErroPacienteInvalido(labels.pessoa));
      return;
    }

    const identificadorPaciente = pacienteId;
    let mounted = true;

    async function carregarPaciente() {
      setIsLoading(true);
      setErroCarregamento(null);

      try {
        const response =
          await pacienteService.buscarPorId(identificadorPaciente);
        if (!mounted) {
          return;
        }

        setPaciente(response);
      } catch (error) {
        if (!mounted) {
          return;
        }

        setPaciente(null);
        setErroCarregamento(
          resolverErroCarregamentoPaciente(
            error,
            `Não foi possível carregar os dados do ${pessoaMinuscula}.`,
            labels.pessoa,
          ),
        );
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void carregarPaciente();

    return () => {
      mounted = false;
    };
  }, [labels.pessoa, pacienteId, pessoaMinuscula]);

  async function handleUpdate(formData: PacienteFormData) {
    if (!pacienteId) {
      throw new Error(`${labels.pessoa} inválido.`);
    }

    const atualizado = await pacienteService.atualizar(
      pacienteId,
      mapPacienteFormToUpdateRequest(formData),
    );

    navigate(returnTo, {
      state: { pacienteAtualizadoNome: atualizado.nome },
    });
  }

  const defaultValues = useMemo(
    () => (paciente ? mapPacienteToFormData(paciente) : undefined),
    [paciente],
  );
  const convenioAtual = useMemo(
    () =>
      paciente?.convenioId && paciente.convenio
        ? {
            id: paciente.convenioId,
            nome: paciente.convenio,
            ativo: true,
          }
        : null,
    [paciente],
  );

  if (isLoading) {
    return (
      <PageLayout>
        <CarregamentoCentral />
      </PageLayout>
    );
  }

  if (!paciente) {
    const estadoErro = erroCarregamento ?? {
      titulo: `${labels.pessoa} não encontrado`,
      descricao: `Verifique se o ${pessoaMinuscula} existe para continuar a edição.`,
    };

    return (
      <PageLayout>
        <div className={styles.notFoundCard}>
          <h2>{estadoErro.titulo}</h2>
          <p>{estadoErro.descricao}</p>
          <button type="button" onClick={() => navigate(returnTo)}>
            Voltar
          </button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title={`Editar ${pessoaMinuscula}`}
        subtitle="Atualize os dados cadastrais"
        left={
          <div className={styles.titleWithBack}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => navigate(returnTo)}
              aria-label={`Voltar para a visualização do ${pessoaMinuscula}`}
            >
              <FaChevronLeft />
            </button>
            <div>
              <h1 className={styles.pageTitle}>Editar {pessoaMinuscula}</h1>
              <p className={styles.pageSubtitle}>{paciente.nome}</p>
            </div>
          </div>
        }
      />

      <PacienteForm
        camposVisiveis={camposVisiveis}
        defaultValues={defaultValues}
        convenioAtual={convenioAtual}
        mostrarCamposConvenio
        onCancel={() => navigate(returnTo)}
        onSubmit={handleUpdate}
        numeroCarteirinhaLabel={labels.numeroCarteirinha}
        parceriaLabel={labels.parceria}
        pessoaLabel={labels.pessoa}
        submitLabel="Salvar alterações"
        submittingLabel="Salvando..."
      />
    </PageLayout>
  );
}



