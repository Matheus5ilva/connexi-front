import type { FieldErrors } from "react-hook-form";
import type { ZodError } from "zod";
import {
  normalizarErroFormulario,
  type ResultadoErroFormulario,
} from "./erro-formulario";
import { normalizarTextoErroServidor } from "./api-error";

type MapaRotulosCampos = Record<string, string>;

type TradutorMensagemCampo = (campo: string, mensagem: string) => string;

type ResolverRotuloCampo = (campo: string) => string | null | undefined;

type EntradaErroFormulario = {
  campo: string;
  mensagem: string;
};

const CHAVES_AUXILIARES_ERRO = new Set(["message", "type", "types", "ref"]);

function normalizarCaminhoCampo(campo: string): string {
  return campo.replace(/\.\d+(?=\.|$)/g, "");
}

function capitalizarPrimeiraLetra(valor: string): string {
  if (!valor) {
    return valor;
  }

  return valor.charAt(0).toUpperCase() + valor.slice(1);
}

function humanizarCampo(campo: string): string {
  const ultimoSegmento = campo.split(".").pop() ?? campo;

  return capitalizarPrimeiraLetra(
    ultimoSegmento
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ")
      .trim(),
  );
}

function resolverRotuloCampo(
  campo: string,
  mapaRotulosCampos: MapaRotulosCampos,
  resolverRotuloPersonalizado?: ResolverRotuloCampo,
): string {
  const rotuloPersonalizado = resolverRotuloPersonalizado?.(campo);
  if (rotuloPersonalizado) {
    return rotuloPersonalizado;
  }

  const campoNormalizado = normalizarCaminhoCampo(campo);
  const rotuloCampoNormalizado =
    resolverRotuloPersonalizado?.(campoNormalizado) ??
    mapaRotulosCampos[campo] ??
    mapaRotulosCampos[campoNormalizado];

  if (rotuloCampoNormalizado) {
    return rotuloCampoNormalizado;
  }

  return humanizarCampo(campoNormalizado);
}

