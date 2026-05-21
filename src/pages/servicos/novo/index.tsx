import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FormPageHeader } from "../../../components/ui/form-page-header";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout } from "../../../components/ui/page-layout";
import type { ServicoFormularioData } from "../../../schemas/servico.schema";
import {
  mapFormularioServicoParaCriarRequest,
  servicoService,
} from "../../../services/api";
import { FormularioServico } from "../components/formulario-servico";

const valoresIniciaisPadrao: ServicoFormularioData = {
  nome: "",
  valorParticular: 0,
  ativo: true,
  descricao: "",
  convenios: [],
};

export function NovoServico() {
  const navigate = useNavigate();
  const valoresIniciais = useMemo(() => valoresIniciaisPadrao, []);

  async function handleSubmit(values: ServicoFormularioData) {
    const created = await servicoService.criar(
      mapFormularioServicoParaCriarRequest(values),
    );

    navigate(`/financeiro/servicos/${created.id}`);
  }

  return (
    <PageLayout>
      <PageHeader
        title="Novo serviço"
        subtitle="Cadastre o serviço com valor particular e convênios."
        left={
          <FormPageHeader
            title="Novo serviço"
            subtitle="Cadastre o serviço com valor particular e convênios."
            onBack={() => navigate("/financeiro/servicos")}
            backLabel="Voltar para a lista de serviços"
          />
        }
      />

      <FormularioServico
        valoresIniciais={valoresIniciais}
        textoBotaoSubmit="Cadastrar serviço"
        onSubmit={handleSubmit}
        onCancel={() => navigate("/financeiro/servicos")}
      />
    </PageLayout>
  );
}
