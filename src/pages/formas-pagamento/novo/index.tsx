import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FormPageHeader } from "../../../components/ui/form-page-header";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout } from "../../../components/ui/page-layout";
import type { FormaPagamentoFormularioData } from "../../../schemas/forma-pagamento.schema";
import {
  formaPagamentoService,
  mapFormularioFormaPagamentoParaCriarRequest,
} from "../../../services/api";
import { FormularioFormaPagamento } from "../components/formulario-forma-pagamento";

const valoresIniciaisPadrao: FormaPagamentoFormularioData = {
  nome: "",
  taxaPercentual: 0,
  recebimentoTipo: "na_hora",
  prazoRecebimentoDias: undefined,
  observacoes: "",
};

export function NovaFormaPagamento() {
  const navigate = useNavigate();
  const initialValues = useMemo(() => valoresIniciaisPadrao, []);

  async function handleSubmit(values: FormaPagamentoFormularioData) {
    const created = await formaPagamentoService.criar(
      mapFormularioFormaPagamentoParaCriarRequest(values),
    );

    navigate(`/financeiro/formas-pagamento/${created.id}`);
  }

  return (
    <PageLayout>
      <PageHeader
        title="Nova forma de pagamento"
        subtitle="Defina taxa percentual e prazo de recebimento para o financeiro."
        left={
          <FormPageHeader
            title="Nova forma de pagamento"
            subtitle="Defina taxa percentual e prazo de recebimento para o financeiro."
            onBack={() => navigate("/financeiro/formas-pagamento")}
            backLabel="Voltar para a lista de formas de pagamento"
          />
        }
      />

      <FormularioFormaPagamento
        initialValues={initialValues}
        submitLabel="Cadastrar forma de pagamento"
        onSubmit={handleSubmit}
        onCancel={() => navigate("/financeiro/formas-pagamento")}
      />
    </PageLayout>
  );
}
