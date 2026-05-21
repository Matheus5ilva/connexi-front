import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FormPageHeader } from "../../../components/ui/form-page-header";
import { NotFoundCard } from "../../../components/ui/not-found-card";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout } from "../../../components/ui/page-layout";
import { CarregamentoCentral } from "../../../components/ui/carregamento-central";
import type { FormaPagamentoFormularioData } from "../../../schemas/forma-pagamento.schema";
import { parseRouteNumericId } from "../../../schemas/runtime-input.schema";
import {
  formaPagamentoService,
  mapFormaPagamentoParaFormulario,
  mapFormularioFormaPagamentoParaAtualizarRequest,
  toErrorMessage,
  type FormaPagamento,
} from "../../../services/api";
import { FormularioFormaPagamento } from "../components/formulario-forma-pagamento";

const valoresIniciaisVazios: FormaPagamentoFormularioData = {
  nome: "",
  taxaPercentual: 0,
  recebimentoTipo: "na_hora",
  prazoRecebimentoDias: undefined,
  observacoes: "",
};

export function EditarFormaPagamento() {
  const navigate = useNavigate();
  const { id } = useParams();
  const formaPagamentoId = parseRouteNumericId(id);
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (formaPagamentoId === null) {
      setFormaPagamento(null);
      setIsLoading(false);
      setLoadError(null);
      return;
    }

    const targetId = formaPagamentoId;
    let isMounted = true;

    async function loadFormaPagamento() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const fetched = await formaPagamentoService.buscarPorId(targetId);
        if (!isMounted) {
          return;
        }

        setFormaPagamento(fetched);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setLoadError(
          toErrorMessage(
            error,
            "Não foi possível carregar a forma de pagamento.",
          ),
        );
        setFormaPagamento(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadFormaPagamento();

    return () => {
      isMounted = false;
    };
  }, [formaPagamentoId]);

  const initialValues = useMemo<FormaPagamentoFormularioData>(() => {
    if (!formaPagamento) {
      return valoresIniciaisVazios;
    }

    return mapFormaPagamentoParaFormulario(formaPagamento);
  }, [formaPagamento]);

  if (isLoading) {
    return (
      <PageLayout>
        <CarregamentoCentral />
      </PageLayout>
    );
  }

  if (!formaPagamento) {
    return (
      <PageLayout>
        <NotFoundCard
          title={
            loadError
              ? "Falha ao carregar forma de pagamento"
              : "Forma de pagamento não encontrada"
          }
          description={
            loadError ||
            "Verifique se o registro existe para continuar a edição."
          }
          actionLabel="Voltar para formas de pagamento"
          onAction={() => navigate("/financeiro/formas-pagamento")}
        />
      </PageLayout>
    );
  }

  const formaPagamentoAtual = formaPagamento;
  const formaPagamentoIdAtual = formaPagamentoAtual.id;

  async function handleSubmit(values: FormaPagamentoFormularioData) {
    await formaPagamentoService.atualizar(
      formaPagamentoIdAtual,
      mapFormularioFormaPagamentoParaAtualizarRequest(values),
    );

    navigate(`/financeiro/formas-pagamento/${formaPagamentoIdAtual}`);
  }

  return (
    <PageLayout>
      <PageHeader
        title="Editar forma de pagamento"
        subtitle="Atualize os dados da forma de pagamento."
        left={
          <FormPageHeader
            title="Editar forma de pagamento"
            subtitle={formaPagamentoAtual.nome}
            onBack={() =>
              navigate(`/financeiro/formas-pagamento/${formaPagamentoIdAtual}`)
            }
            backLabel="Voltar para a visualização da forma de pagamento"
          />
        }
      />

      <FormularioFormaPagamento
        initialValues={initialValues}
        submitLabel="Salvar alterações"
        onSubmit={handleSubmit}
        onCancel={() =>
          navigate(`/financeiro/formas-pagamento/${formaPagamentoIdAtual}`)
        }
      />
    </PageLayout>
  );
}



