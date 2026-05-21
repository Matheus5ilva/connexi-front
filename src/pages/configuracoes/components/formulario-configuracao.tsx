import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm, type FieldErrors } from "react-hook-form";
import { criarResolvedorZod } from "schemas/resolvedor-zod";
import { AvisoErroFormulario } from "../../../components/ui/aviso-erro-formulario";
import { FormField } from "../../../components/ui/form-field";
import {
  configuracaoSchema,
  type ConfiguracaoFormularioData,
  type DiaSemana,
} from "../../../schemas/configuracao.schema";
import type { ErroFormularioAmigavel } from "../../../services/api/errors/erro-formulario";
import {
  criarMapaCamposServidor,
  normalizarErroFormularioPadrao,
  normalizarErrosValidacaoReactHookForm,
} from "../../../services/api/errors/erro-formulario-validacao";
import styles from "./formulario-configuracao.module.css";

type FormularioConfiguracaoProps = {
  initialValues: ConfiguracaoFormularioData;
  submitLabel: string;
  onSubmit: (values: ConfiguracaoFormularioData) => Promise<void> | void;
  onCancel: () => void;
};

const diasAtendimentoOptions: Array<{ value: DiaSemana; label: string }> = [
  { value: "SEGUNDA", label: "Segunda-feira" },
  { value: "TERCA", label: "Terça-feira" },
  { value: "QUARTA", label: "Quarta-feira" },
  { value: "QUINTA", label: "Quinta-feira" },
  { value: "SEXTA", label: "Sexta-feira" },
  { value: "SABADO", label: "Sábado" },
  { value: "DOMINGO", label: "Domingo" },
];

const mapaRotulosCampos = {
  horaInicio: "Hora inicial",
  horaFim: "Hora final",
  intervaloMinutos: "Intervalo entre horários",
  diasAtendimento: "Dias disponíveis",
} satisfies Record<string, string>;

