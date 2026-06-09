import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch, type FieldErrors } from "react-hook-form";
import { criarResolvedorZod } from "schemas/resolvedor-zod";
import { AvisoErroFormulario } from "../../../components/ui/aviso-erro-formulario";
import { FormField } from "../../../components/ui/form-field";
import type { SegmentoLabels } from "../../../config/segmento-labels";
import {
  abrangenciaConvenioEnum,
  formularioConvenioSchema,
  type ConvenioFormularioData,
} from "../../../schemas/convenio.schema";
import type { ErroFormularioAmigavel } from "../../../services/api/errors/erro-formulario";
import {
  criarMapaCamposServidor,
  normalizarErroFormularioPadrao,
  normalizarErrosValidacaoReactHookForm,
} from "../../../services/api/errors/erro-formulario-validacao";
import styles from "./formulario-convenio.module.css";

const opcoesAbrangencia = abrangenciaConvenioEnum.options;

function obterArtigoParceria(label: string): "do" | "da" {
  return label.toLowerCase().endsWith("a") ? "da" : "do";
}

function normalizarParaEmail(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function criarMapaRotulosCampos(labels: SegmentoLabels) {
  const parceriaMinuscula = labels.parceria.toLowerCase();
  const artigoParceria = obterArtigoParceria(labels.parceria);

  return {
    nome: `Nome ${artigoParceria} ${parceriaMinuscula}`,
    cnpj: "CNPJ",
    abrangencia: "Abrangência",
    diasPagamento: "Prazo para pagamento",
    ativo: "Status",
    telefone: "Telefone",
    whatsapp: "WhatsApp",
    email: "E-mail",
  } satisfies Record<string, string>;
}

type FormularioConvenioProps = {
  labels: SegmentoLabels;
  valoresIniciais: ConvenioFormularioData;
  textoBotaoSubmit: string;
  onSubmit: (values: ConvenioFormularioData) => Promise<void> | void;
  onCancel: () => void;
};

export function FormularioConvenio({
  labels,
  valoresIniciais,
  textoBotaoSubmit,
  onSubmit,
  onCancel,
}: FormularioConvenioProps) {
  const parceriaMinuscula = labels.parceria.toLowerCase();
  const artigoParceria = obterArtigoParceria(labels.parceria);
  const mapaRotulosCampos = useMemo(
    () => criarMapaRotulosCampos(labels),
    [labels],
  );
  const placeholderEmail = `contato@${normalizarParaEmail(labels.parceria)}.com.br`;
  const [mensagemErroFormulario, setMensagemErroFormulario] = useState<
    string | null
  >(null);
  const [errosFormulario, setErrosFormulario] = useState<
    ErroFormularioAmigavel[]
  >([]);
  const defaults = useMemo(() => valoresIniciais, [valoresIniciais]);

  const {
    clearErrors,
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ConvenioFormularioData>({
    resolver: criarResolvedorZod(formularioConvenioSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  const ativo = useWatch({ control, name: "ativo", defaultValue: true });

  async function handleSubmitForm(values: ConvenioFormularioData) {
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
        mensagemPadrao: `Não foi possível salvar ${artigoParceria} ${parceriaMinuscula}.`,
      });

      Object.entries(resultadoErro.errosCampo).forEach(([campo, mensagem]) => {
        if (!mensagem) {
          return;
        }

        setError(campo as keyof ConvenioFormularioData, {
          type: "server",
          message: mensagem,
        });
      });

      setMensagemErroFormulario(resultadoErro.mensagemGlobal);
      setErrosFormulario(resultadoErro.erros);
    }
  }

  function handleSubmitInvalido(
    errosValidacao: FieldErrors<ConvenioFormularioData>,
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
        aria-labelledby="convenio-dados-title"
      >
        <h2 className={styles.sectionTitle} id="convenio-dados-title">
          {`Dados ${artigoParceria} ${parceriaMinuscula}`}
        </h2>

        <div className={styles.grid}>
          <FormField
            id="convenio-nome"
            label={`Nome ${artigoParceria} ${parceriaMinuscula}`}
            required
            error={errors.nome?.message}
            colSpan="full"
          >
            <input
              className={`${styles.input} ${errors.nome ? styles.inputError : ""}`}
              placeholder={`Ex.: ${labels.parceria} Principal`}
              {...register("nome")}
            />
          </FormField>

          <FormField
            id="convenio-cnpj"
            label="CNPJ"
            error={errors.cnpj?.message}
            hint={"Campo aceito com ou sem formatação."}
          >
            <input
              className={`${styles.input} ${errors.cnpj ? styles.inputError : ""}`}
              inputMode="numeric"
              placeholder="00.000.000/0000-00"
              {...register("cnpj")}
            />
          </FormField>

          <FormField
            id="convenio-abrangencia"
            label={"Abrangência"}
            required
            error={errors.abrangencia?.message}
          >
            <select className={styles.input} {...register("abrangencia")}>
              {opcoesAbrangencia.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            id="convenio-dias-pagamento"
            label="Prazo para pagamento (dias)"
            error={errors.diasPagamento?.message}
          >
            <input
              className={`${styles.input} ${errors.diasPagamento ? styles.inputError : ""}`}
              type="number"
              step="1"
              inputMode="numeric"
              placeholder="Ex.: 30"
              {...register("diasPagamento")}
            />
          </FormField>

          <FormField label="Status">
            <div className={styles.toggleWrapper}>
              <input
                type="checkbox"
                id="convenio-ativo"
                className={styles.toggleInput}
                {...register("ativo")}
              />
              <label
                htmlFor="convenio-ativo"
                className={`${styles.toggleLabel} ${ativo ? styles.toggleOn : ""}`}
              >
                <span className={styles.toggleSlider} />
              </label>
              <span className={styles.toggleText}>
                {ativo ? "Ativo" : "Inativo"}
              </span>
            </div>
          </FormField>
        </div>
      </section>

      <section
        className={styles.section}
        aria-labelledby="convenio-contato-title"
      >
        <h2 className={styles.sectionTitle} id="convenio-contato-title">
          Contato
        </h2>

        <div className={styles.grid}>
          <FormField
            id="convenio-telefone"
            label="Telefone"
            required
            error={errors.telefone?.message}
          >
            <input
              className={`${styles.input} ${errors.telefone ? styles.inputError : ""}`}
              placeholder="(11) 99999-9999"
              {...register("telefone")}
            />
          </FormField>

          <FormField
            id="convenio-whatsapp"
            label="WhatsApp"
            error={errors.whatsapp?.message}
          >
            <input
              className={`${styles.input} ${errors.whatsapp ? styles.inputError : ""}`}
              placeholder="(11) 99999-9999"
              {...register("whatsapp")}
            />
          </FormField>

          <FormField
            id="convenio-email"
            label="E-mail"
            required
            error={errors.email?.message}
            colSpan="full"
          >
            <input
              className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
              type="email"
              placeholder={placeholderEmail}
              {...register("email")}
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
          {isSubmitting ? "Salvando..." : textoBotaoSubmit}
        </button>
      </div>
    </form>
  );
}
