import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch, type FieldErrors } from "react-hook-form";
import { criarResolvedorZod } from "schemas/resolvedor-zod";
import { AvisoErroFormulario } from "../../../components/ui/aviso-erro-formulario";
import { FormField } from "../../../components/ui/form-field";
import { buscarEnderecoPorCep } from "../../pacientes/utils/via-cep";
import {
  consultorioSchema,
  type ConsultorioFormularioData,
} from "../../../schemas/consultorio.schema";
import type { ErroFormularioAmigavel } from "../../../services/api/errors/erro-formulario";
import {
  criarMapaCamposServidor,
  normalizarErroFormularioPadrao,
  normalizarErrosValidacaoReactHookForm,
} from "../../../services/api/errors/erro-formulario-validacao";
import styles from "./formulario-consultorio.module.css";

function criarMapaRotulosCampos(negocioLabel: string) {
  return {
    nome: `Nome do ${negocioLabel}`,
    razaoSocial: "Razão social",
    cnpj: "CNPJ",
    email: "E-mail",
    telefone: "Telefone",
    whatsapp: "WhatsApp",
    cep: "CEP",
    bairro: "Bairro",
    logradouro: "Logradouro",
    numero: "Número",
    complemento: "Complemento",
    nomeCidade: "Cidade",
    codigoIbgeCidade: "Cidade",
  } satisfies Record<string, string>;
}

function normalizarParaEmail(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toLowerCase();
}

type FormularioConsultorioProps = {
  initialValues: ConsultorioFormularioData;
  submitLabel: string;
  negocioLabel?: string;
  negocioTitulo?: string;
  mostrarCampoAtivo?: boolean;
  onSubmit: (values: ConsultorioFormularioData) => Promise<void> | void;
  onCancel: () => void;
};

