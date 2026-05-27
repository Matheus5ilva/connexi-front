import {
  alterarSenhaRequestSchema,
  iniciarSessaoRequestSchema,
  redefinirSenhaRequestSchema,
  solicitarRecuperacaoSenhaRequestSchema,
} from "../../../schemas/auth.schema";
import { httpClient } from "../http/http-client";
import { mapRespostaMinhaContaParaMinhaConta } from "../mappers/minha-conta.mapper";
import {
  minhaContaAutenticadaSchema,
  respostaLoginSchema,
  tokensAutenticacaoSchema,
} from "../schemas/domain.schema";
import type { ApiEnvelope } from "../types/common";
import type {
  AlterarSenhaRequest,
  IniciarSessaoRequest,
  MinhaConta,
  RedefinirSenhaRequest,
  RespostaLogin,
  RespostaMinhaContaAutenticada,
  SolicitarRecuperacaoSenhaRequest,
  TokensAutenticacao,
} from "../types/domain";
import { parseWithSchema } from "../utils/parse-with-schema";
import { unwrapEnvelope } from "../utils/unwrap-envelope";

const AUTH_BASE_PATH = "/auth";

export const authService = {
  async iniciarSessao(payload: IniciarSessaoRequest): Promise<RespostaLogin> {
    const payloadNormalizado = parseWithSchema(
      iniciarSessaoRequestSchema,
      payload,
      {
        context: "auth.login.payload",
        message: "Dados de login invalidos.",
        code: "INVALID_LOGIN_PAYLOAD",
      },
    );

    const response = await httpClient.post<
      ApiEnvelope<RespostaLogin> | RespostaLogin
    >(`${AUTH_BASE_PATH}/login`, payloadNormalizado, {
      auth: false,
    });

    return parseWithSchema(respostaLoginSchema, unwrapEnvelope(response), {
      context: "auth.login.response",
      message: "Resposta inesperada ao autenticar o usuario.",
      code: "INVALID_LOGIN_RESPONSE",
    });
  },

  async renovarToken(): Promise<TokensAutenticacao> {
    const response = await httpClient.post<
      ApiEnvelope<TokensAutenticacao> | TokensAutenticacao
    >(`${AUTH_BASE_PATH}/refresh-token`, undefined, {
      auth: false,
    });

    return parseWithSchema(tokensAutenticacaoSchema, unwrapEnvelope(response), {
      context: "auth.refresh.response",
      message: "Resposta inesperada ao renovar a sessao.",
      code: "INVALID_REFRESH_RESPONSE",
    });
  },

  async solicitarRecuperacaoSenha(
    payload: SolicitarRecuperacaoSenhaRequest,
  ): Promise<void> {
    const payloadNormalizado = parseWithSchema(
      solicitarRecuperacaoSenhaRequestSchema,
      payload,
      {
        context: "auth.forgot-password.payload",
        message: "E-mail invalido para recuperacao de senha.",
        code: "INVALID_FORGOT_PASSWORD_PAYLOAD",
      },
    );

    await httpClient.post<void>(
      `${AUTH_BASE_PATH}/forgot-password`,
      payloadNormalizado,
      {
        auth: false,
        responseType: "void",
      },
    );
  },

  async redefinirSenha(payload: RedefinirSenhaRequest): Promise<void> {
    const payloadNormalizado = parseWithSchema(
      redefinirSenhaRequestSchema,
      payload,
      {
        context: "auth.reset-password.payload",
        message: "Dados invalidos para redefinir a senha.",
        code: "INVALID_RESET_PASSWORD_PAYLOAD",
      },
    );

    await httpClient.post<void>(
      `${AUTH_BASE_PATH}/reset-password`,
      payloadNormalizado,
      {
        auth: false,
        responseType: "void",
      },
    );
  },

  async buscarMinhaConta(): Promise<MinhaConta> {
    const response = await httpClient.get<
      ApiEnvelope<RespostaMinhaContaAutenticada> | RespostaMinhaContaAutenticada
    >(`${AUTH_BASE_PATH}/me`);

    const dadosAutenticados = parseWithSchema(
      minhaContaAutenticadaSchema,
      unwrapEnvelope(response),
      {
        context: "auth.me.response",
        message: "Nao foi possivel validar os dados do usuario autenticado.",
        code: "INVALID_AUTH_ME_RESPONSE",
      },
    );

    return mapRespostaMinhaContaParaMinhaConta(dadosAutenticados);
  },

  async alterarSenha(payload: AlterarSenhaRequest): Promise<void> {
    const payloadNormalizado = parseWithSchema(
      alterarSenhaRequestSchema,
      payload,
      {
        context: "auth.change-password.payload",
        message: "Dados inválidos para alterar a senha.",
        code: "INVALID_CHANGE_PASSWORD_PAYLOAD",
      },
    );

    await httpClient.post<void>(
      `${AUTH_BASE_PATH}/change-password`,
      payloadNormalizado,
      {
        responseType: "void",
      },
    );
  },

  async encerrarSessao(): Promise<void> {
    await httpClient.post<void>(`${AUTH_BASE_PATH}/logout`, undefined, {
      responseType: "void",
    });
  },
};
