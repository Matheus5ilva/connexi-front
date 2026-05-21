import { z } from "zod";

function vazioParaIndefinido(valor: unknown): unknown {
  if (valor === "" || valor === null || valor === undefined) {
    return undefined;
  }

  if (typeof valor === "string") {
    const texto = valor.trim();
    return texto.length > 0 ? texto : undefined;
  }

  return valor;
}

function numeroOpcional() {
  return z.preprocess((valor) => {
    if (valor === "" || valor === null || valor === undefined) {
      return undefined;
    }

    const numero = Number(valor);
    return Number.isNaN(numero) ? valor : numero;
  }, z.number().int().optional());
}

const textoOpcional = (maximo: number, mensagem: string) =>
  z.preprocess(
    vazioParaIndefinido,
    z.string().trim().max(maximo, mensagem).optional(),
  );

export const salvarConsultaSchema = z.object({
  tempoConsultaMinutos: numeroOpcional()
    .refine(
      (valor) => valor === undefined || valor >= 1,
      "O tempo da consulta deve ser de pelo menos 1 minuto.",
    )
    .refine(
      (valor) => valor === undefined || valor <= 480,
      "O tempo da consulta deve ter no máximo 480 minutos.",
    ),
  queixaPrincipal: textoOpcional(
    500,
    "A queixa principal deve ter no máximo 500 caracteres.",
  ),
  registroConsulta: textoOpcional(
    20000,
    "O registro da consulta deve ter no máximo 20000 caracteres.",
  ),
  conduta: textoOpcional(
    5000,
    "A conduta deve ter no máximo 5000 caracteres.",
  ),
  observacoes: textoOpcional(
    5000,
    "As observações devem ter no máximo 5000 caracteres.",
  ),
  receitaDigitada: textoOpcional(
    5000,
    "A receita digitada deve ter no máximo 5000 caracteres.",
  ),
});

export const finalizarConsultaSchema = salvarConsultaSchema
  .extend({
    recebimento: z
      .object({
        formaPagamentoId: numeroOpcional().refine(
          (valor) => valor === undefined || valor > 0,
          "Selecione uma forma de pagamento válida.",
        ),
        numeroParcelas: numeroOpcional()
          .refine(
            (valor) => valor === undefined || valor >= 1,
            "O número de parcelas deve ser de pelo menos 1.",
          )
          .refine(
            (valor) => valor === undefined || valor <= 36,
            "O número de parcelas deve ter no máximo 36 parcelas.",
          ),
        intervaloParcelasDias: numeroOpcional()
          .refine(
            (valor) => valor === undefined || valor >= 1,
            "O intervalo entre parcelas deve ser de pelo menos 1 dia.",
          )
          .refine(
            (valor) => valor === undefined || valor <= 365,
            "O intervalo entre parcelas deve ter no máximo 365 dias.",
          ),
        descontoValor: z.preprocess(
          (valor) => {
            if (valor === "" || valor === null || valor === undefined) {
              return undefined;
            }

            const numero = Number(valor);
            return Number.isNaN(numero) ? valor : numero;
          },
          z
            .number()
            .min(0, "O desconto deve ser maior ou igual a zero.")
            .optional(),
        ),
        observacao: textoOpcional(
          500,
          "A observação do recebimento deve ter no máximo 500 caracteres.",
        ),
      })
      .optional(),
  })
  .superRefine((valor, contexto) => {
    const registroConsulta = valor.registroConsulta?.trim();

    if (!registroConsulta || registroConsulta.length < 12) {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["registroConsulta"],
        message:
          "Para finalizar a consulta, o registro da consulta deve ter pelo menos 12 caracteres.",
      });
    }
  });

export type ConsultaFormData = z.infer<typeof salvarConsultaSchema>;
export type FinalizarConsultaFormData = z.infer<
  typeof finalizarConsultaSchema
>;
