import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch, type FieldErrors } from "react-hook-form";
import { criarResolvedorZod } from "schemas/resolvedor-zod";
import { AvisoErroFormulario } from "../../../components/ui/aviso-erro-formulario";
import { FormField } from "../../../components/ui/form-field";
import { formatarDataSomenteDia } from "../../../domain/data-somente-dia";
import {
  documentoPagarSchema,
  type DocumentoPagarFormData,
} from "../../../schemas/documento-pagar.schema";
import { documentoPagarService } from "../../../services/api";
import type { ErroFormularioAmigavel } from "../../../services/api/errors/erro-formulario";
import {
  criarMapaCamposServidor,
  normalizarErroFormularioPadrao,
  normalizarErrosValidacaoReactHookForm,
} from "../../../services/api/errors/erro-formulario-validacao";
import styles from "./documento-pagar-form.module.css";

type DocumentoPagarFormProps = {
  initialValues: DocumentoPagarFormData;
  submitLabel: string;
  statusLabel: string;
  onSubmit: (values: DocumentoPagarFormData) => Promise<void> | void;
  onCancel: () => void;
  enableParcelamento?: boolean;
};

const mapaRotulosCampos = {
  descricao: "Descrição",
  valor: "Valor total",
  dataVencimento: "Data de vencimento",
  status: "Status",
  categoria: "Categoria",
  observacao: "Observação",
  parcelado: "Parcelamento",
  quantidadeParcelas: "Quantidade de parcelas",
} satisfies Record<string, string>;

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function converterValorParaCentavos(valor: number): number {
  if (!Number.isFinite(valor) || valor <= 0) {
    return 0;
  }

  return Math.round((valor + Number.EPSILON) * 100);
}

function converterCentavosParaValor(valorCentavos: number): number {
  return valorCentavos / 100;
}

function ratearValorTotalEmParcelas(
  valorTotal: number,
  quantidadeParcelas: number,
): number[] {
  const totalParcelas = Math.trunc(Number(quantidadeParcelas));
  const valorTotalCentavos = converterValorParaCentavos(Number(valorTotal));

  if (totalParcelas <= 0 || valorTotalCentavos <= 0) {
    return [];
  }

  const valorBaseCentavos = Math.floor(valorTotalCentavos / totalParcelas);
  const restoCentavos = valorTotalCentavos % totalParcelas;
  const primeiraParcelaComResto = totalParcelas - restoCentavos;

  return Array.from({ length: totalParcelas }, (_, indice) =>
    converterCentavosParaValor(
      valorBaseCentavos + (indice >= primeiraParcelaComResto ? 1 : 0),
    ),
  );
}

