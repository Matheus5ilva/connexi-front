import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FormPageHeader } from "../../../components/ui/form-page-header";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout } from "../../../components/ui/page-layout";
import type { ConvenioFormularioData } from "../../../schemas/convenio.schema";
import {
  convenioService,
  mapFormularioConvenioParaCriarRequest,
} from "../../../services/api";
import { FormularioConvenio } from "../components/formulario-convenio";

const valoresIniciaisPadrao: ConvenioFormularioData = {
  nome: "",
  cnpj: "",
  ativo: true,
  diasPagamento: undefined,
  abrangencia: "Nacional",
  telefone: "",
  whatsapp: "",
  email: "",
};

export function NovoConvenio() {
  const navigate = useNavigate();
  const valoresIniciais = useMemo(() => valoresIniciaisPadrao, []);

  async function handleSubmit(values: ConvenioFormularioData) {
    const convenioCriado = await convenioService.criar(
      mapFormularioConvenioParaCriarRequest(values),
    );

    navigate(`/financeiro/convenios/${convenioCriado.id}`);
  }

  return (
    <PageLayout>
      <PageHeader
        title="Novo convênio"
        subtitle="Cadastre os dados principais e de contato do convênio."
        left={
          <FormPageHeader
            title="Novo convênio"
            subtitle="Cadastre os dados principais e de contato do convênio."
            onBack={() => navigate("/financeiro/convenios")}
            backLabel="Voltar para a lista de convênios"
          />
        }
      />

      <FormularioConvenio
        valoresIniciais={valoresIniciais}
        textoBotaoSubmit="Cadastrar convênio"
        onSubmit={handleSubmit}
        onCancel={() => navigate("/financeiro/convenios")}
      />
    </PageLayout>
  );
}