export function FormularioConfiguracao({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: FormularioConfiguracaoProps) {
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
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ConfiguracaoFormularioData>({
    resolver: criarResolvedorZod(configuracaoSchema),
    defaultValues: defaults,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "pausas",
  });

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  async function handleSubmitForm(values: ConfiguracaoFormularioData) {
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
        mensagemPadrao: "Não foi possível salvar a configuração.",
      });

      Object.entries(resultadoErro.errosCampo).forEach(([campo, mensagem]) => {
        if (!mensagem) {
          return;
        }

        setError(campo as keyof ConfiguracaoFormularioData, {
          type: "server",
          message: mensagem,
        });
      });

      setMensagemErroFormulario(resultadoErro.mensagemGlobal);
      setErrosFormulario(resultadoErro.erros);
    }
  }

  function handleSubmitInvalido(
    errosValidacao: FieldErrors<ConfiguracaoFormularioData>,
  ) {
    const resultadoErro = normalizarErrosValidacaoReactHookForm(
      errosValidacao as FieldErrors<Record<string, unknown>>,
      {
        mapaRotulosCampos,
        resolverRotuloCampo: (campo) => {
          const pausa = campo.match(/^pausas\.(\d+)\.(inicio|fim)$/);
          if (!pausa) {
            return null;
          }

          const indice = Number(pausa[1]) + 1;
          const rotulo = pausa[2] === "inicio" ? "Início" : "Fim";
          return `Pausa ${indice} - ${rotulo}`;
        },
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
        aria-labelledby="configuracao-horarios-title"
      >
        <h2 className={styles.sectionTitle} id="configuracao-horarios-title">
          {"Horários e intervalo"}
        </h2>
        <p className={styles.sectionDescription}>
          {
            "Defina a jornada principal e o intervalo padrão entre os horários da agenda."
          }
        </p>

        <div className={styles.grid}>
          <FormField
            id="configuracao-hora-inicio"
            label="Hora inicial"
            required
            error={errors.horaInicio?.message}
          >
            <input
              className={`${styles.input} ${errors.horaInicio ? styles.inputError : ""}`}
              type="time"
              {...register("horaInicio")}
            />
          </FormField>

          <FormField
            id="configuracao-hora-fim"
            label="Hora final"
            required
            error={errors.horaFim?.message}
          >
            <input
              className={`${styles.input} ${errors.horaFim ? styles.inputError : ""}`}
              type="time"
              {...register("horaFim")}
            />
          </FormField>

          <FormField
            id="configuracao-intervalo-minutos"
            label={"Intervalo entre horários (minutos)"}
            required
            error={errors.intervaloMinutos?.message}
            hint="Valor entre 1 e 240 minutos."
            colSpan="full"
          >
            <input
              className={`${styles.input} ${errors.intervaloMinutos ? styles.inputError : ""}`}
              type="number"
              min={1}
              max={240}
              step={1}
              {...register("intervaloMinutos")}
            />
          </FormField>
        </div>
      </section>

      <section
        className={styles.section}
        aria-labelledby="configuracao-dias-title"
      >
        <h2 className={styles.sectionTitle} id="configuracao-dias-title">
          Dias de atendimento
        </h2>
        <p className={styles.sectionDescription}>
          {
            "Selecione os dias em que o consultório deve disponibilizar horários."
          }
        </p>

        <FormField
          id="configuracao-dias-atendimento"
          label={"Dias disponíveis"}
          required
          error={errors.diasAtendimento?.message}
          colSpan="full"
        >
          <div className={styles.daysGrid} id="configuracao-dias-atendimento">
            {diasAtendimentoOptions.map((dia) => (
              <label key={dia.value} className={styles.dayOption}>
                <input
                  type="checkbox"
                  value={dia.value}
                  className={styles.dayCheckbox}
                  {...register("diasAtendimento")}
                />
                <span>{dia.label}</span>
              </label>
            ))}
          </div>
        </FormField>
      </section>

      <section
        className={styles.section}
        aria-labelledby="configuracao-pausas-title"
      >
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle} id="configuracao-pausas-title">
              Pausas
            </h2>
            <p className={styles.sectionDescription}>
              {
                "Cadastre as pausas da jornada, como almoço ou intervalo interno."
              }
            </p>
          </div>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => append({ inicio: "", fim: "" })}
          >
            Adicionar pausa
          </button>
        </div>

        {fields.length === 0 ? (
          <p className={styles.emptyState}>
            {"Nenhuma pausa cadastrada para esta configuração."}
          </p>
        ) : (
          <div className={styles.pausaList}>
            {fields.map((field, index) => (
              <div key={field.id} className={styles.pausaCard}>
                <div className={styles.pausaHeader}>
                  <strong className={styles.pausaTitle}>
                    Pausa {index + 1}
                  </strong>
                  <button
                    type="button"
                    className={styles.btnLink}
                    onClick={() => remove(index)}
                  >
                    Remover
                  </button>
                </div>

                <div className={styles.grid}>
                  <FormField
                    id={`configuracao-pausa-${index}-inicio`}
                    label={"Início"}
                    required
                    error={errors.pausas?.[index]?.inicio?.message}
                  >
                    <input
                      className={`${styles.input} ${errors.pausas?.[index]?.inicio ? styles.inputError : ""}`}
                      type="time"
                      {...register(`pausas.${index}.inicio`)}
                    />
                  </FormField>

                  <FormField
                    id={`configuracao-pausa-${index}-fim`}
                    label="Fim"
                    required
                    error={errors.pausas?.[index]?.fim?.message}
                  >
                    <input
                      className={`${styles.input} ${errors.pausas?.[index]?.fim ? styles.inputError : ""}`}
                      type="time"
                      {...register(`pausas.${index}.fim`)}
                    />
                  </FormField>
                </div>
              </div>
            ))}
          </div>
        )}
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