export function DocumentoPagarForm({
  initialValues,
  submitLabel,
  statusLabel,
  onSubmit,
  onCancel,
  enableParcelamento = false,
}: DocumentoPagarFormProps) {
  const [mensagemErroFormulario, setMensagemErroFormulario] = useState<
    string | null
  >(null);
  const [errosFormulario, setErrosFormulario] = useState<
    ErroFormularioAmigavel[]
  >([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const defaults = useMemo(() => initialValues, [initialValues]);

  const {
    clearErrors,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<DocumentoPagarFormData>({
    resolver: criarResolvedorZod(documentoPagarSchema),
    defaultValues: defaults,
  });

  const parcelado = useWatch({ control, name: "parcelado" });
  const quantidadeParcelas = useWatch({ control, name: "quantidadeParcelas" });
  const valor = useWatch({ control, name: "valor" });
  const dataVencimento = useWatch({ control, name: "dataVencimento" });
  const valoresParcelas = useMemo(
    () =>
      ratearValorTotalEmParcelas(
        Number(valor || 0),
        Number(quantidadeParcelas || 0),
      ),
    [quantidadeParcelas, valor],
  );
  const parcelasComMesmoValor =
    valoresParcelas.length > 0 &&
    valoresParcelas.every(
      (valorParcela) => valorParcela === valoresParcelas[0],
    );

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  useEffect(() => {
    let ativo = true;

    async function carregarCategorias() {
      try {
        const resposta = await documentoPagarService.listarCategorias();
        if (ativo) {
          setCategorias(resposta);
        }
      } catch {
        if (ativo) {
          setCategorias([]);
        }
      }
    }

    void carregarCategorias();

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (!enableParcelamento) {
      setValue("parcelado", false, { shouldDirty: false });
      setValue("quantidadeParcelas", 1, { shouldDirty: false });
    }
  }, [enableParcelamento, setValue]);

  useEffect(() => {
    if (!parcelado) {
      setValue("quantidadeParcelas", 1, { shouldDirty: false });
    }
  }, [parcelado, setValue]);

  async function handleFormSubmit(values: DocumentoPagarFormData) {
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
        mensagemPadrao: "Não foi possível salvar a conta a pagar.",
      });

      Object.entries(resultadoErro.errosCampo).forEach(([campo, mensagem]) => {
        if (!mensagem) {
          return;
        }

        setError(campo as keyof DocumentoPagarFormData, {
          type: "server",
          message: mensagem,
        });
      });

      setMensagemErroFormulario(resultadoErro.mensagemGlobal);
      setErrosFormulario(resultadoErro.erros);
    }
  }

  function handleSubmitInvalido(
    errosValidacao: FieldErrors<DocumentoPagarFormData>,
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
      onSubmit={handleSubmit(handleFormSubmit, handleSubmitInvalido)}
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
        aria-labelledby="documento-dados-title"
      >
        <h2 className={styles.sectionTitle} id="documento-dados-title">
          Dados da conta
        </h2>

        <div className={styles.grid}>
          <FormField
            id="documento-descricao"
            label={"Descrição"}
            required
            error={errors.descricao?.message}
            colSpan="full"
          >
            <input
              className={`${styles.input} ${errors.descricao ? styles.inputError : ""}`}
              placeholder={"Ex.: aluguel, internet, material clínico"}
              {...register("descricao")}
            />
          </FormField>

          <FormField
            id="documento-valor"
            label="Valor total (R$)"
            required
            error={errors.valor?.message}
          >
            <input
              className={`${styles.input} ${errors.valor ? styles.inputError : ""}`}
              type="number"
              step="0.01"
              min={0.01}
              max={100000}
              {...register("valor")}
            />
          </FormField>

          <FormField
            id="documento-vencimento"
            label="Data de vencimento"
            required
            error={errors.dataVencimento?.message}
          >
            <input
              className={`${styles.input} ${errors.dataVencimento ? styles.inputError : ""}`}
              type="date"
              {...register("dataVencimento")}
            />
          </FormField>

          <FormField
            id="documento-status"
            label={statusLabel}
            required
            error={errors.status?.message}
          >
            <select className={styles.input} {...register("status")}>
              <option value="PENDENTE">Pendente</option>
              <option value="PAGO">Pago</option>
            </select>
          </FormField>

          {enableParcelamento ? (
            <>
              <FormField
                id="documento-parcelado"
                label="Parcelamento"
                colSpan="full"
              >
                <label
                  className={styles.checkboxRow}
                  htmlFor="documento-parcelado"
                >
                  <input
                    id="documento-parcelado"
                    type="checkbox"
                    className={styles.checkboxInput}
                    {...register("parcelado")}
                  />
                  <span className={styles.checkboxText}>
                    Gerar despesa parcelada mensalmente
                  </span>
                </label>
              </FormField>

              {parcelado ? (
                <FormField
                  id="documento-quantidade-parcelas"
                  label="Quantidade de parcelas"
                  required
                  error={errors.quantidadeParcelas?.message}
                >
                  <input
                    id="documento-quantidade-parcelas"
                    className={`${styles.input} ${errors.quantidadeParcelas ? styles.inputError : ""}`}
                    type="number"
                    min={2}
                    max={60}
                    step={1}
                    {...register("quantidadeParcelas")}
                  />
                </FormField>
              ) : null}
            </>
          ) : (
            <>
              <input type="hidden" {...register("parcelado")} value="false" />
              <input
                type="hidden"
                {...register("quantidadeParcelas")}
                value={1}
              />
            </>
          )}
        </div>

        {enableParcelamento && parcelado ? (
          <div className={styles.parcelamentoPreview}>
            {valoresParcelas.length > 0 ? (
              <strong>
                {Number(quantidadeParcelas || 0)} parcela(s){" "}
                {parcelasComMesmoValor
                  ? `de ${formatarMoeda(valoresParcelas[0])}`
                  : `rateadas entre ${formatarMoeda(
                      valoresParcelas[0],
                    )} e ${formatarMoeda(
                      valoresParcelas[valoresParcelas.length - 1],
                    )}`}
              </strong>
            ) : (
              <strong>Informe valor total e quantidade de parcelas.</strong>
            )}
            <span>
              {
                "A soma das parcelas será igual ao valor total. Vencimentos mensais a partir de "
              }
              {dataVencimento
                ? formatarDataSomenteDia(dataVencimento)
                : "uma data de vencimento válida"}
              .
            </span>
          </div>
        ) : null}
      </section>

      <section
        className={styles.section}
        aria-labelledby="documento-classificacao-title"
      >
        <h2 className={styles.sectionTitle} id="documento-classificacao-title">
          {"Classificação"}
        </h2>

        <div className={styles.grid}>
          <FormField
            id="documento-categoria"
            label="Categoria"
            error={errors.categoria?.message}
          >
            <input
              className={`${styles.input} ${errors.categoria ? styles.inputError : ""}`}
              list="documento-categorias"
              placeholder="Ex.: Estrutura, Administrativo, Tecnologia"
              {...register("categoria")}
            />
          </FormField>

          <datalist id="documento-categorias">
            {categorias.map((categoria) => (
              <option key={categoria} value={categoria} />
            ))}
          </datalist>
        </div>
      </section>

      <section
        className={styles.section}
        aria-labelledby="documento-observacoes-title"
      >
        <h2 className={styles.sectionTitle} id="documento-observacoes-title">
          {"Observações"}
        </h2>

        <FormField
          id="documento-observacao"
          label={"Informações adicionais"}
          error={errors.observacao?.message}
        >
          <textarea
            className={`${styles.textarea} ${errors.observacao ? styles.inputError : ""}`}
            rows={4}
            placeholder={
              "Ex.: detalhes do pagamento, número da nota ou observações internas."
            }
            {...register("observacao")}
          />
        </FormField>
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
