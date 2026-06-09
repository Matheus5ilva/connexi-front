import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch, type FieldErrors } from "react-hook-form";
import { criarResolvedorZod } from "schemas/resolvedor-zod";
import { AvisoErroFormulario } from "../../../components/ui/aviso-erro-formulario";
import { FormField } from "../../../components/ui/form-field";
import type { SegmentoLabels } from "../../../config/segmento-labels";
import {
  formularioServicoSchema,
  type ServicoFormularioData,
} from "../../../schemas/servico.schema";
import {
  convenioService,
  type ConvenioListaItem,
  type ServicoConvenio,
} from "../../../services/api";
import type { ErroFormularioAmigavel } from "../../../services/api/errors/erro-formulario";
import {
  criarMapaCamposServidor,
  normalizarErroFormularioPadrao,
  normalizarErrosValidacaoReactHookForm,
} from "../../../services/api/errors/erro-formulario-validacao";
import styles from "./formulario-servico.module.css";

type FormularioServicoProps = {
  valoresIniciais: ServicoFormularioData;
  textoBotaoSubmit: string;
  onSubmit: (values: ServicoFormularioData) => Promise<void> | void;
  onCancel: () => void;
  labels: SegmentoLabels;
  conveniosVinculados?: ServicoConvenio[];
};

function criarMapaRotulosCampos(labels: SegmentoLabels) {
  return {
    nome: `Nome do ${labels.servico.toLowerCase()}`,
    valorParticular: `Valor particular do ${labels.servico.toLowerCase()}`,
    descricao: `Descrição do ${labels.servico.toLowerCase()}`,
    convenios: labels.parcerias,
  } satisfies Record<string, string>;
}

const conveniosVinculadosVazios: ServicoConvenio[] = [];

function montarConveniosDisponiveis(
  convenios: ConvenioListaItem[],
  vinculados: ServicoConvenio[],
  parceriaLabel: string,
): ConvenioListaItem[] {
  const porId = new Map<number, ConvenioListaItem>();

  convenios
    .filter((convenio) => convenio.ativo)
    .forEach((convenio) => porId.set(convenio.id, convenio));

  vinculados.forEach((vinculo) => {
    if (porId.has(vinculo.convenioId)) {
      return;
    }

    porId.set(vinculo.convenioId, {
      id: vinculo.convenioId,
      nome: vinculo.convenioNome ?? `${parceriaLabel} ${vinculo.convenioId}`,
      ativo: true,
    });
  });

  return [...porId.values()].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR"),
  );
}

