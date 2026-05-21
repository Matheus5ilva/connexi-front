import { useMemo } from "react";
import { FaChevronLeft } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout } from "../../../components/ui/page-layout";
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
        title="Novo paciente"
        subtitle="Preencha os dados para cadastrar"
        left={
          <div className={styles.titleWithBack}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => navigate(returnTo)}
              aria-label="Voltar para a lista de pacientes"
            >
              <FaChevronLeft />
            </button>
            <div>
              <h1 className={styles.pageTitle}>Novo paciente</h1>
              <p className={styles.pageSubtitle}>
                Preencha os dados para cadastrar
              </p>
            </div>
          </div>
        }
      />

      <PacienteForm
        defaultValues={defaultValues}
        onCancel={() => navigate(returnTo)}
        onSubmit={handleCreate}
        submitLabel="Cadastrar paciente"
        submittingLabel="Cadastrando..."
      />
    </PageLayout>
  );
}
