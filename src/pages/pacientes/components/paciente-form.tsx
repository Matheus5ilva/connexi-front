import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch, type FieldErrors } from "react-hook-form";
import { FaMapMarkerAlt, FaPhone, FaUser } from "react-icons/fa";
import { AvisoErroFormulario } from "../../../components/ui/aviso-erro-formulario";
import { FormField } from "../../../components/ui/form-field";
import type { CamposPacienteVisiveis } from "../../../config/segmento-labels";
import {
  pacienteSchema,
  type PacienteFormData,
} from "../../../schemas/paciente.schema";
import { criarResolvedorZod } from "schemas/resolvedor-zod";
import {
  convenioService,
  type ConvenioListaItem,
} from "../../../services/api";
import type { ErroFormularioAmigavel } from "../../../services/api/errors/erro-formulario";
import { frontendLogger } from "../../../services/logger/frontend-logger";
import styles from "../novo/styles.module.css";
import {
  normalizarErroFormularioPaciente,
  normalizarErrosValidacaoPaciente,
} from "../utils/erro-formulario-paciente";
import { buscarEnderecoPorCep } from "../utils/via-cep";

const sexoOptions = [
  { value: "MASCULINO", label: "Masculino" },
  { value: "FEMININO", label: "Feminino" },
  { value: "OUTRO", label: "Outro" },
] as const;

const generoOptions = [
  "Cisgênero Masculino",
  "Cisgênero Feminino",
  "Transgênero Masculino",
  "Transgênero Feminino",
  "Não Binário",
  "Outro",
  "Prefiro não informar",
] as const;

const pacienteFormDefaultValues: PacienteFormData = {
  nome: "",
  ativo: true,
  telefone: "",
  whatsapp: "",
  email: "",
  cep: "",
  logradouro: "",
  numero: undefined,
  complemento: "",
  bairro: "",
  nomeCidade: "",
  codigoIbgeCidade: "",
  cpf: "",
  dataNascimento: "",
  nomeMae: "",
  sexo: undefined,
  genero: undefined,
  convenioId: undefined,
  numeroCarteirinha: "",
};

type PacienteFormProps = {
  camposVisiveis?: Partial<CamposPacienteVisiveis>;
  defaultValues?: Partial<PacienteFormData>;
  convenioAtual?: ConvenioListaItem | null;
  mostrarCamposConvenio?: boolean;
  onCancel: () => void;
  onSubmit: (formData: PacienteFormData) => Promise<void>;
  parceriaLabel?: string;
  pessoaLabel?: string;
  numeroCarteirinhaLabel?: string;
  submitLabel: string;
  submittingLabel: string;
};

