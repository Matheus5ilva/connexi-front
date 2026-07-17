import { useMemo } from "react";
import type { DefaultValues } from "react-hook-form";
import { useNavigate, useOutletContext } from "react-router-dom";
import { FormPageHeader } from "../../../components/ui/form-page-header";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout } from "../../../components/ui/page-layout";
import { getSegmentoLabels } from "../../../config/segmento-labels";
import type { LayoutOutletContext } from "../../../layout";
import type { ConvenioFormularioData } from "../../../schemas/convenio.schema";
import {
  convenioService,
  mapFormularioConvenioParaCriarRequest,
} from "../../../services/api";
import { FormularioConvenio } from "../components/formulario-convenio";

const valoresIniciaisPadrao: DefaultValues<ConvenioFormularioData> = {
  nome: "",
  cnpj: "",
  ativo: true,
  abrangencia: "Nacional",
  telefone: "",
  whatsapp: "",
  email: "",
};

export function NovoConvenio() {
  const navigate = useNavigate();
  const { segmento } = useOutletContext<LayoutOutletContext>();
  const labels = getSegmentoLabels(segmento);
  const parceriaMinuscula = labels.parceria.toLowerCase();
  const parceriasMinuscula = labels.parcerias.toLowerCase();
  const artigoParceria = parceriaMinuscula.endsWith("a") ? "da" : "do";
  const novoParceria = parceriaMinuscula.endsWith("a") ? "Nova" : "Novo";
  const titulo = `${novoParceria} ${parceriaMinuscula}`;
  const subtitulo = `Cadastre os dados principais e de contato ${artigoParceria} ${parceriaMinuscula}.`;
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
        title={titulo}
        subtitle={subtitulo}
        left={
          <FormPageHeader
            title={titulo}
            subtitle={subtitulo}
            onBack={() => navigate("/financeiro/convenios")}
            backLabel={`Voltar para a lista de ${parceriasMinuscula}`}
          />
        }
      />

      <FormularioConvenio
        labels={labels}
        valoresIniciais={valoresIniciais}
        textoBotaoSubmit={`Cadastrar ${parceriaMinuscula}`}
        onSubmit={handleSubmit}
        onCancel={() => navigate("/financeiro/convenios")}
      />
    </PageLayout>
  );
}
