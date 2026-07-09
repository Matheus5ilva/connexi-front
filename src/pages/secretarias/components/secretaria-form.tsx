import { useEffect, useMemo, useState, type FormEvent } from "react";
import { FaMapMarkerAlt, FaPhone, FaShieldAlt, FaUser } from "react-icons/fa";
import { AvisoErroFormulario } from "../../../components/ui/aviso-erro-formulario";
import {
  EnderecoFormFields,
  type EnderecoFormFieldsValue,
} from "../../../components/ui/endereco-form-fields";
import { FormField } from "../../../components/ui/form-field";
import {
  secretariaCriacaoFormularioSchema,
  secretariaFormularioSchema,
  type SecretariaCriacaoFormularioData,
  type SecretariaFormularioData,
} from "../../../schemas/secretaria.schema";
import {
  normalizarErroZodFormulario,
} from "../../../services/api/errors/erro-formulario-validacao";
import type { ErroFormularioAmigavel } from "../../../services/api/errors/erro-formulario";
import { toErrorMessage } from "../../../services/api";
import styles from "../styles.module.css";

type SecretariaFormMode = "criar" | "editar";
type SecretariaFormSubmitData =
  | SecretariaFormularioData
  | SecretariaCriacaoFormularioData;

type SecretariaFormProps = {
  defaultValues?: Partial<SecretariaFormularioData>;
  mode: SecretariaFormMode;
  onCancel: () => void;
  onSubmit: (formData: SecretariaFormSubmitData) => Promise<void>;
  submitLabel: string;
  submittingLabel: string;
};

const FORMULARIO_INICIAL: SecretariaFormularioData = {
  nome: "",
  telefone: "",
  whatsapp: "",
  email: "",
  logradouro: "",
  numero: undefined,
  complemento: "",
  bairro: "",
  nomeCidade: "",
  uf: "",
  cep: "",
  codigoIbgeCidade: "",
  podeAcessarFinanceiro: false,
  senhaProvisoria: "",
};

const rotulosCampos = {
  nome: "Nome",
  telefone: "Telefone",
  whatsapp: "WhatsApp",
  email: "E-mail",
  logradouro: "Logradouro",
  numero: "Número",
  complemento: "Complemento",
  bairro: "Bairro",
  cep: "CEP",
  nomeCidade: "Cidade",
  uf: "UF",
  codigoIbgeCidade: "Cidade",
  podeAcessarFinanceiro: "Acesso ao financeiro",
  senhaProvisoria: "Senha provisória",
};