function extrairLimiteNumerico(
  mensagem: string,
  padrao: RegExp,
): number | null {
  const correspondencia = mensagem.match(padrao);
  const valor = correspondencia?.[1];

  if (!valor) {
    return null;
  }

  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

export function traduzirMensagemCampoPadrao(
  campo: string,
  mensagem: string,
): string {
  const mensagemNormalizada = normalizarTextoErroServidor(mensagem);

  if (
    mensagemNormalizada === "required" ||
    mensagemNormalizada.includes("should not be empty") ||
    mensagemNormalizada.includes("campo obrigatorio") ||
    mensagemNormalizada.includes("obrigatorio")
  ) {
    return "Campo obrigatório.";
  }

  if (
    mensagemNormalizada.includes("invalid email") ||
    mensagemNormalizada.includes("must be an email") ||
    mensagemNormalizada.includes("email invalido")
  ) {
    return "Informe um e-mail válido.";
  }

  if (mensagemNormalizada.includes("invalid date")) {
    return "Informe uma data válida.";
  }

  if (
    mensagemNormalizada.includes("must be a number") ||
    mensagemNormalizada.includes("must be an integer") ||
    mensagemNormalizada.includes("received nan")
  ) {
    return campo.toLowerCase().includes("data")
      ? "Informe uma data válida."
      : "Informe um valor válido.";
  }

  if (mensagemNormalizada.includes("must be one of the following values")) {
    return "Selecione uma opção válida.";
  }

  if (mensagemNormalizada.includes("must be shorter than or equal to")) {
    const limite = extrairLimiteNumerico(
      mensagem,
      /shorter than or equal to\s+(\d+)/i,
    );

    return limite
      ? `Deve ter até ${limite} caracteres.`
      : "Valor acima do limite permitido.";
  }

  if (mensagemNormalizada.includes("must be longer than or equal to")) {
    const limite = extrairLimiteNumerico(
      mensagem,
      /longer than or equal to\s+(\d+)/i,
    );

    return limite
      ? `Deve ter pelo menos ${limite} caracteres.`
      : "Valor abaixo do limite permitido.";
  }

  if (mensagem.trim().length > 0) {
    return mensagem.trim();
  }

  return "Revise o valor informado.";
}

function coletarEntradasErroReactHookForm(
  valor: unknown,
  caminho: string[] = [],
): EntradaErroFormulario[] {
  if (!valor || typeof valor !== "object") {
    return [];
  }

  const objetoErro = valor as Record<string, unknown>;

  if (
    typeof objetoErro.message === "string" &&
    objetoErro.message.trim().length > 0 &&
    caminho.length > 0
  ) {
    return [
      {
        campo: caminho.join("."),
        mensagem: objetoErro.message.trim(),
      },
    ];
  }

  return Object.entries(objetoErro).flatMap(([chave, detalhe]) => {
    if (CHAVES_AUXILIARES_ERRO.has(chave)) {
      return [];
    }

    return coletarEntradasErroReactHookForm(detalhe, [...caminho, chave]);
  });
}

function montarResultadoErrosFormulario(params: {
  entradas: EntradaErroFormulario[];
  mapaRotulosCampos?: MapaRotulosCampos;
  resolverRotuloCampo?: ResolverRotuloCampo;
  traduzirMensagemCampo?: TradutorMensagemCampo;
  mensagemCamposInvalidos?: string;
  mensagemPadrao?: string;
}): ResultadoErroFormulario<string> {
  const mapaRotulosCampos = params.mapaRotulosCampos ?? {};
  const traduzirMensagemCampo =
    params.traduzirMensagemCampo ?? traduzirMensagemCampoPadrao;
  const mensagensPorCampo = new Map<string, string>();
  const mensagensGlobais: string[] = [];

  params.entradas.forEach(({ campo, mensagem }) => {
    if (!campo) {
      if (mensagem.trim().length > 0) {
        mensagensGlobais.push(mensagem.trim());
      }
      return;
    }

    if (mensagensPorCampo.has(campo)) {
      return;
    }

    mensagensPorCampo.set(campo, traduzirMensagemCampo(campo, mensagem));
  });

  const errosCampo = Object.fromEntries(mensagensPorCampo) as Record<
    string,
    string
  >;
  const erros = Array.from(mensagensPorCampo.entries()).map(
    ([campo, mensagem]) => ({
      campo: resolverRotuloCampo(
        campo,
        mapaRotulosCampos,
        params.resolverRotuloCampo,
      ),
      mensagem,
    }),
  );

  const mensagemGlobal =
    erros.length > 0
      ? (params.mensagemCamposInvalidos ?? "Verifique os campos abaixo:")
      : (mensagensGlobais[0] ??
        params.mensagemPadrao ??
        "Revise os campos destacados antes de continuar.");

  return {
    mensagemGlobal,
    errosCampo,
    erros,
  };
}

export function normalizarErrosValidacaoReactHookForm(
  errosFormulario: FieldErrors<Record<string, unknown>>,
  opcoes?: {
    mapaRotulosCampos?: MapaRotulosCampos;
    resolverRotuloCampo?: ResolverRotuloCampo;
    traduzirMensagemCampo?: TradutorMensagemCampo;
    mensagemCamposInvalidos?: string;
    mensagemPadrao?: string;
  },
): ResultadoErroFormulario<string> {
  return montarResultadoErrosFormulario({
    entradas: coletarEntradasErroReactHookForm(errosFormulario),
    ...opcoes,
  });
}

export function normalizarErroZodFormulario(
  erro: ZodError,
  opcoes?: {
    mapaRotulosCampos?: MapaRotulosCampos;
    resolverRotuloCampo?: ResolverRotuloCampo;
    traduzirMensagemCampo?: TradutorMensagemCampo;
    mensagemCamposInvalidos?: string;
    mensagemPadrao?: string;
  },
): ResultadoErroFormulario<string> {
  return montarResultadoErrosFormulario({
    entradas: erro.issues.map((issue) => ({
      campo: issue.path.map(String).join("."),
      mensagem: issue.message,
    })),
    ...opcoes,
  });
}

export function criarMapaCamposServidor(
  mapaRotulosCampos: MapaRotulosCampos,
): Record<string, string> {
  return Object.keys(mapaRotulosCampos).reduce<Record<string, string>>(
    (acumulador, campo) => {
      acumulador[campo] = campo;
      return acumulador;
    },
    {},
  );
}

export function normalizarErroFormularioPadrao(params: {
  erro: unknown;
  mapaRotulosCampos?: MapaRotulosCampos;
  mapaCamposServidor?: Record<string, string>;
  traduzirMensagemCampo?: TradutorMensagemCampo;
  mensagemCamposInvalidos?: string;
  mensagemPadrao: string;
}): ResultadoErroFormulario<string> {
  return normalizarErroFormulario<string>({
    erro: params.erro,
    mapaCamposServidor: params.mapaCamposServidor ?? {},
    mapaRotulosCampos: params.mapaRotulosCampos ?? {},
    traduzirMensagemCampo:
      params.traduzirMensagemCampo ?? traduzirMensagemCampoPadrao,
    mensagemCamposInvalidos:
      params.mensagemCamposInvalidos ?? "Verifique os campos abaixo:",
    mensagemPadrao: params.mensagemPadrao,
  });
}
