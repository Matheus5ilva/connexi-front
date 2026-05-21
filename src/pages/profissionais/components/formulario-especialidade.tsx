import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch, type FieldErrors } from "react-hook-form";
import { criarResolvedorZod } from "schemas/resolvedor-zod";
import { AvisoErroFormulario } from "../../../components/ui/aviso-erro-formulario";
import { FormField } from "../../../components/ui/form-field";
import {
  especialidadeSchema,
  type EspecialidadeFormularioData,
} from "../../../schemas/especialidade.schema";
import type { ErroFormularioAmigavel } from "../../../services/api/errors/erro-formulario";
import {
  criarMapaCamposServidor,
  normalizarErroFormularioPadrao,
  normalizarErrosValidacaoReactHookForm,
} from "../../../services/api/errors/erro-formulario-validacao";
import styles from "./form-shared.module.css";

const mapaRotulosCampos = {
  nome: "Nome",
  descricao: "Descrição",
} satisfies Record<string, string>;

type FormularioEspecialidadeProps = {
  initialValues: EspecialidadeFormularioData;
  submitLabel: string;
  onSubmit: (values: EspecialidadeFormularioData) => Promise<void> | void;
  onCancel: () => void;
};

export function FormularioEspecialidade({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: FormularioEspecialidadeProps) {
  const [mensagemErroFormulario, setMensagemErroFormulario] = useState<
    string | null
  >(null);
  const [errosFormulario, setErrosFormulario] = useState<
    ErroFormularioAmigavel[]
  >([]);
  const valoresPadrao = useMemo(() => initialValues, [initialValues]);

  const {
    clearErrors,
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EspecialidadeFormularioData>({
    resolver: criarResolvedorZod(especialidadeSchema),
    defaultValues: valoresPadrao,
  });

  useEffect(() => {
    reset(valoresPadrao);
  }, [valoresPadrao, reset]);

  const descricao = useWatch({ control, name: "descricao", defaultValue: "" });

  async function handleSubmitFormulario(values: EspecialidadeFormularioData) {
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
        mensagemPadrao: "Não foi possível salvar a especialidade.",
      });

      Object.entries(resultadoErro.errosCampo).forEach(([campo, mensagem]) => {
        if (!mensagem) {
          return;
        }

        setError(campo as keyof EspecialidadeFormularioData, {
          type: "server",
          message: mensagem,
        });
      });

      setMensagemErroFormulario(resultadoErro.mensagemGlobal);
      setErrosFormulario(resultadoErro.erros);
    }
  }

  function handleSubmitInvalido(
    errosValidacao: FieldErrors<EspecialidadeFormularioData>,
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
      onSubmit={handleSubmit(handleSubmitFormulario, handleSubmitInvalido)}
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
        aria-labelledby="especialidade-dados-title"
      >
        <h2 className={styles.sectionTitle} id="especialidade-dados-title">
          Dados da especialidade
        </h2>

        <div className={styles.grid}>
          <FormField
            id="especialidade-nome"
            label="Nome"
            required
            error={errors.nome?.message}
            colSpan="full"
          >
            <input
              className={`${styles.input} ${errors.nome ? styles.inputError : ""}`}
              placeholder="Ex.: Cardiologia"
              {...register("nome")}
            />
          </FormField>

          <FormField
            id="especialidade-descricao"
            label={"Descrição"}
            error={errors.descricao?.message}
            colSpan="full"
          >
            <textarea
              className={`${styles.textarea} ${errors.descricao ? styles.inputError : ""}`}
              rows={4}
              placeholder="Resumo objetivo sobre esta especialidade."
              {...register("descricao")}
            />
          </FormField>

          <p className={styles.sectionHint}>
            {descricao?.trim()
              ? `${descricao.trim().length}/255 caracteres`
              : "Adicione uma descrição curta para facilitar futuras buscas."}
          </p>
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
