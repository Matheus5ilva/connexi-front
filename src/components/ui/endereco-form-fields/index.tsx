import { FormField } from "../form-field";
import { buscarEnderecoPorCep } from "../../../services/via-cep";
import styles from "./styles.module.css";

export type EnderecoFormFieldsValue = {
  cep?: string;
  logradouro?: string;
  numero?: number;
  complemento?: string;
  bairro?: string;
  nomeCidade?: string;
  uf?: string;
  codigoIbgeCidade?: string;
};

type EnderecoFormFieldsProps = {
  value: EnderecoFormFieldsValue;
  errors?: Partial<Record<keyof EnderecoFormFieldsValue, string>>;
  idPrefix: string;
  onChange: <K extends keyof EnderecoFormFieldsValue>(
    campo: K,
    valor: EnderecoFormFieldsValue[K],
  ) => void;
};

function formatarCidadeUf(value: EnderecoFormFieldsValue): string {
  return [value.nomeCidade, value.uf].filter(Boolean).join(" - ");
}

export function EnderecoFormFields({
  value,
  errors = {},
  idPrefix,
  onChange,
}: EnderecoFormFieldsProps) {
  async function handleCepBlur() {
    const endereco = await buscarEnderecoPorCep(value.cep ?? "").catch(
      () => null,
    );
    if (!endereco) {
      return;
    }

    if (endereco.logradouro) {
      onChange("logradouro", endereco.logradouro);
    }

    if (endereco.bairro) {
      onChange("bairro", endereco.bairro);
    }

    if (endereco.nomeCidade) {
      onChange("nomeCidade", endereco.nomeCidade);
    }

    if (endereco.uf) {
      onChange("uf", endereco.uf);
    }

    if (endereco.codigoIbgeCidade) {
      onChange("codigoIbgeCidade", endereco.codigoIbgeCidade);
    }
  }

  return (
    <div className={styles.grid}>
      <FormField id={`${idPrefix}-cep`} label="CEP" error={errors.cep}>
        <input
          className={`${styles.input} ${errors.cep ? styles.inputError : ""}`}
          placeholder="00000-000"
          inputMode="numeric"
          autoComplete="postal-code"
          value={value.cep ?? ""}
          onBlur={() => void handleCepBlur()}
          onChange={(event) => onChange("cep", event.target.value)}
        />
      </FormField>

      <FormField
        id={`${idPrefix}-logradouro`}
        label="Logradouro"
        error={errors.logradouro}
        colSpan="wide"
      >
        <input
          className={`${styles.input} ${
            errors.logradouro ? styles.inputError : ""
          }`}
          placeholder="Rua, avenida..."
          autoComplete="address-line1"
          value={value.logradouro ?? ""}
          onChange={(event) => onChange("logradouro", event.target.value)}
        />
      </FormField>

      <FormField id={`${idPrefix}-numero`} label="Número" error={errors.numero}>
        <input
          className={`${styles.input} ${errors.numero ? styles.inputError : ""}`}
          type="number"
          placeholder="123"
          inputMode="numeric"
          value={value.numero ?? ""}
          onChange={(event) =>
            onChange(
              "numero",
              event.target.value ? Number(event.target.value) : undefined,
            )
          }
        />
      </FormField>

      <FormField
        id={`${idPrefix}-complemento`}
        label="Complemento"
        error={errors.complemento}
      >
        <input
          className={`${styles.input} ${
            errors.complemento ? styles.inputError : ""
          }`}
          placeholder="Sala, bloco..."
          autoComplete="address-line2"
          value={value.complemento ?? ""}
          onChange={(event) => onChange("complemento", event.target.value)}
        />
      </FormField>

      <FormField id={`${idPrefix}-bairro`} label="Bairro" error={errors.bairro}>
        <input
          className={`${styles.input} ${errors.bairro ? styles.inputError : ""}`}
          placeholder="Bairro"
          autoComplete="address-level2"
          value={value.bairro ?? ""}
          onChange={(event) => onChange("bairro", event.target.value)}
        />
      </FormField>

      <FormField
        id={`${idPrefix}-cidade`}
        label="Cidade"
        hint="Preenchida automaticamente a partir do CEP."
        error={errors.nomeCidade ?? errors.uf ?? errors.codigoIbgeCidade}
      >
        <input
          className={`${styles.input} ${
            errors.nomeCidade || errors.uf || errors.codigoIbgeCidade
              ? styles.inputError
              : ""
          }`}
          placeholder="Cidade - UF"
          value={formatarCidadeUf(value)}
          disabled
          readOnly
        />
      </FormField>
    </div>
  );
}
