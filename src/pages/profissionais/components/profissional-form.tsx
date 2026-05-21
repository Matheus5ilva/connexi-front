import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch, type FieldErrors } from "react-hook-form";
import { criarResolvedorZod } from "schemas/resolvedor-zod";
import { FaMapMarkerAlt, FaPhone, FaUserMd } from "react-icons/fa";
import { AvisoErroFormulario } from "../../../components/ui/aviso-erro-formulario";
import { FormField } from "../../../components/ui/form-field";
import { buscarEnderecoPorCep } from "../../pacientes/utils/via-cep";
import {
  especialidadeService,
  isApiError,
  type EspecialidadeListaItem,
} from "../../../services/api";
import {
  profissionalSchema,
  type ProfissionalFormData,
} from "../../../schemas/profissional.schema";
import type { ErroFormularioAmigavel } from "../../../services/api/errors/erro-formulario";
import {
  normalizarErroFormularioPadrao,
  normalizarErrosValidacaoReactHookForm,
} from "../../../services/api/errors/erro-formulario-validacao";
import styles from "./form-shared.module.css";

const profissionalFormDefaultValues: ProfissionalFormData = {
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
  tipoProfissional: "",
  numeroRegistro: "",
  especialidadeId: undefined,
};

const mapaCamposServidor: Partial<Record<string, keyof ProfissionalFormData>> =
  {
    "pessoa.nome": "nome",
    "pessoa.contato.telefone": "telefone",
    "pessoa.contato.whatsapp": "whatsapp",
    "pessoa.contato.email": "email",
    "pessoa.endereco.cep": "cep",
    "pessoa.endereco.logradouro": "logradouro",
    "pessoa.endereco.numero": "numero",
    "pessoa.endereco.complemento": "complemento",
    "pessoa.endereco.bairro": "bairro",
    "pessoa.cidade.codigoIbge": "codigoIbgeCidade",
    tipoProfissional: "tipoProfissional",
    numeroRegistro: "numeroRegistro",
    "especialidade.id": "especialidadeId",
    ativo: "ativo",
  };

const mapaRotulosCampos = {
  nome: "Nome completo",
  telefone: "Telefone",
  whatsapp: "WhatsApp",
  email: "E-mail",
  cep: "CEP",
  logradouro: "Logradouro",
  numero: "Número",
  complemento: "Complemento",
  bairro: "Bairro",
  nomeCidade: "Cidade",
  codigoIbgeCidade: "Cidade",
  tipoProfissional: "Tipo profissional",
  numeroRegistro: "Número de registro",
  especialidadeId: "Especialidade",
} satisfies Record<string, string>;

type ProfissionalFormProps = {
  initialValues?: Partial<ProfissionalFormData>;
  submitLabel: string;
  mostrarCampoAtivo?: boolean;
  onSubmit: (values: ProfissionalFormData) => Promise<void> | void;
  onCancel: () => void;
  onManageEspecialidades?: () => void;
};

