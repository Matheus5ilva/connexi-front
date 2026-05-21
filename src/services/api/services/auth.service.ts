import {
  alterarSenhaRequestSchema,
  iniciarSessaoRequestSchema,
  redefinirSenhaRequestSchema,
  renovarTokenRequestSchema,
  solicitarRecuperacaoSenhaRequestSchema,
} from "../../../schemas/auth.schema";
import { mapRespostaMinhaContaParaMinhaConta } from "../mappers/minha-conta.mapper";
import { httpClient } from "../http/http-client";
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
  RenovarTokenRequest,
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
        message: "Dados de login inválidos.",
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
      message: "Resposta inesperada ao autenticar o usuário.",
      code: "INVALID_LOGIN_RESPONSE",
    });
  },

  async renovarToken(
    payload: RenovarTokenRequest,
  ): Promise<TokensAutenticacao> {
    const payloadNormalizado = parseWithSchema(
      renovarTokenRequestSchema,
      payload,
      {
        context: "auth.refresh.payload",
        message: "Refresh token inválido.",
        code: "INVALID_REFRESH_TOKEN",
      },
    );

    const response = await httpClient.post<
      ApiEnvelope<TokensAutenticacao> | TokensAutenticacao
    >(`${AUTH_BASE_PATH}/refresh-token`, payloadNormalizado, {
      auth: false,
    });

    return parseWithSchema(tokensAutenticacaoSchema, unwrapEnvelope(response), {
      context: "auth.refresh.response",
      message: "Resposta inesperada ao renovar a sessão.",
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
        message: "E-mail inválido para recuperação de senha.",
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
        message: "Dados inválidos para redefinir a senha.",
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
        message: "Não foi possível validar os dados do usuário autenticado.",
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
