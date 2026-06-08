import { useMemo } from "react";
import { FaChevronLeft } from "react-icons/fa";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout } from "../../../components/ui/page-layout";
import {
  getCamposPacienteVisiveis,
  getSegmentoLabels,
} from "../../../config/segmento-labels";
import type { LayoutOutletContext } from "../../../layout";
import { resolveReturnTo } from "../../../routes/return-to";
import {
  mapPacienteFormToCreateRequest,
  pacienteService,
} from "../../../services/api";
import type { PacienteFormData } from "../../../schemas/paciente.schema";
import { PacienteForm } from "../components/paciente-form";
import styles from "./styles.module.css";

export function NovoPaciente() {
  const navigate = useNavigate();
  const location = useLocation();
  const { segmento } = useOutletContext<LayoutOutletContext>();
  const labels = getSegmentoLabels(segmento);
  const camposVisiveis = getCamposPacienteVisiveis(segmento);
  const pessoaMinuscula = labels.pessoa.toLowerCase();
  const pessoasMinuscula = labels.pessoas.toLowerCase();
  const titulo = `Novo ${pessoaMinuscula}`;
  const returnTo = resolveReturnTo(location, "/pacientes");
  const state = location.state as { prefillNome?: string } | null;
  const prefillNome = state?.prefillNome?.trim() || "";
  const defaultValues = useMemo(() => ({ nome: prefillNome }), [prefillNome]);

  async function handleCreate(formData: PacienteFormData) {
    await pacienteService.criar(mapPacienteFormToCreateRequest(formData));
    navigate(returnTo);
  }

  return (
    <PageLayout>
      <PageHeader
        title={titulo}
        subtitle={`Preencha os dados para cadastrar ${pessoaMinuscula}`}
        left={
          <div className={styles.titleWithBack}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => navigate(returnTo)}
              aria-label={`Voltar para a lista de ${pessoasMinuscula}`}
            >
              <FaChevronLeft />
            </button>
            <div>
              <h1 className={styles.pageTitle}>{titulo}</h1>
              <p className={styles.pageSubtitle}>
                Preencha os dados para cadastrar {pessoaMinuscula}
              </p>
            </div>
          </div>
        }
      />

      <PacienteForm
        camposVisiveis={camposVisiveis}
        defaultValues={defaultValues}
        onCancel={() => navigate(returnTo)}
        onSubmit={handleCreate}
        numeroCarteirinhaLabel={labels.numeroCarteirinha}
        parceriaLabel={labels.parceria}
        pessoaLabel={labels.pessoa}
        submitLabel={`Cadastrar ${pessoaMinuscula}`}
        submittingLabel="Cadastrando..."
      />
    </PageLayout>
  );
}
