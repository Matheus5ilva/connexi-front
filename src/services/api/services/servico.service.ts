import { z } from "zod";
import { httpClient } from "../http/http-client";
import {
  atualizarServicoRequestSchema,
  criarServicoRequestSchema,
  numericIdSchema,
  servicoConvenioSchema,
  servicoListItemSchema,
  servicoSchema,
} from "../schemas/domain.schema";
import type { ApiEnvelope } from "../types/common";
import type {
  AtualizarServicoRequest,
  CriarServicoRequest,
  Servico,
  ServicoListaItem,
} from "../types/domain";
import { parseWithSchema } from "../utils/parse-with-schema";
import { unwrapEnvelope } from "../utils/unwrap-envelope";

const SERVICO_BASE_PATH = "/servicos";

const servicoListaCatalogoSchema = servicoListItemSchema.extend({
  servicosConvenios: z.array(servicoConvenioSchema).nullish(),
});

const listaServicosCatalogoSchema = z.array(servicoListaCatalogoSchema);

type ServicoListaCatalogo = z.infer<typeof servicoListaCatalogoSchema>;

function possuiConveniosCarregados(
  servico: ServicoListaCatalogo,
): servico is ServicoListaCatalogo & Pick<ServicoListaItem, "servicosConvenios"> {
  return Array.isArray(servico.servicosConvenios);
}

function normalizarServicoListagem(
  servico: ServicoListaCatalogo,
): ServicoListaItem {
  return {
    ...servico,
    servicosConvenios: servico.servicosConvenios ?? [],
  };
}

async function buscarServicoPorId(id: number): Promise<Servico> {
  const safeId = parseWithSchema(numericIdSchema, id, {
    context: "servico.buscar-por-id.id",
    message: "Identificador de serviço inválido.",
    code: "INVALID_SERVICO_ID",
  });

  const response = await httpClient.get<ApiEnvelope<Servico> | Servico>(
    `${SERVICO_BASE_PATH}/${safeId}`,
  );

  return parseWithSchema(servicoSchema, unwrapEnvelope(response), {
    context: "servico.buscar-por-id.response",
    message: "Resposta inesperada ao buscar serviço.",
    code: "INVALID_SERVICO_RESPONSE",
  });
}

async function completarConveniosAusentes(
  servicos: ServicoListaCatalogo[],
): Promise<ServicoListaItem[]> {
  const servicosSemConveniosCarregados = servicos.filter(
    (servico) => !possuiConveniosCarregados(servico),
  );

  if (servicosSemConveniosCarregados.length === 0) {
    return servicos.map(normalizarServicoListagem);
  }

  const resultadosDetalhes = await Promise.allSettled(
    servicosSemConveniosCarregados.map((servico) =>
      buscarServicoPorId(servico.id),
    ),
  );
  const detalhesPorId = new Map<
    number,
    ServicoListaItem["servicosConvenios"]
  >();

  resultadosDetalhes.forEach((resultado) => {
    if (resultado.status !== "fulfilled") {
      return;
    }

    detalhesPorId.set(
      Number(resultado.value.id),
      resultado.value.servicosConvenios,
    );
  });

  return servicos.map((servico) => {
    if (possuiConveniosCarregados(servico)) {
      return normalizarServicoListagem(servico);
    }

    return {
      ...servico,
      servicosConvenios: detalhesPorId.get(Number(servico.id)) ?? [],
    };
  });
}

export const servicoService = {
  async listar(): Promise<ServicoListaItem[]> {
    const response = await httpClient.get<
      ApiEnvelope<ServicoListaItem[]> | ServicoListaItem[]
    >(SERVICO_BASE_PATH);

    const servicos = parseWithSchema(
      listaServicosCatalogoSchema,
      unwrapEnvelope(response),
      {
        context: "servico.listar.response",
        message: "Resposta inesperada ao listar serviços.",
        code: "INVALID_SERVICO_LIST_RESPONSE",
      },
    );

    return completarConveniosAusentes(servicos);
  },

  async buscarPorId(id: number): Promise<Servico> {
    return buscarServicoPorId(id);
  },

  async criar(payload: CriarServicoRequest): Promise<Servico> {
    const normalizedPayload = parseWithSchema(criarServicoRequestSchema, payload, {
      context: "servico.criar.payload",
      message: "Dados inválidos para criar serviço.",
      code: "INVALID_SERVICO_CREATE_PAYLOAD",
    });

    const response = await httpClient.post<
      ApiEnvelope<Servico> | Servico,
      CriarServicoRequest
    >(SERVICO_BASE_PATH, normalizedPayload);

    return parseWithSchema(servicoSchema, unwrapEnvelope(response), {
      context: "servico.criar.response",
      message: "Resposta inesperada ao criar serviço.",
      code: "INVALID_SERVICO_CREATE_RESPONSE",
    });
  },

  async atualizar(id: number, payload: AtualizarServicoRequest): Promise<Servico> {
    const safeId = parseWithSchema(numericIdSchema, id, {
      context: "servico.atualizar.id",
      message: "Identificador de serviço inválido.",
      code: "INVALID_SERVICO_ID",
    });

    const normalizedPayload = parseWithSchema(
      atualizarServicoRequestSchema,
      payload,
      {
        context: "servico.atualizar.payload",
        message: "Dados inválidos para atualizar serviço.",
        code: "INVALID_SERVICO_UPDATE_PAYLOAD",
      },
    );

    const response = await httpClient.put<
      ApiEnvelope<Servico> | Servico,
      AtualizarServicoRequest
    >(`${SERVICO_BASE_PATH}/${safeId}`, normalizedPayload);

    return parseWithSchema(servicoSchema, unwrapEnvelope(response), {
      context: "servico.atualizar.response",
      message: "Resposta inesperada ao atualizar serviço.",
      code: "INVALID_SERVICO_UPDATE_RESPONSE",
    });
  },

  async remover(id: number): Promise<void> {
    const safeId = parseWithSchema(numericIdSchema, id, {
      context: "servico.remover.id",
      message: "Identificador de serviço inválido.",
      code: "INVALID_SERVICO_ID",
    });

    await httpClient.delete<void>(`${SERVICO_BASE_PATH}/${safeId}`, {
      responseType: "void",
    });
  },
};
