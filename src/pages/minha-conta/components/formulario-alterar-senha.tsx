import { useEffect, useMemo, useState } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { criarResolvedorZod } from "schemas/resolvedor-zod";
import { AvisoErroFormulario } from "../../../components/ui/aviso-erro-formulario";
import { FormField } from "../../../components/ui/form-field";
import {
  alterarSenhaSchema,
  type AlterarSenhaFormularioData,
} from "../../../schemas/alterar-senha.schema";
import type { ErroFormularioAmigavel } from "../../../services/api/errors/erro-formulario";
import {
  criarMapaCamposServidor,
  normalizarErroFormularioPadrao,
  normalizarErrosValidacaoReactHookForm,
} from "../../../services/api/errors/erro-formulario-validacao";
import styles from "./formulario-alterar-senha.module.css";

const valoresIniciais: AlterarSenhaFormularioData = {
  senhaAtual: "",
  novaSenha: "",
  confirmarNovaSenha: "",
};

const mapaRotulosCampos = {
  senhaAtual: "Senha atual",
  novaSenha: "Nova senha",
  confirmarNovaSenha: "Confirmar nova senha",
} satisfies Record<string, string>;

type FormularioAlterarSenhaProps = {
  submitLabel: string;
  onSubmit: (values: AlterarSenhaFormularioData) => Promise<void> | void;
  onSuccess?: () => void;
};

export function FormularioAlterarSenha({
  submitLabel,
  onSubmit,
  onSuccess,
}: FormularioAlterarSenhaProps) {
  const [mensagemErroFormulario, setMensagemErroFormulario] = useState<
    string | null
  >(null);
  const [errosFormulario, setErrosFormulario] = useState<
    ErroFormularioAmigavel[]
  >([]);
  const defaults = useMemo(() => valoresIniciais, []);

  const {
    clearErrors,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AlterarSenhaFormularioData>({
    resolver: criarResolvedorZod(alterarSenhaSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  async function handleSubmitForm(values: AlterarSenhaFormularioData) {
    clearErrors();
    setMensagemErroFormulario(null);
    setErrosFormulario([]);

    try {
      await onSubmit(values);
      reset(defaults);
      onSuccess?.();
    } catch (error) {
      const resultadoErro = normalizarErroFormularioPadrao({
        erro: error,
        mapaRotulosCampos,
        mapaCamposServidor: criarMapaCamposServidor(mapaRotulosCampos),
        mensagemPadrao: "Não foi possível alterar a senha.",
      });

      Object.entries(resultadoErro.errosCampo).forEach(([campo, mensagem]) => {
        if (!mensagem) {
          return;
        }

        setError(campo as keyof AlterarSenhaFormularioData, {
          type: "server",
          message: mensagem,
        });
      });

      setMensagemErroFormulario(resultadoErro.mensagemGlobal);
      setErrosFormulario(resultadoErro.erros);
    }
  }

  function handleSubmitInvalido(
    errosValidacao: FieldErrors<AlterarSenhaFormularioData>,
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

      <div className={styles.grid}>
        <FormField
          id="minha-conta-senha-atual"
          label="Senha atual"
          required
          error={errors.senhaAtual?.message}
        >
          <input
            className={`${styles.input} ${errors.senhaAtual ? styles.inputError : ""}`}
            type="password"
            autoComplete="current-password"
            {...register("senhaAtual")}
          />
        </FormField>

        <FormField
          id="minha-conta-nova-senha"
          label="Nova senha"
          required
          error={errors.novaSenha?.message}
        >
          <input
            className={`${styles.input} ${errors.novaSenha ? styles.inputError : ""}`}
            type="password"
            autoComplete="new-password"
            {...register("novaSenha")}
          />
        </FormField>

        <FormField
          id="minha-conta-confirmar-nova-senha"
          label="Confirmar nova senha"
          required
          error={errors.confirmarNovaSenha?.message}
          colSpan="full"
        >
          <input
            className={`${styles.input} ${errors.confirmarNovaSenha ? styles.inputError : ""}`}
            type="password"
            autoComplete="new-password"
            {...register("confirmarNovaSenha")}
          />
        </FormField>
      </div>

      <div className={styles.actions}>
        <button
          type="submit"
          className={styles.btnPrimary}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Alterando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