export function ProfissionalForm({
  initialValues,
  submitLabel,
  mostrarCampoAtivo = true,
  onSubmit,
  onCancel,
  onManageEspecialidades,
}: ProfissionalFormProps) {
  const [mensagemErroFormulario, setMensagemErroFormulario] = useState<
    string | null
  >(null);
  const [errosFormulario, setErrosFormulario] = useState<
    ErroFormularioAmigavel[]
  >([]);
  const [especialidadesDisponiveis, setEspecialidadesDisponiveis] = useState<
    EspecialidadeListaItem[]
  >([]);
  const [especialidadesError, setEspecialidadesError] = useState<string | null>(
    null,
  );

  const defaultValues = useMemo<ProfissionalFormData>(
    () => ({
      ...profissionalFormDefaultValues,
      ...initialValues,
    }),
    [initialValues],
  );

  const {
    clearErrors,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    control,
    formState: { dirtyFields, errors, isSubmitting },
  } = useForm<ProfissionalFormData>({
    resolver: criarResolvedorZod(profissionalSchema),
    defaultValues,
  });

  const ativo = useWatch({ control, name: "ativo", defaultValue: true });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    const especialidadeId = defaultValues.especialidadeId;

    if (
      !especialidadeId ||
      dirtyFields.especialidadeId ||
      !especialidadesDisponiveis.some(
        (especialidade) => especialidade.id === especialidadeId,
      )
    ) {
      return;
    }

    setValue("especialidadeId", especialidadeId, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [
    defaultValues.especialidadeId,
    dirtyFields.especialidadeId,
    especialidadesDisponiveis,
    setValue,
  ]);

  useEffect(() => {
    let ativoComponente = true;

    async function carregarEspecialidades() {
      try {
        const response = await especialidadeService.listar();
        if (!ativoComponente) {
          return;
        }

        setEspecialidadesDisponiveis(response);
        setEspecialidadesError(null);
      } catch (error) {
        if (!ativoComponente) {
          return;
        }

        const resultadoErro = normalizarErroFormularioPadrao({
          erro: error,
          mensagemPadrao: "Não foi possível carregar as especialidades.",
        });

        setEspecialidadesDisponiveis([]);
        setEspecialidadesError(resultadoErro.mensagemGlobal);
      }
    }

    void carregarEspecialidades();

    return () => {
      ativoComponente = false;
    };
  }, []);

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

  async function handleSubmitForm(values: ProfissionalFormData) {
    clearErrors();
    setMensagemErroFormulario(null);
    setErrosFormulario([]);

    try {
      await onSubmit(values);
    } catch (error) {
      if (isApiError(error) && error.fieldErrors) {
        Object.entries(error.fieldErrors).forEach(
          ([campoServidor, mensagens]) => {
            const primeiraMensagem = mensagens?.[0];
            const campoNormalizado =
              mapaCamposServidor[campoServidor] ??
              (campoServidor as keyof ProfissionalFormData);

            if (!primeiraMensagem) {
              return;
            }

            setError(campoNormalizado, {
              type: "server",
              message: primeiraMensagem,
            });
          },
        );
      }

      const resultadoErro = normalizarErroFormularioPadrao({
        erro: error,
        mapaRotulosCampos,
        mapaCamposServidor: mapaCamposServidor as Record<string, string>,
        mensagemPadrao:
          "Não foi possível salvar os dados do profissional. Tente novamente em instantes.",
      });

      Object.entries(resultadoErro.errosCampo).forEach(([campo, mensagem]) => {
        if (!mensagem) {
          return;
        }

        setError(campo as keyof ProfissionalFormData, {
          type: "server",
          message: mensagem,
        });
      });

      setMensagemErroFormulario(resultadoErro.mensagemGlobal);
      setErrosFormulario(resultadoErro.erros);
    }
  }

  function handleSubmitInvalido(
    errosValidacao: FieldErrors<ProfissionalFormData>,
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
        aria-labelledby="profissional-dados-title"
      >
        <div className={styles.sectionTitle} id="profissional-dados-title">
          <FaUserMd className={styles.sectionIcon} />
          <span>Dados profissionais</span>
        </div>

        <div className={styles.grid}>
          <FormField
            id="profissional-nome"
            label="Nome completo"
            required
            error={errors.nome?.message}
            colSpan="full"
          >
            <input
              className={`${styles.input} ${errors.nome ? styles.inputError : ""}`}
              placeholder="Ex.: Dra. Maria Helena Souza"
              autoComplete="name"
              {...register("nome")}
            />
          </FormField>

          <FormField
            id="profissional-tipo"
            label="Tipo profissional"
            error={errors.tipoProfissional?.message}
          >
            <input
              className={`${styles.input} ${errors.tipoProfissional ? styles.inputError : ""}`}
              placeholder={"Ex.: Psicóloga clínica"}
              {...register("tipoProfissional")}
            />
          </FormField>

          <FormField
            id="profissional-registro"
            label={"Número de registro"}
            error={errors.numeroRegistro?.message}
          >
            <input
              className={`${styles.input} ${errors.numeroRegistro ? styles.inputError : ""}`}
              placeholder="Ex.: CRP 06/123456"
              {...register("numeroRegistro")}
            />
          </FormField>

          <FormField
            id="profissional-especialidade"
            label="Especialidade"
            required
            error={
              errors.especialidadeId?.message ??
              especialidadesError ??
              undefined
            }
            colSpan="full"
          >
            <select
              className={`${styles.input} ${errors.especialidadeId ? styles.inputError : ""}`}
              {...register("especialidadeId", {
                setValueAs: (value) => (value ? Number(value) : undefined),
              })}
            >
              <option value="">Selecione...</option>
              {especialidadesDisponiveis.map((especialidade) => (
                <option key={especialidade.id} value={especialidade.id}>
                  {especialidade.nome}
                </option>
              ))}
            </select>
          </FormField>

          {onManageEspecialidades ? (
            <div className={styles.assistActions}>
              <button
                type="button"
                className={styles.assistBtn}
                onClick={onManageEspecialidades}
              >
                Gerenciar especialidades
              </button>
            </div>
          ) : null}

          {mostrarCampoAtivo ? (
            <FormField label="Status" colSpan="full">
              <div className={styles.toggleWrapper}>
                <input
                  type="checkbox"
                  id="profissional-ativo"
                  className={styles.toggleInput}
                  {...register("ativo")}
                />
                <label
                  htmlFor="profissional-ativo"
                  className={`${styles.toggleLabel} ${ativo ? styles.toggleOn : ""}`}
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

      <section className={styles.section} aria-labelledby="contato-title">
        <div className={styles.sectionTitle} id="contato-title">
          <FaPhone className={styles.sectionIcon} />
          <span>Contato</span>
        </div>

        <div className={styles.grid}>
          <FormField
            id="profissional-email"
            label="E-mail"
            required
            error={errors.email?.message}
            colSpan="full"
          >
            <input
              className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
              type="email"
              placeholder="profissional@consultorio.com"
              autoComplete="email"
              {...register("email")}
            />
          </FormField>

          <FormField
            id="profissional-telefone"
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
            id="profissional-whatsapp"
            label="WhatsApp"
            error={errors.whatsapp?.message}
          >
            <input
              className={`${styles.input} ${errors.whatsapp ? styles.inputError : ""}`}
              placeholder="(11) 99999-9999"
              autoComplete="tel"
              inputMode="tel"
              {...register("whatsapp")}
            />
          </FormField>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="endereco-title">
        <div className={styles.sectionTitle} id="endereco-title">
          <FaMapMarkerAlt className={styles.sectionIcon} />
          <span>{"Endereço"}</span>
        </div>

        <div className={styles.grid}>
          <FormField
            id="profissional-cep"
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
            id="profissional-logradouro"
            label="Logradouro"
            error={errors.logradouro?.message}
            colSpan="wide"
          >
            <input
              className={`${styles.input} ${errors.logradouro ? styles.inputError : ""}`}
              placeholder="Rua, avenida..."
              autoComplete="address-line1"
              {...register("logradouro")}
            />
          </FormField>

          <FormField
            id="profissional-numero"
            label={"Número"}
            error={errors.numero?.message}
          >
            <input
              className={`${styles.input} ${errors.numero ? styles.inputError : ""}`}
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
            id="profissional-complemento"
            label="Complemento"
            error={errors.complemento?.message}
          >
            <input
              className={`${styles.input} ${errors.complemento ? styles.inputError : ""}`}
              placeholder="Sala, bloco..."
              autoComplete="address-line2"
              {...register("complemento")}
            />
          </FormField>

          <FormField
            id="profissional-bairro"
            label="Bairro"
            error={errors.bairro?.message}
          >
            <input
              className={`${styles.input} ${errors.bairro ? styles.inputError : ""}`}
              placeholder="Bairro"
              autoComplete="address-level2"
              {...register("bairro")}
            />
          </FormField>

          <FormField
            id="profissional-nome-cidade"
            label="Cidade"
            hint="Preenchida automaticamente a partir do CEP."
            error={errors.nomeCidade?.message}
          >
            <input
              className={`${styles.input} ${errors.nomeCidade ? styles.inputError : ""}`}
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
