import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FormPageHeader } from "../../../components/ui/form-page-header";
import { NotFoundCard } from "../../../components/ui/not-found-card";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout } from "../../../components/ui/page-layout";
import { CarregamentoCentral } from "../../../components/ui/carregamento-central";
import { obterUsuarioAutenticado, usuarioEhMaster } from "../../../auth/session";
import { resolveReturnTo } from "../../../routes/return-to";
import type { ProfissionalFormData } from "../../../schemas/profissional.schema";
import {
  mapProfissionalFormToUpdateRequest,
  mapProfissionalToFormData,
  profissionalService,
  toErrorMessage,
  type Profissional,
} from "../../../services/api";
import { ProfissionalForm } from "../components/profissional-form";
import { carregarProfissionalPrincipal } from "../utils/carregar-profissional-principal";

const emptyFormValues: ProfissionalFormData = {
  nome: "",
  ativo: true,
  telefone: "",
  whatsapp: "",
  email: "",
  cep: "",
  logradouro: "",
  numero: undefined,
  complemento: "",
  bairro: "",
  nomeCidade: "",
  codigoIbgeCidade: "",
  tipoProfissional: "",
  numeroRegistro: "",
  especialidadeId: undefined,
};

export function EditarProfissional() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = resolveReturnTo(location, "/profissional");
  const usuarioAtual = obterUsuarioAutenticado();
  const podeAlterarStatus = usuarioEhMaster(usuarioAtual);
  const [profissional, setProfissional] = useState<Profissional | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProfissional() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const fetched = await carregarProfissionalPrincipal();
        if (!isMounted) {
          return;
        }

        setProfissional(fetched);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setLoadError(
          toErrorMessage(
            error,
            "Não foi possível carregar o perfil profissional.",
          ),
        );
        setProfissional(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProfissional();

    return () => {
      isMounted = false;
    };
  }, []);

  const initialValues = useMemo<ProfissionalFormData>(() => {
    if (!profissional) {
      return emptyFormValues;
    }

    return mapProfissionalToFormData(profissional);
  }, [profissional]);

  if (isLoading) {
    return (
      <PageLayout>
        <CarregamentoCentral />
      </PageLayout>
    );
  }

  if (!profissional) {
    return (
      <PageLayout>
        <NotFoundCard
          title={
            loadError
              ? "Falha ao carregar o perfil profissional"
              : "Perfil profissional não encontrado"
          }
          description={
            loadError ??
            "Não encontramos um profissional cadastrado para edição neste momento."
          }
          actionLabel="Voltar para o perfil"
          onAction={() => navigate(returnTo)}
        />
      </PageLayout>
    );
  }

  const profissionalAtual = profissional;

  async function handleSubmit(values: ProfissionalFormData) {
    await profissionalService.atualizar(
      profissionalAtual.id,
      mapProfissionalFormToUpdateRequest(values, {
        incluirStatus: podeAlterarStatus,
      }),
    );

    navigate(returnTo, {
      state: { returnTo },
    });
  }

  return (
    <PageLayout>
      <PageHeader
        title="Editar perfil profissional"
        subtitle="Atualize os dados cadastrais, de contato e da especialidade"
        left={
          <FormPageHeader
            title="Editar perfil profissional"
            subtitle={profissionalAtual.nome}
            onBack={() => navigate(returnTo)}
            backLabel="Voltar para o perfil profissional"
          />
        }
      />

      <ProfissionalForm
        initialValues={initialValues}
        mostrarCampoAtivo={podeAlterarStatus}
        submitLabel="Salvar alterações"
        onSubmit={handleSubmit}
        onCancel={() => navigate(returnTo)}
        onManageEspecialidades={() => navigate("/profissional/especialidades")}
      />
    </PageLayout>
  );
}



