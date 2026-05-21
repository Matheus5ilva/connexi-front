import type { AgendamentoFormularioData } from "../../../schemas/agendamento.schema";
import type {
  Configuracao,
  DiaSemana,
} from "../../../services/api";
import type { ErroFormularioAmigavel } from "../../../services/api/errors/erro-formulario";

type DadosHorarioAgenda = Pick<
  AgendamentoFormularioData,
  "data" | "horario" | "duracaoMinutos"
>;

type ResultadoValidacaoFuncionamento = {
  valido: boolean;
  errosFormulario: ErroFormularioAmigavel[];
  errosCampos: Partial<Record<keyof DadosHorarioAgenda, string>>;
  mensagemGlobal: string;
};

const DIAS_SEMANA_POR_INDICE: readonly DiaSemana[] = [
  "DOMINGO",
  "SEGUNDA",
  "TERCA",
  "QUARTA",
  "QUINTA",
  "SEXTA",
  "SABADO",
];

function obterDiaSemanaDataSomenteDia(data: string): DiaSemana | null {
  const partes = data.split("-").map(Number);
  const [ano, mes, dia] = partes;

  if (
    partes.length !== 3 ||
    !Number.isInteger(ano) ||
    !Number.isInteger(mes) ||
    !Number.isInteger(dia)
  ) {
    return null;
  }

  const dataUtc = new Date(Date.UTC(ano, mes - 1, dia));

  if (
    dataUtc.getUTCFullYear() !== ano ||
    dataUtc.getUTCMonth() !== mes - 1 ||
    dataUtc.getUTCDate() !== dia
  ) {
    return null;
  }

  return DIAS_SEMANA_POR_INDICE[dataUtc.getUTCDay()];
}

function paraMinutos(horario: string): number {
  const [horas, minutos] = horario.slice(0, 5).split(":").map(Number);

  if (!Number.isFinite(horas) || !Number.isFinite(minutos)) {
    return Number.NaN;
  }

  return horas * 60 + minutos;
}

function criarResultadoValido(): ResultadoValidacaoFuncionamento {
  return {
    valido: true,
    errosFormulario: [],
    errosCampos: {},
    mensagemGlobal: "",
  };
}

function montarResultadoInvalido(
  erros: ErroFormularioAmigavel[],
  errosCampos: ResultadoValidacaoFuncionamento["errosCampos"],
): ResultadoValidacaoFuncionamento {
  return {
    valido: false,
    errosFormulario: erros,
    errosCampos,
    mensagemGlobal: "Revise os campos destacados antes de continuar.",
  };
}

export function validarAgendamentoNoFuncionamento(
  dados: DadosHorarioAgenda,
  configuracao: Configuracao | null,
): ResultadoValidacaoFuncionamento {
  if (!configuracao) {
    return montarResultadoInvalido(
      [
        {
          campo: "Data",
          mensagem: "configuracao de funcionamento nao encontrada.",
        },
      ],
      {
        data: "Configuracao de funcionamento nao encontrada.",
      },
    );
  }

  const erros: ErroFormularioAmigavel[] = [];
  const errosCampos: ResultadoValidacaoFuncionamento["errosCampos"] = {};
  const diaSemana = obterDiaSemanaDataSomenteDia(dados.data);

  if (!diaSemana || !configuracao.diasAtendimento.includes(diaSemana)) {
    const mensagem = "data fora dos dias de funcionamento.";
    erros.push({ campo: "Data", mensagem });
    errosCampos.data = "A data escolhida esta fora dos dias de funcionamento.";
  }

  const inicioAtendimento = paraMinutos(dados.horario);
  const fimAtendimento = inicioAtendimento + dados.duracaoMinutos;
  const inicioJornada = paraMinutos(configuracao.horaInicio);
  const fimJornada = paraMinutos(configuracao.horaFim);

  if (
    Number.isFinite(inicioAtendimento) &&
    Number.isFinite(fimAtendimento) &&
    (inicioAtendimento < inicioJornada || fimAtendimento > fimJornada)
  ) {
    const mensagem = `horario fora da jornada (${configuracao.horaInicio.slice(0, 5)}-${configuracao.horaFim.slice(0, 5)}).`;
    erros.push({ campo: "Horario", mensagem });
    errosCampos.horario = "O horario escolhido esta fora da jornada configurada.";
  }

  for (const pausa of configuracao.pausas) {
    const inicioPausa = paraMinutos(pausa.inicio);
    const fimPausa = paraMinutos(pausa.fim);

    if (
      Number.isFinite(inicioAtendimento) &&
      Number.isFinite(fimAtendimento) &&
      inicioAtendimento < fimPausa &&
      inicioPausa < fimAtendimento
    ) {
      const mensagem = `horario conflita com a pausa ${pausa.inicio.slice(0, 5)}-${pausa.fim.slice(0, 5)}.`;
      erros.push({ campo: "Horario", mensagem });
      errosCampos.horario = "O horario escolhido conflita com uma pausa configurada.";
      break;
    }
  }

  return erros.length > 0
    ? montarResultadoInvalido(erros, errosCampos)
    : criarResultadoValido();
}
