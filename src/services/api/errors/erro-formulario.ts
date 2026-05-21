import {
  ehMensagemTecnicaDeValidacao,
  isApiError,
  listarMensagensDetalhadasErroApi,
  normalizarTextoErroServidor,
  toErrorMessage,
} from "./api-error";

type MapaCamposServidor<TCampo extends string> = Partial<Record<string, TCampo>>;

type TradutorMensagemCampo<TCampo extends string> = (
  campo: TCampo,
  mensagem: string,
) => string;

type MapaRotulosCampos<TCampo extends string> = Partial<Record<TCampo, string>>;

export type ErroFormularioAmigavel = {
  campo: string;
  mensagem: string;
};

export type ResultadoErroFormulario<TCampo extends string> = {
  mensagemGlobal: string;
  errosCampo: Partial<Record<TCampo, string>>;
  erros: ErroFormularioAmigavel[];
};

function extrairCampoTecnico(mensagem: string): string | null {
  const correspondencia = mensagem.trim().match(/^([a-zA-Z0-9_.[\]]+)\s+/);
  return correspondencia?.[1] ?? null;
}

function definirErroCampo<TCampo extends string>(
  errosCampo: Partial<Record<TCampo, string>>,
  campo: TCampo,
  mensagem: string,
) {
  if (!errosCampo[campo]) {
    errosCampo[campo] = mensagem;
  }
}

export function normalizarErroFormulario<TCampo extends string>(params: {
  erro: unknown;
  mapaCamposServidor: MapaCamposServidor<TCampo>;
  mapaRotulosCampos: MapaRotulosCampos<TCampo>;
  traduzirMensagemCampo: TradutorMensagemCampo<TCampo>;
  mensagemCamposInvalidos: string;
  mensagemPadrao: string;
}): ResultadoErroFormulario<TCampo> {
  const errosCampo: Partial<Record<TCampo, string>> = {};

  if (isApiError(params.erro)) {
    Object.entries(params.erro.fieldErrors ?? {}).forEach(
      ([campoServidor, mensagens]) => {
        const campo = params.mapaCamposServidor[campoServidor];
        const primeiraMensagem = mensagens?.[0];

        if (!campo || !primeiraMensagem) {
          return;
        }

        definirErroCampo(
          errosCampo,
          campo,
          params.traduzirMensagemCampo(campo, primeiraMensagem),
        );
      },
    );

    listarMensagensDetalhadasErroApi(params.erro).forEach((mensagem) => {
      const campoServidor = extrairCampoTecnico(mensagem);
      const campo = campoServidor
        ? params.mapaCamposServidor[campoServidor]
        : undefined;

      if (!campo) {
        return;
      }

      definirErroCampo(
        errosCampo,
        campo,
        params.traduzirMensagemCampo(campo, mensagem),
      );
    });
  }

  if (Object.keys(errosCampo).length > 0) {
    return {
      errosCampo,
      mensagemGlobal: params.mensagemCamposInvalidos,
      erros: Object.entries(errosCampo).map(([campo, mensagem]) => ({
        campo: params.mapaRotulosCampos[campo as TCampo] ?? campo,
        mensagem:
          typeof mensagem === "string" && mensagem.trim().length > 0
            ? mensagem
            : "Revise este campo.",
      })),
    };
  }

  if (
    isApiError(params.erro) &&
    listarMensagensDetalhadasErroApi(params.erro).some(ehMensagemTecnicaDeValidacao)
  ) {
    return {
      errosCampo,
      mensagemGlobal: params.mensagemCamposInvalidos,
      erros: [],
    };
  }

  const mensagemSegura = toErrorMessage(params.erro, params.mensagemPadrao);
  const mensagemNormalizada = normalizarTextoErroServidor(mensagemSegura);

  return {
    errosCampo,
    mensagemGlobal:
      mensagemNormalizada.length > 0
        ? mensagemSegura
        : params.mensagemPadrao,
    erros: [],
  };
}
