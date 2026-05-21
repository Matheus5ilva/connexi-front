import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FormPageHeader } from "../../../components/ui/form-page-header";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout } from "../../../components/ui/page-layout";
import type { DocumentoPagarFormData } from "../../../schemas/documento-pagar.schema";
import {
  documentoPagarService,
  mapDocumentoPagarFormToCreateRequest,
} from "../../../services/api";
import { DocumentoPagarForm } from "../components/documento-pagar-form";

const defaultValues: DocumentoPagarFormData = {
  descricao: "",
  valor: 0,
  dataVencimento: "",
  status: "PENDENTE",
  categoria: "",
  observacao: "",
  parcelado: false,
  quantidadeParcelas: 1,
};

export function NovaContaPagar() {
  const navigate = useNavigate();
  const initialValues = useMemo(() => defaultValues, []);

  async function handleSubmit(values: DocumentoPagarFormData) {
    const created = await documentoPagarService.criar(
      mapDocumentoPagarFormToCreateRequest(values),
    );

    if (created.length === 1) {
      navigate(`/financeiro/contas-a-pagar/${created[0].id}`);
      return;
    }

    navigate("/financeiro/contas-a-pagar");
  }

  return (
    <PageLayout>
      <PageHeader
        title="Nova conta a pagar"
        subtitle="Cadastre uma nova despesa manual"
        left={
          <FormPageHeader
            title="Nova conta a pagar"
            subtitle="Cadastre uma nova despesa manual"
            onBack={() => navigate("/financeiro/contas-a-pagar")}
            backLabel="Voltar para a lista de contas a pagar"
          />
        }
      />

      <DocumentoPagarForm
        initialValues={initialValues}
        submitLabel="Cadastrar conta"
        statusLabel="Status inicial"
        enableParcelamento
        onSubmit={handleSubmit}
        onCancel={() => navigate("/financeiro/contas-a-pagar")}
      />
    </PageLayout>
  );
}
