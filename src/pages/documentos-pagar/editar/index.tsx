import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FormPageHeader } from "../../../components/ui/form-page-header";
import { NotFoundCard } from "../../../components/ui/not-found-card";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout } from "../../../components/ui/page-layout";
import { CarregamentoCentral } from "../../../components/ui/carregamento-central";
import { obterUsuarioAutenticado } from "../../../auth/session";
import type { DocumentoPagarFormData } from "../../../schemas/documento-pagar.schema";
import { parseRouteNumericId } from "../../../schemas/runtime-input.schema";
import {
  documentoPagarService,
  mapDocumentoPagarFormToUpdateRequest,
  mapDocumentoPagarToFormData,
  toErrorMessage,
  type DocumentoPagar,
} from "../../../services/api";
import { DocumentoPagarForm } from "../components/documento-pagar-form";
import { usuarioPodeAlterarContaPagar } from "../utils/permissoes-conta-pagar";

const emptyValues: DocumentoPagarFormData = {
  descricao: "",
  valor: 0,
  dataVencimento: "",
  status: "PENDENTE",
  categoria: "",
  observacao: "",
  parcelado: false,
  quantidadeParcelas: 1,
};

export function EditarContaPagar() {
  const navigate = useNavigate();
  const { id } = useParams();
  const documentoId = parseRouteNumericId(id);
  const usuarioAtual = obterUsuarioAutenticado();
  const [documento, setDocumento] = useState<DocumentoPagar | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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

    async function loadDocumento() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const fetched = await documentoPagarService.buscarPorId(safeDocumentoId);
        if (!ativo) {
          return;
        }

        setDocumento(fetched);
      } catch (error) {
        if (!ativo) {
          return;
        }

        setLoadError(
          toErrorMessage(error, "Não foi possível carregar os dados da conta."),
        );
        setDocumento(null);
      } finally {
        if (ativo) {
          setIsLoading(false);
        }
      }
    }

    void loadDocumento();

    return () => {
      ativo = false;
    };
  }, [documentoId]);

  const initialValues = useMemo<DocumentoPagarFormData>(() => {
    if (!documento) {
      return emptyValues;
    }

    return mapDocumentoPagarToFormData(documento);
  }, [documento]);

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
          description={loadError || "Verifique se a conta existe para continuar a edição."}
          actionLabel="Voltar para contas"
          onAction={() => navigate("/financeiro/contas-a-pagar")}
        />
      </PageLayout>
    );
  }

  if (documento.status === "CANCELADO") {
    return (
      <PageLayout>
        <NotFoundCard
          title="Conta cancelada"
          description="Contas canceladas não podem ser alteradas pela tela de edição."
          actionLabel="Ver conta"
          onAction={() => navigate(`/financeiro/contas-a-pagar/${documento.id}`)}
        />
      </PageLayout>
    );
  }

  if (!usuarioPodeAlterarContaPagar(usuarioAtual, documento)) {
    return (
      <PageLayout>
        <NotFoundCard
          title="Conta liquidada"
          description="Esta conta a pagar ja esta liquidada e somente usuarios MASTER podem altera-la."
          actionLabel="Ver conta"
          onAction={() => navigate(`/financeiro/contas-a-pagar/${documento.id}`)}
        />
      </PageLayout>
    );
  }

  const documentoAtual = documento;
  const documentoIdAtual = documentoAtual.id;

  async function handleSubmit(values: DocumentoPagarFormData) {
    await documentoPagarService.atualizar(
      documentoIdAtual,
      mapDocumentoPagarFormToUpdateRequest(values),
    );

    navigate(`/financeiro/contas-a-pagar/${documentoIdAtual}`);
  }

  return (
    <PageLayout>
      <PageHeader
        title="Editar conta a pagar"
        subtitle="Atualize os dados da conta a pagar"
        left={
          <FormPageHeader
            title="Editar conta a pagar"
            subtitle={documentoAtual.descricao}
            onBack={() =>
              navigate(`/financeiro/contas-a-pagar/${documentoIdAtual}`)
            }
            backLabel="Voltar para a visualização da conta"
          />
        }
      />

      <DocumentoPagarForm
        initialValues={initialValues}
        submitLabel="Salvar alterações"
        statusLabel="Status"
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/financeiro/contas-a-pagar/${documentoIdAtual}`)}
      />
    </PageLayout>
  );
}



