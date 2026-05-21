import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch, type FieldErrors } from "react-hook-form";
import { criarResolvedorZod } from "schemas/resolvedor-zod";
import { AvisoErroFormulario } from "../../../components/ui/aviso-erro-formulario";
import { FormField } from "../../../components/ui/form-field";
import {
  formaPagamentoSchema,
  type FormaPagamentoFormularioData,
} from "../../../schemas/forma-pagamento.schema";
import type { ErroFormularioAmigavel } from "../../../services/api/errors/erro-formulario";
import {
  criarMapaCamposServidor,
  normalizarErroFormularioPadrao,
  normalizarErrosValidacaoReactHookForm,
} from "../../../services/api/errors/erro-formulario-validacao";
import styles from "./formulario-forma-pagamento.module.css";

const mapaRotulosCampos = {
  nome: "Nome",
  taxaPercentual: "Taxa percentual",
  recebimentoTipo: "Tipo de recebimento",
  prazoRecebimentoDias: "Prazo de recebimento",
  observacoes: "Observações",
} satisfies Record<string, string>;

type FormularioFormaPagamentoProps = {
  initialValues: FormaPagamentoFormularioData;
  submitLabel: string;
  onSubmit: (values: FormaPagamentoFormularioData) => Promise<void> | void;
  onCancel: () => void;
};

export function FormularioFormaPagamento({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: FormularioFormaPagamentoProps) {
  const [mensagemErroFormulario, setMensagemErroFormulario] = useState<
    string | null
  >(null);
  const [errosFormulario, setErrosFormulario] = useState<
    ErroFormularioAmigavel[]
  >([]);
  const defaults = useMemo(() => initialValues, [initialValues]);

  const {
    clearErrors,
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormaPagamentoFormularioData>({
    resolver: criarResolvedorZod(formaPagamentoSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  const recebimentoTipo = useWatch({
    control,
    name: "recebimentoTipo",
    defaultValue: "na_hora",
  });

  async function handleSubmitForm(values: FormaPagamentoFormularioData) {
    clearErrors();
    setMensagemErroFormulario(null);
    setErrosFormulario([]);

    try {
      await onSubmit(values);
    } catch (error) {
      const resultadoErro = normalizarErroFormularioPadrao({
        erro: error,
        mapaRotulosCampos,
        mapaCamposServidor: criarMapaCamposServidor(mapaRotulosCampos),
        mensagemPadrao: "Não foi possível salvar a forma de pagamento.",
      });

      Object.entries(resultadoErro.errosCampo).forEach(([campo, mensagem]) => {
        if (!mensagem) {
          return;
        }

        setError(campo as keyof FormaPagamentoFormularioData, {
          type: "server",
          message: mensagem,
        });
      });

      setMensagemErroFormulario(resultadoErro.mensagemGlobal);
      setErrosFormulario(resultadoErro.erros);
    }
  }

  function handleSubmitInvalido(
    errosValidacao: FieldErrors<FormaPagamentoFormularioData>,
  ) {
    const resultadoErro = normalizarErrosValidacaoReactHookForm(
      errosValidacao as FieldErrors<Record<string, unknown>>,
      {
        mapaRotulosCampos,
      },
    );

    setMensagemErroFormulario(resultadoErro.mensagemGlobal);
    setErrosFormulario(resultadoErro.erros);
  }

  return (
    <form
      onSubmit={handleSubmit(handleSubmitForm, handleSubmitInvalido)}
      className={styles.form}
      noValidate
    >
      {mensagemErroFormulario ? (
        <AvisoErroFormulario
          titulo={
            errosFormulario.length > 0
              ? "Verifique os campos abaixo:"
              : "Não foi possível concluir o envio."
          }
          mensagem={
            errosFormulario.length === 0 ? mensagemErroFormulario : undefined
          }
          erros={errosFormulario}
        />
      ) : null}

      <section
        className={styles.section}
        aria-labelledby="forma-pagamento-dados-title"
      >
        <h2 className={styles.sectionTitle} id="forma-pagamento-dados-title">
          Dados da forma de pagamento
        </h2>

        <div className={styles.grid}>
          <FormField
            id="forma-pagamento-nome"
            label="Nome"
            required
            error={errors.nome?.message}
          >
            <input
              className={`${styles.input} ${errors.nome ? styles.inputError : ""}`}
              placeholder="Ex.: Pix"
              {...register("nome")}
            />
          </FormField>

          <FormField
            id="forma-pagamento-taxa"
            label="Taxa percentual (%)"
            required
            error={errors.taxaPercentual?.message}
            hint="Use 0 para formas de pagamento sem taxa."
          >
            <input
              className={`${styles.input} ${errors.taxaPercentual ? styles.inputError : ""}`}
              type="number"
              min={0}
              max={100}
              step="0.01"
              {...register("taxaPercentual")}
            />
          </FormField>

          <FormField
            id="forma-pagamento-recebimento"
            label="Tipo de recebimento"
            required
            error={errors.recebimentoTipo?.message}
          >
            <select className={styles.input} {...register("recebimentoTipo")}>
              <option value="na_hora">Na hora</option>
              <option value="prazo">A prazo</option>
            </select>
          </FormField>

          {recebimentoTipo === "prazo" ? (
            <FormField
              id="forma-pagamento-prazo"
              label="Prazo de recebimento (dias)"
              error={errors.prazoRecebimentoDias?.message}
            >
              <input
                className={`${styles.input} ${errors.prazoRecebimentoDias ? styles.inputError : ""}`}
                type="number"
                min={1}
                max={120}
                step={1}
                {...register("prazoRecebimentoDias")}
              />
            </FormField>
          ) : null}

          <FormField
            id="forma-pagamento-observacoes"
            label={"Observações"}
            error={errors.observacoes?.message}
            colSpan="full"
          >
            <textarea
              className={`${styles.textarea} ${errors.observacoes ? styles.inputError : ""}`}
              rows={4}
              placeholder={
                "Informações complementares sobre a forma de pagamento."
              }
              {...register("observacoes")}
            />
          </FormField>
        </div>
      </section>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.btnSecondary}
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className={styles.btnPrimary}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Salvando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
