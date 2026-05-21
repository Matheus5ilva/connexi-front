import { z } from "zod";
import { httpClient } from "../http/http-client";
import {
  contextoConsultaSchema,
  entityIdSchema,
  finalizarConsultaRequestSchema,
  prontuarioPacienteDetalheRespostaSchema,
  prontuariosPacienteRespostaSchema,
  prontuarioAnexoSchema,
  salvarConsultaRequestSchema,
} from "../schemas/domain.schema";
import type { ApiEnvelope } from "../types/common";
import type {
  ContextoConsulta,
  FinalizarConsultaRequest,
  RespostaDetalheProntuarioPaciente,
  RespostaProntuariosPaciente,
  ProntuarioAnexo,
  SalvarConsultaRequest,
} from "../types/domain";
import { parseWithSchema } from "../utils/parse-with-schema";
import { unwrapEnvelope } from "../utils/unwrap-envelope";

const CONSULTA_BASE_PATH = "/consultas";
const PACIENTE_BASE_PATH = "/pacientes";

const anexoListSchema = z.array(prontuarioAnexoSchema);

const consultaServiceBase = {
  async obterContexto(
    agendamentoId: string | number,
  ): Promise<ContextoConsulta> {
    const safeId = parseWithSchema(entityIdSchema, String(agendamentoId), {
      context: "consulta.contexto.id",
      message: "Identificador de consulta inválido.",
      code: "INVALID_CONSULTA_ID",
    });

    const response = await httpClient.get<
      ApiEnvelope<ContextoConsulta> | ContextoConsulta
    >(`${CONSULTA_BASE_PATH}/${safeId}`);

    return parseWithSchema(contextoConsultaSchema, unwrapEnvelope(response), {
      context: "consulta.contexto.response",
      message: "Resposta inesperada ao carregar o contexto da consulta.",
      code: "INVALID_CONSULTA_WORKSPACE_RESPONSE",
    });
  },

  async salvar(
    agendamentoId: string | number,
    payload: SalvarConsultaRequest,
  ): Promise<ContextoConsulta> {
    const safeId = parseWithSchema(entityIdSchema, String(agendamentoId), {
      context: "consulta.save.id",
      message: "Identificador de consulta inválido.",
      code: "INVALID_CONSULTA_ID",
    });

    const normalizedPayload = parseWithSchema(salvarConsultaRequestSchema, payload, {
      context: "consulta.save.payload",
      message: "Dados inválidos para salvar a consulta.",
      code: "INVALID_CONSULTA_SAVE_PAYLOAD",
    });

    const response = await httpClient.put<
      ApiEnvelope<ContextoConsulta> | ContextoConsulta,
      SalvarConsultaRequest
    >(`${CONSULTA_BASE_PATH}/${safeId}`, normalizedPayload);

    return parseWithSchema(contextoConsultaSchema, unwrapEnvelope(response), {
      context: "consulta.save.response",
      message: "Resposta inesperada ao salvar a consulta.",
      code: "INVALID_CONSULTA_SAVE_RESPONSE",
    });
  },

  async finalizar(
    agendamentoId: string | number,
    payload: FinalizarConsultaRequest,
  ): Promise<ContextoConsulta> {
    const safeId = parseWithSchema(entityIdSchema, String(agendamentoId), {
      context: "consulta.finalize.id",
      message: "Identificador de consulta inválido.",
      code: "INVALID_CONSULTA_ID",
    });

    const normalizedPayload = parseWithSchema(
      finalizarConsultaRequestSchema,
      payload,
      {
        context: "consulta.finalize.payload",
        message: "Dados inválidos para finalizar a consulta.",
        code: "INVALID_CONSULTA_FINALIZE_PAYLOAD",
      },
    );

    const response = await httpClient.post<
      ApiEnvelope<ContextoConsulta> | ContextoConsulta,
      FinalizarConsultaRequest
    >(`${CONSULTA_BASE_PATH}/${safeId}/finalizar`, normalizedPayload);

    return parseWithSchema(contextoConsultaSchema, unwrapEnvelope(response), {
      context: "consulta.finalize.response",
      message: "Resposta inesperada ao finalizar a consulta.",
      code: "INVALID_CONSULTA_FINALIZE_RESPONSE",
    });
  },

  async adicionarAnexos(
    agendamentoId: string | number,
    files: File[],
  ): Promise<ProntuarioAnexo[]> {
    const safeId = parseWithSchema(entityIdSchema, String(agendamentoId), {
      context: "consulta.attachments.id",
      message: "Identificador de consulta inválido.",
      code: "INVALID_CONSULTA_ID",
    });

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await httpClient.post<
      ApiEnvelope<unknown> | unknown,
      FormData
    >(`${CONSULTA_BASE_PATH}/${safeId}/anexos`, formData);

    return parseWithSchema(anexoListSchema, unwrapEnvelope(response), {
      context: "consulta.attachments.response",
      message: "Resposta inesperada ao adicionar anexos.",
      code: "INVALID_CONSULTA_ATTACHMENTS_RESPONSE",
    });
  },

  async removerAnexo(
    agendamentoId: string | number,
    anexoId: number,
  ): Promise<void> {
    const safeConsultaId = parseWithSchema(entityIdSchema, String(agendamentoId), {
      context: "consulta.remove-attachment.consulta-id",
      message: "Identificador de consulta inválido.",
      code: "INVALID_CONSULTA_ID",
    });
    const safeAnexoId = parseWithSchema(prontuarioAnexoSchema.shape.id, anexoId, {
      context: "consulta.remove-attachment.anexo-id",
      message: "Identificador de anexo inválido.",
      code: "INVALID_ANEXO_ID",
    });

    await httpClient.delete<void>(
      `${CONSULTA_BASE_PATH}/${safeConsultaId}/anexos/${safeAnexoId}`,
      {
        responseType: "void",
      },
    );
  },

  async obterArquivoAnexo(
    agendamentoId: string | number,
    anexoId: number,
    options?: { download?: boolean },
  ): Promise<Blob> {
    const safeConsultaId = parseWithSchema(entityIdSchema, String(agendamentoId), {
      context: "consulta.get-attachment.consulta-id",
      message: "Identificador de consulta inválido.",
      code: "INVALID_CONSULTA_ID",
    });
    const safeAnexoId = parseWithSchema(prontuarioAnexoSchema.shape.id, anexoId, {
      context: "consulta.get-attachment.anexo-id",
      message: "Identificador de anexo inválido.",
      code: "INVALID_ANEXO_ID",
    });

    return httpClient.get<Blob>(
      `${CONSULTA_BASE_PATH}/${safeConsultaId}/anexos/${safeAnexoId}/arquivo`,
      {
        query: options?.download ? { download: "true" } : undefined,
        responseType: "blob",
      },
    );
  },

  async exportarPorAgendamento(agendamentoId: string | number): Promise<Blob> {
    const safeId = parseWithSchema(entityIdSchema, String(agendamentoId), {
      context: "consulta.export.id",
      message: "Identificador de consulta inválido.",
      code: "INVALID_CONSULTA_ID",
    });

    return httpClient.get<Blob>(`${CONSULTA_BASE_PATH}/${safeId}/exportar`, {
      responseType: "blob",
    });
  },

  async listarProntuariosPaciente(
    pacienteId: string | number,
  ): Promise<RespostaProntuariosPaciente> {
    const safePacienteId = parseWithSchema(entityIdSchema, String(pacienteId), {
      context: "consulta.listar-prontuarios.paciente-id",
      message: "Identificador de paciente inválido.",
      code: "INVALID_PACIENTE_ID",
    });

    const response = await httpClient.get<
      ApiEnvelope<RespostaProntuariosPaciente> | RespostaProntuariosPaciente
    >(`${PACIENTE_BASE_PATH}/${safePacienteId}/prontuarios`);

    return parseWithSchema(
      prontuariosPacienteRespostaSchema,
      unwrapEnvelope(response),
      {
        context: "consulta.listar-prontuarios.response",
        message: "Resposta inesperada ao carregar o histórico de prontuários.",
        code: "INVALID_PRONTUARIO_LIST_RESPONSE",
      },
    );
  },

  async detalharProntuarioPaciente(
    pacienteId: string | number,
    prontuarioId: string | number,
  ): Promise<RespostaDetalheProntuarioPaciente> {
    const safePacienteId = parseWithSchema(entityIdSchema, String(pacienteId), {
      context: "consulta.detalhar-prontuario.paciente-id",
      message: "Identificador de paciente inválido.",
      code: "INVALID_PACIENTE_ID",
    });
    const safeProntuarioId = parseWithSchema(entityIdSchema, String(prontuarioId), {
      context: "consulta.detalhar-prontuario.prontuario-id",
      message: "Identificador de prontuário inválido.",
      code: "INVALID_PRONTUARIO_ID",
    });

    const response = await httpClient.get<
      | ApiEnvelope<RespostaDetalheProntuarioPaciente>
      | RespostaDetalheProntuarioPaciente
    >(
      `${PACIENTE_BASE_PATH}/${safePacienteId}/prontuarios/${safeProntuarioId}`,
    );

    return parseWithSchema(
      prontuarioPacienteDetalheRespostaSchema,
      unwrapEnvelope(response),
      {
        context: "consulta.detalhar-prontuario.response",
        message: "Resposta inesperada ao carregar o prontuário.",
        code: "INVALID_PRONTUARIO_DETAIL_RESPONSE",
      },
    );
  },

  async exportarPorProntuario(
    pacienteId: string | number,
    prontuarioId: string | number,
  ): Promise<Blob> {
    const safePacienteId = parseWithSchema(entityIdSchema, String(pacienteId), {
      context: "consulta.export-prontuario.paciente-id",
      message: "Identificador de paciente inválido.",
      code: "INVALID_PACIENTE_ID",
    });
    const safeProntuarioId = parseWithSchema(entityIdSchema, String(prontuarioId), {
      context: "consulta.export-prontuario.prontuario-id",
      message: "Identificador de prontuário inválido.",
      code: "INVALID_PRONTUARIO_ID",
    });

    return httpClient.get<Blob>(
      `${PACIENTE_BASE_PATH}/${safePacienteId}/prontuarios/${safeProntuarioId}/exportar`,
      {
        responseType: "blob",
      },
    );
  },
};

export const consultaService = consultaServiceBase;