export function SecretariaForm({
  defaultValues,
  mode,
  onCancel,
  onSubmit,
  submitLabel,
  submittingLabel,
}: SecretariaFormProps) {
  const valoresIniciais = useMemo(
    () => ({ ...FORMULARIO_INICIAL, ...defaultValues }),
    [defaultValues],
  );
  const [formulario, setFormulario] =
    useState<SecretariaFormularioData>(valoresIniciais);
  const [salvando, setSalvando] = useState(false);
  const [mensagemErroFormulario, setMensagemErroFormulario] = useState<
    string | null
  >(null);
  const [errosFormulario, setErrosFormulario] = useState<
    ErroFormularioAmigavel[]
  >([]);
  const [errosCampo, setErrosCampo] = useState<
    Partial<Record<keyof SecretariaFormularioData, string>>
  >({});

  useEffect(() => {
    setFormulario(valoresIniciais);
  }, [valoresIniciais]);

  function limparFeedbackFormulario() {
    setMensagemErroFormulario(null);
    setErrosFormulario([]);
    setErrosCampo({});
  }

  function atualizarCampo<K extends keyof SecretariaFormularioData>(
    campo: K,
    valor: SecretariaFormularioData[K],
  ) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
    limparFeedbackFormulario();
  }

  function atualizarEndereco(
    campo: keyof EnderecoFormFieldsValue,
    valor: EnderecoFormFieldsValue[keyof EnderecoFormFieldsValue],
  ) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
    limparFeedbackFormulario();
  }

  async function salvarSecretaria(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const schema =
      mode === "criar"
        ? secretariaCriacaoFormularioSchema
        : secretariaFormularioSchema;
    const formularioValidado = schema.safeParse(formulario);

    if (!formularioValidado.success) {
      const resultadoErro = normalizarErroZodFormulario(
        formularioValidado.error,
        {
          mapaRotulosCampos: rotulosCampos,
          mensagemPadrao: "Dados inválidos para salvar secretária.",
        },
      );
      setMensagemErroFormulario(resultadoErro.mensagemGlobal);
      setErrosFormulario(resultadoErro.erros);
      setErrosCampo(
        resultadoErro.errosCampo as Partial<
          Record<keyof SecretariaFormularioData, string>
        >,
      );
      return;
    }

    setSalvando(true);
    limparFeedbackFormulario();

    try {
      await onSubmit(formularioValidado.data);
    } catch (error) {
      setMensagemErroFormulario(
        toErrorMessage(error, "Não foi possível salvar a secretária."),
      );
      setErrosFormulario([]);
      setErrosCampo({});
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form className={styles.formulario} onSubmit={salvarSecretaria} noValidate>
      {mensagemErroFormulario ? (
        <AvisoErroFormulario
          mensagem={
            errosFormulario.length === 0 ? mensagemErroFormulario : undefined
          }
          erros={errosFormulario}
        />
      ) : null}

      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <FaUser className={styles.sectionIcon} />
          Dados cadastrais
        </div>

        <div className={styles.gradeFormulario}>
          <FormField
            id="secretaria-nome"
            label="Nome completo"
            required
            error={errosCampo.nome}
            colSpan="full"
          >
            <input
              className={`${styles.input} ${errosCampo.nome ? styles.inputError : ""}`}
              type="text"
              value={formulario.nome}
              onChange={(event) => atualizarCampo("nome", event.target.value)}
              placeholder="Ex.: Maria Helena Souza"
              autoComplete="name"
            />
          </FormField>

          <FormField
            id="secretaria-email"
            label="E-mail"
            required
            error={errosCampo.email}
            colSpan="full"
          >
            <input
              className={`${styles.input} ${errosCampo.email ? styles.inputError : ""}`}
              type="email"
              value={formulario.email}
              onChange={(event) => atualizarCampo("email", event.target.value)}
              placeholder="secretaria@email.com"
              autoComplete="email"
            />
          </FormField>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <FaPhone className={styles.sectionIcon} />
          Contato
        </div>

        <div className={styles.gradeFormulario}>
          <FormField
            id="secretaria-telefone"
            label="Telefone"
            required
            error={errosCampo.telefone}
          >
            <input
              className={`${styles.input} ${errosCampo.telefone ? styles.inputError : ""}`}
              type="text"
              value={formulario.telefone}
              onChange={(event) =>
                atualizarCampo("telefone", event.target.value)
              }
              placeholder="(11) 99999-9999"
              autoComplete="tel"
              inputMode="tel"
            />
          </FormField>

          <FormField
            id="secretaria-whatsapp"
            label="WhatsApp"
            error={errosCampo.whatsapp}
          >
            <input
              className={`${styles.input} ${errosCampo.whatsapp ? styles.inputError : ""}`}
              type="text"
              value={formulario.whatsapp ?? ""}
              onChange={(event) =>
                atualizarCampo("whatsapp", event.target.value)
              }
              placeholder="(11) 99999-9999"
              autoComplete="tel"
              inputMode="tel"
            />
          </FormField>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <FaMapMarkerAlt className={styles.sectionIcon} />
          Endereço
        </div>

        <EnderecoFormFields
          idPrefix="secretaria"
          value={formulario}
          errors={errosCampo}
          onChange={atualizarEndereco}
        />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <FaShieldAlt className={styles.sectionIcon} />
          Acesso
        </div>

        <div className={styles.gradeFormulario}>
          {mode === "criar" ? (
            <FormField
              id="secretaria-senha-provisoria"
              label="Senha provisória"
              required
              error={errosCampo.senhaProvisoria}
              colSpan="full"
            >
              <input
                className={`${styles.input} ${
                  errosCampo.senhaProvisoria ? styles.inputError : ""
                }`}
                type="password"
                value={formulario.senhaProvisoria ?? ""}
                onChange={(event) =>
                  atualizarCampo("senhaProvisoria", event.target.value)
                }
                autoComplete="new-password"
              />
            </FormField>
          ) : null}

          <label className={styles.checkboxLinha}>
            <input
              type="checkbox"
              checked={formulario.podeAcessarFinanceiro}
              onChange={(event) =>
                atualizarCampo("podeAcessarFinanceiro", event.target.checked)
              }
            />
            Permitir acesso ao financeiro
          </label>
        </div>
      </section>

      <div className={styles.formActions}>
        <button
          type="button"
          className={styles.btnSecondary}
          onClick={onCancel}
          disabled={salvando}
        >
          Cancelar
        </button>
        <button type="submit" className={styles.btnPrimary} disabled={salvando}>
          {salvando ? submittingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
