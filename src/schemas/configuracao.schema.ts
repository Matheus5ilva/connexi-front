import { z } from "zod";

function paraNumero(value: unknown): unknown {
  if (value === "" || value === undefined || value === null) {
    return value;
  }

  const numero = Number(value);
  return Number.isNaN(numero) ? value : numero;
}

function paraMinutos(horario: string): number {
  const [horas, minutos] = horario.split(":").map(Number);

  if (!Number.isFinite(horas) || !Number.isFinite(minutos)) {
    return -1;
  }

  return horas * 60 + minutos;
}

const horarioRegex = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const mensagemHorario = "Horário deve estar no formato HH:mm.";

export const diaSemanaEnum = z.enum([
  "SEGUNDA",
  "TERCA",
  "QUARTA",
  "QUINTA",
  "SEXTA",
  "SABADO",
  "DOMINGO",
]);

export const pausaConfiguracaoSchema = z.object({
  inicio: z
    .string()
    .trim()
    .regex(horarioRegex, "Início da pausa deve estar no formato HH:mm."),
  fim: z
    .string()
    .trim()
    .regex(horarioRegex, "Fim da pausa deve estar no formato HH:mm."),
});

export const configuracaoSchema = z
  .object({
    horaInicio: z.string().trim().regex(horarioRegex, mensagemHorario),
    horaFim: z.string().trim().regex(horarioRegex, mensagemHorario),
    intervaloMinutos: z.preprocess(
      paraNumero,
      z
        .number({ message: "Informe um intervalo válido." })
        .int("O intervalo deve ser um número inteiro.")
        .min(1, "O intervalo deve ser de no mínimo 1 minuto.")
        .max(240, "O intervalo máximo é de 4 horas (240 minutos)."),
    ),
    diasAtendimento: z
      .array(diaSemanaEnum)
      .min(1, "Selecione ao menos um dia de atendimento."),
    pausas: z.array(pausaConfiguracaoSchema).default([]),
  })
  .superRefine((value, context) => {
    const inicioJornada = paraMinutos(value.horaInicio);
    const fimJornada = paraMinutos(value.horaFim);

    if (inicioJornada >= fimJornada) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["horaFim"],
        message: "A hora final deve ser maior que a hora inicial.",
      });
    }

    if (value.intervaloMinutos > fimJornada - inicioJornada) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["intervaloMinutos"],
        message: "O intervalo não pode ser maior que a duração da jornada.",
      });
    }

    if (new Set(value.diasAtendimento).size !== value.diasAtendimento.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["diasAtendimento"],
        message: "Os dias de atendimento não podem se repetir.",
      });
    }

    const pausasOrdenadas = value.pausas
      .map((pausa, indice) => ({
        ...pausa,
        indiceOriginal: indice,
        inicioMinutos: paraMinutos(pausa.inicio),
        fimMinutos: paraMinutos(pausa.fim),
      }))
      .sort((a, b) => a.inicioMinutos - b.inicioMinutos);

    pausasOrdenadas.forEach((pausa) => {
      if (pausa.inicioMinutos >= pausa.fimMinutos) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pausas", pausa.indiceOriginal, "fim"],
          message: "A pausa deve ter início menor que o fim.",
        });
      }

      if (
        pausa.inicioMinutos < inicioJornada ||
        pausa.fimMinutos > fimJornada
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pausas", pausa.indiceOriginal, "inicio"],
          message: `A pausa deve estar dentro da jornada (${value.horaInicio}-${value.horaFim}).`,
        });
      }
    });

    for (let indice = 1; indice < pausasOrdenadas.length; indice += 1) {
      const pausaAnterior = pausasOrdenadas[indice - 1];
      const pausaAtual = pausasOrdenadas[indice];

      if (pausaAtual.inicioMinutos < pausaAnterior.fimMinutos) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pausas", pausaAtual.indiceOriginal, "inicio"],
          message: `Esta pausa se sobrepõe à pausa de ${pausaAnterior.inicio}-${pausaAnterior.fim}.`,
        });
      }
    }
  });

export type DiaSemana = z.infer<typeof diaSemanaEnum>;
export type PausaConfiguracaoFormularioData = z.infer<
  typeof pausaConfiguracaoSchema
>;
export type ConfiguracaoFormularioData = z.infer<typeof configuracaoSchema>;