export function FormularioConsultorio({
  initialValues,
  submitLabel,
  negocioLabel = "consultório",
  negocioTitulo = "Consultório",
  mostrarCampoAtivo = true,
  onSubmit,
  onCancel,
}: FormularioConsultorioProps) {
  const [mensagemErroFormulario, setMensagemErroFormulario] = useState<
    string | null
  >(null);
  const [errosFormulario, setErrosFormulario] = useState<
    ErroFormularioAmigavel[]
  >([]);

  const defaults = useMemo(() => initialValues, [initialValues]);
  const mapaRotulosCampos = useMemo(
    () => criarMapaRotulosCampos(negocioLabel),
    [negocioLabel],
  );
  const placeholderEmail = `contato@${normalizarParaEmail(negocioLabel)}.com`;

  const {
    clearErrors,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ConsultorioFormularioData>({
    resolver: criarResolvedorZod(consultorioSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  const ativo = useWatch({
    control,
    name: "ativo",
    defaultValue: defaults.ativo,
  });

  async function handleCepBlur(event: React.FocusEvent<HTMLInputElement>) {
    try {
      const endereco = await buscarEnderecoPorCep(event.target.value);

      if (!endereco) {
        return;
      }

      if (endereco.logradouro) {
        setValue("logradouro", endereco.logradouro, { shouldDirty: true });
      }

      if (endereco.bairro) {
        setValue("bairro", endereco.bairro, { shouldDirty: true });
      }

      if (endereco.nomeCidade) {
        setValue("nomeCidade", endereco.nomeCidade, { shouldDirty: true });
      }

      if (endereco.codigoIbgeCidade) {
        setValue("codigoIbgeCidade", endereco.codigoIbgeCidade, {
          shouldDirty: true,
        });
      }
    } catch {
      // Mantém preenchimento manual quando a consulta do CEP falhar.
    }
  }

  async function handleSubmitForm(values: ConsultorioFormularioData) {
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
        mensagemPadrao: `Não foi possível salvar os dados do ${negocioLabel}.`,
      });

      Object.entries(resultadoErro.errosCampo).forEach(([campo, mensagem]) => {
        if (!mensagem) {
          return;
        }

        setError(campo as keyof ConsultorioFormularioData, {
          type: "server",
          message: mensagem,
        });
      });

      setMensagemErroFormulario(resultadoErro.mensagemGlobal);
      setErrosFormulario(resultadoErro.erros);
    }
  }

  function handleSubmitInvalido(
    errosValidacao: FieldErrors<ConsultorioFormularioData>,
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
        aria-labelledby="consultorio-dados-title"
      >
        <h2 className={styles.sectionTitle} id="consultorio-dados-title">
          Dados principais
        </h2>

        <div className={styles.grid}>
          <FormField
            id="consultorio-nome"
            label={`Nome do ${negocioLabel}`}
            required
            error={errors.nome?.message}
            colSpan="full"
          >
            <input
              className={`${styles.input} ${errors.nome ? styles.inputError : ""}`}
              placeholder={`Ex.: ${negocioTitulo} Central`}
              {...register("nome")}
            />
          </FormField>

          <FormField
            id="consultorio-razao-social"
            label="Razão social"
            error={errors.razaoSocial?.message}
          >
            <input
              className={`${styles.input} ${
                errors.razaoSocial ? styles.inputError : ""
              }`}
              placeholder={`Ex.: ${negocioTitulo} Central LTDA`}
              {...register("razaoSocial")}
            />
          </FormField>

          <FormField
            id="consultorio-cnpj"
            label="CNPJ"
            error={errors.cnpj?.message}
          >
            <input
              className={`${styles.input} ${errors.cnpj ? styles.inputError : ""}`}
              placeholder="00.000.000/0000-00"
              {...register("cnpj")}
            />
          </FormField>

          {mostrarCampoAtivo ? (
            <FormField label="Status" colSpan="full">
              <div className={styles.toggleWrapper}>
                <input
                  type="checkbox"
                  id="consultorio-ativo"
                  className={styles.toggleInput}
                  {...register("ativo")}
                />
                <label
                  htmlFor="consultorio-ativo"
                  className={`${styles.toggleLabel} ${
                    ativo ? styles.toggleOn : ""
                  }`}
                >
                  <span className={styles.toggleSlider} />
                </label>
                <span className={styles.toggleText}>
                  {ativo ? "Ativo" : "Inativo"}
                </span>
              </div>
            </FormField>
          ) : null}
        </div>
      </section>

      <section
        className={styles.section}
        aria-labelledby="consultorio-contato-title"
      >
        <h2 className={styles.sectionTitle} id="consultorio-contato-title">
          Contato
        </h2>

        <div className={styles.grid}>
          <FormField
            id="consultorio-email"
            label="E-mail"
            error={errors.email?.message}
          >
            <input
              className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
              type="email"
              placeholder={placeholderEmail}
              autoComplete="email"
              {...register("email")}
            />
          </FormField>

          <FormField
            id="consultorio-telefone"
            label="Telefone"
            required
            error={errors.telefone?.message}
          >
            <input
              className={`${styles.input} ${
                errors.telefone ? styles.inputError : ""
              }`}
              placeholder="(11) 3333-4455"
              autoComplete="tel"
              inputMode="tel"
              {...register("telefone")}
            />
          </FormField>

          <FormField
            id="consultorio-whatsapp"
            label="WhatsApp"
            error={errors.whatsapp?.message}
            colSpan="full"
          >
            <input
              className={`${styles.input} ${
                errors.whatsapp ? styles.inputError : ""
              }`}
              placeholder="(11) 98888-4455"
              autoComplete="tel"
              inputMode="tel"
              {...register("whatsapp")}
            />
          </FormField>
        </div>
      </section>

      <section
        className={styles.section}
        aria-labelledby="consultorio-endereco-title"
      >
        <h2 className={styles.sectionTitle} id="consultorio-endereco-title">
          Endereço
        </h2>

        <div className={styles.grid}>
          <FormField
            id="consultorio-cep"
            label="CEP"
            error={errors.cep?.message}
          >
            <input
              className={`${styles.input} ${errors.cep ? styles.inputError : ""}`}
              placeholder="00000-000"
              inputMode="numeric"
              autoComplete="postal-code"
              {...register("cep")}
              onBlur={handleCepBlur}
            />
          </FormField>

          <FormField
            id="consultorio-logradouro"
            label="Logradouro"
            error={errors.logradouro?.message}
            colSpan="wide"
          >
            <input
              className={`${styles.input} ${
                errors.logradouro ? styles.inputError : ""
              }`}
              placeholder="Rua, avenida..."
              autoComplete="address-line1"
              {...register("logradouro")}
            />
          </FormField>

          <FormField
            id="consultorio-numero"
            label="Número"
            error={errors.numero?.message}
          >
            <input
              className={`${styles.input} ${
                errors.numero ? styles.inputError : ""
              }`}
              type="number"
              placeholder="123"
              inputMode="numeric"
              {...register("numero", {
                setValueAs: (value) =>
                  value === "" ? undefined : Number(value),
              })}
            />
          </FormField>

          <FormField
            id="consultorio-complemento"
            label="Complemento"
            error={errors.complemento?.message}
          >
            <input
              className={`${styles.input} ${
                errors.complemento ? styles.inputError : ""
              }`}
              placeholder="Sala, bloco..."
              autoComplete="address-line2"
              {...register("complemento")}
            />
          </FormField>

          <FormField
            id="consultorio-bairro"
            label="Bairro"
            error={errors.bairro?.message}
          >
            <input
              className={`${styles.input} ${
                errors.bairro ? styles.inputError : ""
              }`}
              placeholder="Bairro"
              autoComplete="address-level2"
              {...register("bairro")}
            />
          </FormField>

          <FormField
            id="consultorio-nome-cidade"
            label="Cidade"
            hint="Preenchida automaticamente a partir do CEP."
            error={errors.nomeCidade?.message}
          >
            <input
              className={`${styles.input} ${
                errors.nomeCidade ? styles.inputError : ""
              }`}
              type="text"
              placeholder="Cidade"
              disabled
              {...register("nomeCidade")}
            />
          </FormField>

          <input type="hidden" {...register("codigoIbgeCidade")} />
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
