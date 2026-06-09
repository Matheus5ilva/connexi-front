import { useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { FormPageHeader } from "../../../components/ui/form-page-header";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout } from "../../../components/ui/page-layout";
import { getSegmentoLabels } from "../../../config/segmento-labels";
import type { LayoutOutletContext } from "../../../layout";
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
  const { segmento } = useOutletContext<LayoutOutletContext>();
  const labels = getSegmentoLabels(segmento);
  const servicoMinusculo = labels.servico.toLowerCase();
  const servicosMinusculo = labels.servicos.toLowerCase();
  const parceriasMinusculo = labels.parcerias.toLowerCase();
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
        title={`Novo ${servicoMinusculo}`}
        subtitle={`Cadastre o ${servicoMinusculo} com valor particular e ${parceriasMinusculo}.`}
        left={
          <FormPageHeader
            title={`Novo ${servicoMinusculo}`}
            subtitle={`Cadastre o ${servicoMinusculo} com valor particular e ${parceriasMinusculo}.`}
            onBack={() => navigate("/financeiro/servicos")}
            backLabel={`Voltar para a lista de ${servicosMinusculo}`}
          />
        }
      />

      <FormularioServico
        valoresIniciais={valoresIniciais}
        textoBotaoSubmit={`Cadastrar ${servicoMinusculo}`}
        onSubmit={handleSubmit}
        onCancel={() => navigate("/financeiro/servicos")}
        labels={labels}
      />
    </PageLayout>
  );
}