export function PacienteForm({
  camposVisiveis,
  defaultValues,
  convenioAtual = null,
  mostrarCamposConvenio = true,
  onCancel,
  onSubmit,
  parceriaLabel = "Convênio",
  pessoaLabel = "Paciente",
  numeroCarteirinhaLabel = "Número da carteirinha",
  submitLabel,
  submittingLabel,
}: PacienteFormProps) {
  const pessoaMinuscula = pessoaLabel.toLowerCase();
  const camposFormulario = useMemo<CamposPacienteVisiveis>(
    () => ({
      nomeMae: camposVisiveis?.nomeMae ?? true,
      convenio: mostrarCamposConvenio && (camposVisiveis?.convenio ?? true),
      numeroCarteirinha:
        mostrarCamposConvenio &&
        (camposVisiveis?.numeroCarteirinha ?? true),
    }),
    [camposVisiveis, mostrarCamposConvenio],
  );
  const [mensagemErroFormulario, setMensagemErroFormulario] =
    useState<string | null>(null);
  const [errosFormulario, setErrosFormulario] = useState<ErroFormularioAmigavel[]>([]);
  const [convenios, setConvenios] = useState<ConvenioListaItem[]>([]);

  const mergedDefaultValues = useMemo<PacienteFormData>(
    () => ({
      ...pacienteFormDefaultValues,
      ...defaultValues,
    }),
    [defaultValues],
  );

  const {
    clearErrors,
    register,
    handleSubmit,
    getValues,
    setError,
    setValue,
    reset,
    control,
    formState: { dirtyFields, errors, isSubmitting },
  } = useForm<PacienteFormData>({
    resolver: criarResolvedorZod(pacienteSchema),
    defaultValues: mergedDefaultValues,
  });

  const ativo = useWatch({ control, name: "ativo", defaultValue: true });
  const convenioId = useWatch({
    control,
    name: "convenioId",
    defaultValue: mergedDefaultValues.convenioId,
  });
  const conveniosDisponiveis = useMemo(() => {
    if (
      !convenioAtual ||
      convenios.some((convenio) => Number(convenio.id) === Number(convenioAtual.id))
    ) {
      return convenios;
    }

    return [...convenios, convenioAtual].sort((primeiro, segundo) =>
      primeiro.nome.localeCompare(segundo.nome),
    );
  }, [convenioAtual, convenios]);

  useEffect(() => {
    reset(mergedDefaultValues);
  }, [mergedDefaultValues, reset]);

  useEffect(() => {
    if (
      !mergedDefaultValues.convenioId ||
      dirtyFields.convenioId ||
      getValues("convenioId") === mergedDefaultValues.convenioId
    ) {
      return;
    }

    setValue("convenioId", mergedDefaultValues.convenioId, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [
    conveniosDisponiveis,
    dirtyFields.convenioId,
    getValues,
    mergedDefaultValues.convenioId,
    setValue,
  ]);

  useEffect(() => {
    let mounted = true;

    async function carregarConvenios() {
      if (!camposFormulario.convenio) {
        if (mounted) {
          setConvenios([]);
        }
        return;
      }

      try {
        const response = await convenioService.listar();
        if (mounted) {
          setConvenios(response.filter((item) => item.ativo));
        }
      } catch (error) {
        frontendLogger.warn("PacienteForm", "Falha ao carregar convênios", {
          erro: error,
        });
        if (mounted) {
          setConvenios([]);
        }
      }
    }

    void carregarConvenios();

    return () => {
      mounted = false;
    };
  }, [camposFormulario.convenio]);

  useEffect(() => {
    if (!camposFormulario.numeroCarteirinha) {
      return;
    }

    if (!convenioId) {
      setValue("numeroCarteirinha", "", { shouldDirty: true });
    }
  }, [camposFormulario.numeroCarteirinha, convenioId, setValue]);

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
    } catch (error) {
      frontendLogger.debug("PacienteForm", "Falha ao consultar CEP", {
        erro: error,
      });
      // Mantém preenchimento manual quando a consulta do CEP falhar.
    }
  }

  async function handleValidSubmit(formData: PacienteFormData) {
    clearErrors();
    setMensagemErroFormulario(null);
    setErrosFormulario([]);

    try {
      await onSubmit(formData);
    } catch (error) {
      frontendLogger.error("PacienteForm", "Falha ao salvar paciente", {
        erro: error,
      });
      const resultadoErro = normalizarErroFormularioPaciente(error, {
        numeroCarteirinhaLabel,
        parceriaLabel,
        pessoaLabel,
      });

      Object.entries(resultadoErro.errosCampo).forEach(([campo, mensagem]) => {
        if (!mensagem) {
          return;
        }

        setError(campo as keyof PacienteFormData, {
          type: "server",
          message: mensagem,
        });
      });

      setMensagemErroFormulario(resultadoErro.mensagemGlobal);
      setErrosFormulario(resultadoErro.erros);
    }
  }

  function handleInvalidSubmit(errosValidacao: FieldErrors<PacienteFormData>) {
    const resultadoErro = normalizarErrosValidacaoPaciente(errosValidacao, {
      numeroCarteirinhaLabel,
      parceriaLabel,
    });

    setMensagemErroFormulario(resultadoErro.mensagemGlobal);
    setErrosFormulario(resultadoErro.erros);
  }

  return (
    <form
      onSubmit={handleSubmit(handleValidSubmit, handleInvalidSubmit)}
      className={styles.form}
      noValidate
    >
      {mensagemErroFormulario ? (
        <AvisoErroFormulario
          titulo={
            errosFormulario.length > 0
              ? "Verifique os campos abaixo:"
              : "Não foi possível concluir o cadastro."
          }
          mensagem={errosFormulario.length === 0 ? mensagemErroFormulario : undefined}
          erros={errosFormulario}
        />
      ) : null}

      <section
        className={styles.section}
        aria-labelledby="dados-pessoais-title"
      >
        <div className={styles.sectionTitle} id="dados-pessoais-title">
          <FaUser className={styles.sectionIcon} />
          <span>Dados do {pessoaMinuscula}</span>
        </div>

        <div className={styles.grid}>
          <FormField
            id="paciente-nome"
            label="Nome completo"
            required
            error={errors.nome?.message}
            colSpan="full"
          >
            <input
              className={`${styles.input} ${errors.nome ? styles.inputError : ""}`}
              placeholder="Ex: João Ricardo Silva"
              autoComplete="name"
              {...register("nome")}
            />
          </FormField>

          <FormField id="paciente-cpf" label="CPF" error={errors.cpf?.message}>
            <input
              className={`${styles.input} ${errors.cpf ? styles.inputError : ""}`}
              placeholder="000.000.000-00"
              inputMode="numeric"
              autoComplete="off"
              {...register("cpf")}
            />
          </FormField>

          <FormField
            id="paciente-data-nascimento"
            label="Data de nascimento"
            error={errors.dataNascimento?.message}
          >
            <input
              className={`${styles.input} ${errors.dataNascimento ? styles.inputError : ""}`}
              type="date"
              {...register("dataNascimento")}
            />
          </FormField>

          {camposFormulario.nomeMae ? (
            <FormField
              id="paciente-nome-mae"
              label="Nome da mãe"
              error={errors.nomeMae?.message}
            >
              <input
                className={styles.input}
                placeholder="Ex: Maria Silva"
                {...register("nomeMae")}
              />
            </FormField>
          ) : (
            <input type="hidden" {...register("nomeMae")} />
          )}

          <FormField
            id="paciente-sexo"
            label="Sexo"
            error={errors.sexo?.message}
          >
            <select
              className={`${styles.input} ${errors.sexo ? styles.inputError : ""}`}
              {...register("sexo")}
            >
              <option value="">Selecione...</option>
              {sexoOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            id="paciente-genero"
            label="Gênero"
            error={errors.genero?.message}
          >
            <select className={styles.input} {...register("genero")}>
              <option value="">Selecione...</option>
              {generoOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FormField>

          {camposFormulario.convenio ? (
            <FormField
              id="paciente-convenio"
              label={parceriaLabel}
              error={errors.convenioId?.message}
            >
              <select
                className={`${styles.input} ${errors.convenioId ? styles.inputError : ""}`}
                {...register("convenioId", {
                  setValueAs: (value) => (value ? Number(value) : undefined),
                })}
              >
                <option value="">Selecione...</option>
                {conveniosDisponiveis.map((convenio) => (
                  <option key={convenio.id} value={convenio.id}>
                    {convenio.nome}
                  </option>
                ))}
              </select>
            </FormField>
          ) : (
            <input
              type="hidden"
              {...register("convenioId", {
                setValueAs: (value) => (value ? Number(value) : undefined),
              })}
            />
          )}

          {camposFormulario.numeroCarteirinha ? (
            <FormField
              id="paciente-numero-carteirinha"
              label={numeroCarteirinhaLabel}
              error={errors.numeroCarteirinha?.message}
            >
              <input
                className={styles.input}
                placeholder="Ex: 1234567890"
                disabled={!convenioId}
                {...register("numeroCarteirinha")}
              />
            </FormField>
          ) : (
            <input type="hidden" {...register("numeroCarteirinha")} />
          )}

          <FormField label="Status">
            <div className={styles.toggleWrapper}>
              <input
                type="checkbox"
                id="paciente-ativo"
                className={styles.toggleInput}
                {...register("ativo")}
              />
              <label
                htmlFor="paciente-ativo"
                className={`${styles.toggleLabel} ${ativo ? styles.toggleOn : ""}`}
              >
                <span className={styles.toggleSlider} />
              </label>
              <span className={styles.toggleText} aria-live="polite">
                {ativo ? "Ativo" : "Inativo"}
              </span>
            </div>
          </FormField>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="contato-title">
        <div className={styles.sectionTitle} id="contato-title">
          <FaPhone className={styles.sectionIcon} />
          <span>Contato</span>
        </div>

        <div className={styles.grid}>
          <FormField
            id="paciente-telefone"
            label="Telefone"
            required
            error={errors.telefone?.message}
          >
            <input
              className={`${styles.input} ${errors.telefone ? styles.inputError : ""}`}
              placeholder="(11) 99999-9999"
              autoComplete="tel"
              inputMode="tel"
              {...register("telefone")}
            />
          </FormField>

          <FormField
            id="paciente-whatsapp"
            label="WhatsApp"
            error={errors.whatsapp?.message}
          >
            <input
              className={styles.input}
              placeholder="(11) 99999-9999"
              autoComplete="tel"
              inputMode="tel"
              {...register("whatsapp")}
            />
          </FormField>

          <FormField
            id="paciente-email"
            label="E-mail"
            error={errors.email?.message}
            colSpan="full"
          >
            <input
              className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
              type="email"
              placeholder="joao@email.com"
              autoComplete="email"
              {...register("email")}
            />
          </FormField>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="endereco-title">
        <div className={styles.sectionTitle} id="endereco-title">
          <FaMapMarkerAlt className={styles.sectionIcon} />
          <span>Endereço</span>
        </div>

        <div className={styles.grid}>
          <FormField id="paciente-cep" label="CEP" error={errors.cep?.message}>
            <input
              className={styles.input}
              placeholder="00000-000"
              inputMode="numeric"
              autoComplete="postal-code"
              {...register("cep")}
              onBlur={handleCepBlur}
            />
          </FormField>

          <FormField
            id="paciente-logradouro"
            label="Logradouro"
            error={errors.logradouro?.message}
            colSpan="wide"
          >
            <input
              className={styles.input}
              placeholder="Rua, Avenida..."
              autoComplete="address-line1"
              {...register("logradouro")}
            />
          </FormField>

          <FormField
            id="paciente-numero"
            label="Número"
            error={errors.numero?.message}
          >
            <input
              className={styles.input}
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
            id="paciente-complemento"
            label="Complemento"
            error={errors.complemento?.message}
          >
            <input
              className={styles.input}
              placeholder="Apto, Bloco..."
              autoComplete="address-line2"
              {...register("complemento")}
            />
          </FormField>

          <FormField
            id="paciente-bairro"
            label="Bairro"
            error={errors.bairro?.message}
          >
            <input
              className={styles.input}
              placeholder="Bairro"
              autoComplete="address-level2"
              {...register("bairro")}
            />
          </FormField>

          <FormField
            id="paciente-nome-cidade"
            label="Cidade"
            error={errors.nomeCidade?.message}
          >
            <input
              className={styles.input}
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
          {isSubmitting ? submittingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}