export function FormularioServico({
  valoresIniciais,
  textoBotaoSubmit,
  onSubmit,
  onCancel,
  labels,
  conveniosVinculados = conveniosVinculadosVazios,
}: FormularioServicoProps) {
  const mapaRotulosCampos = useMemo(
    () => criarMapaRotulosCampos(labels),
    [labels],
  );
  const servicoMinusculo = labels.servico.toLowerCase();
  const parceriaMinuscula = labels.parceria.toLowerCase();
  const parceriasMinusculo = labels.parcerias.toLowerCase();
  const [mensagemErroFormulario, setMensagemErroFormulario] = useState<
    string | null
  >(null);
  const [errosFormulario, setErrosFormulario] = useState<
    ErroFormularioAmigavel[]
  >([]);
  const [conveniosDisponiveis, setConveniosDisponiveis] = useState<
    ConvenioListaItem[]
  >([]);
  const [erroConvenios, setErroConvenios] = useState<string | null>(null);
  const valoresPadrao = useMemo(() => valoresIniciais, [valoresIniciais]);

  const {
    clearErrors,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ServicoFormularioData>({
    resolver: criarResolvedorZod(formularioServicoSchema),
    defaultValues: valoresPadrao,
  });

  useEffect(() => {
    reset(valoresPadrao);
  }, [valoresPadrao, reset]);

  useEffect(() => {
    let ativo = true;

    async function carregarConvenios() {
      try {
        const resposta = await convenioService.listar();
        if (!ativo) {
          return;
        }

        setConveniosDisponiveis(
          montarConveniosDisponiveis(
            resposta,
            conveniosVinculados,
            labels.parceria,
          ),
        );
        setErroConvenios(null);
      } catch (error) {
        if (!ativo) {
          return;
        }

        setConveniosDisponiveis([]);
        const resultadoErro = normalizarErroFormularioPadrao({
          erro: error,
          mensagemPadrao: `Não foi possível carregar ${parceriasMinusculo}.`,
        });
        setErroConvenios(resultadoErro.mensagemGlobal);
      }
    }

    void carregarConvenios();

    return () => {
      ativo = false;
    };
  }, [conveniosVinculados, labels.parceria, parceriasMinusculo]);

  const ativo = useWatch({ control, name: "ativo", defaultValue: true });
  const conveniosSelecionados = useWatch({
    control,
    name: "convenios",
    defaultValue: [],
  });

  const valoresConvenio = useMemo(
    () =>
      new Map(
        conveniosSelecionados.map((item) => [item.convenioId, item.valor]),
      ),
    [conveniosSelecionados],
  );

  const errosConvenio = useMemo(() => {
    const mapa = new Map<number, string>();

    conveniosSelecionados.forEach((item, indice) => {
      const mensagem = errors.convenios?.[indice]?.valor?.message;
      if (mensagem) {
        mapa.set(item.convenioId, mensagem);
      }
    });

    return mapa;
  }, [conveniosSelecionados, errors.convenios]);

  function obterNomeConvenio(convenioId: number): string {
    return (
      conveniosDisponiveis.find((convenio) => convenio.id === convenioId)
        ?.nome ?? `${labels.parceria} ${convenioId}`
    );
  }

  function alternarConvenio(convenioId: number, marcado: boolean) {
    if (marcado) {
      const proximo = [...conveniosSelecionados, { convenioId, valor: 0 }];
      proximo.sort((a, b) => a.convenioId - b.convenioId);
      setValue("convenios", proximo, {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    setValue(
      "convenios",
      conveniosSelecionados.filter((item) => item.convenioId !== convenioId),
      { shouldDirty: true, shouldValidate: true },
    );
  }

  function atualizarValorConvenio(convenioId: number, valor: string) {
    const convertido = Number(valor);
    const proximo = conveniosSelecionados.map((item) =>
      item.convenioId === convenioId
        ? { ...item, valor: Number.isFinite(convertido) ? convertido : 0 }
        : item,
    );

    setValue("convenios", proximo, { shouldDirty: true, shouldValidate: true });
  }

  async function handleSubmitForm(values: ServicoFormularioData) {
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
        mensagemPadrao: `Não foi possível salvar o ${servicoMinusculo}.`,
      });

      Object.entries(resultadoErro.errosCampo).forEach(([campo, mensagem]) => {
        if (!mensagem) {
          return;
        }

        setError(campo as keyof ServicoFormularioData, {
          type: "server",
          message: mensagem,
        });
      });

      setMensagemErroFormulario(resultadoErro.mensagemGlobal);
      setErrosFormulario(resultadoErro.erros);
    }
  }

  function handleSubmitInvalido(
    errosValidacao: FieldErrors<ServicoFormularioData>,
  ) {
    const resultadoErro = normalizarErrosValidacaoReactHookForm(
      errosValidacao as FieldErrors<Record<string, unknown>>,
      {
        mapaRotulosCampos,
        resolverRotuloCampo: (campo) => {
          const convenios = campo.match(/^convenios\.(\d+)\.valor$/);
          if (!convenios) {
            return null;
          }

          const indice = Number(convenios[1]);
          const convenio = conveniosSelecionados[indice];
          return convenio
            ? `Valor para ${parceriaMinuscula} ${obterNomeConvenio(convenio.convenioId)}`
            : `Valor para ${parceriaMinuscula} ${indice + 1}`;
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

      <section className={styles.section} aria-labelledby="servico-dados-title">
        <h2 className={styles.sectionTitle} id="servico-dados-title">
          Dados do {servicoMinusculo}
        </h2>

        <div className={styles.grid}>
          <FormField
            id="servico-nome"
            label={`Nome do ${servicoMinusculo}`}
            required
            error={errors.nome?.message}
            colSpan="full"
          >
            <input
              className={`${styles.input} ${errors.nome ? styles.inputError : ""}`}
              placeholder="Ex.: Avaliação inicial"
              {...register("nome")}
            />
          </FormField>

          <FormField
            id="servico-valor-particular"
            label={`Valor particular do ${servicoMinusculo} (R$)`}
            required
            error={errors.valorParticular?.message}
          >
            <input
              className={`${styles.input} ${errors.valorParticular ? styles.inputError : ""}`}
              type="number"
              step="0.01"
              inputMode="decimal"
              {...register("valorParticular")}
            />
          </FormField>

          <FormField label="Status">
            <div className={styles.toggleWrapper}>
              <input
                type="checkbox"
                id="servico-ativo"
                className={styles.toggleInput}
                {...register("ativo")}
              />
              <label
                htmlFor="servico-ativo"
                className={`${styles.toggleLabel} ${ativo ? styles.toggleOn : ""}`}
              >
                <span className={styles.toggleSlider} />
              </label>
              <span className={styles.toggleText}>
                {ativo ? "Ativo" : "Inativo"}
              </span>
            </div>
          </FormField>

          <FormField
            id="servico-descricao"
            label={`Descrição do ${servicoMinusculo}`}
            error={errors.descricao?.message}
            colSpan="full"
          >
            <textarea
              className={`${styles.textarea} ${errors.descricao ? styles.inputError : ""}`}
              rows={4}
              placeholder={`Descreva o ${servicoMinusculo} oferecido.`}
              {...register("descricao")}
            />
          </FormField>
        </div>
      </section>

      <section
        className={styles.section}
        aria-labelledby="servico-convenios-title"
      >
        <h2 className={styles.sectionTitle} id="servico-convenios-title">
          {labels.parcerias}
        </h2>

        {erroConvenios ? <AvisoErroFormulario mensagem={erroConvenios} /> : null}

        {conveniosDisponiveis.length === 0 ? (
          <p className={styles.emptyConvenio}>
            Nenhum item de {parceriasMinusculo} ativo disponível para vincular.
          </p>
        ) : (
          <div className={styles.convenioList}>
            {conveniosDisponiveis.map((convenio) => {
              const marcado = valoresConvenio.has(convenio.id);
              const valorAtual = valoresConvenio.get(convenio.id) ?? 0;
              const erroConvenio = errosConvenio.get(convenio.id);

              return (
                <div key={convenio.id} className={styles.convenioRow}>
                  <label className={styles.convenioSelector}>
                    <input
                      type="checkbox"
                      className={styles.convenioCheckbox}
                      checked={marcado}
                      onChange={(event) =>
                        alternarConvenio(convenio.id, event.target.checked)
                      }
                    />
                    <span>{convenio.nome}</span>
                  </label>

                  {marcado ? (
                    <div className={styles.convenioInputGroup}>
                      <span className={styles.convenioInputLabel}>
                        Valor para {parceriaMinuscula}
                      </span>
                      <input
                        className={`${styles.convenioValueInput} ${erroConvenio ? styles.inputError : ""}`}
                        type="number"
                        step="0.01"
                        value={valorAtual}
                        onChange={(event) =>
                          atualizarValorConvenio(
                            convenio.id,
                            event.target.value,
                          )
                        }
                      />
                      {erroConvenio ? (
                        <p className={styles.convenioError}>{erroConvenio}</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
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
          {isSubmitting ? "Salvando..." : textoBotaoSubmit}
        </button>
      </div>
    </form>
  );
}
