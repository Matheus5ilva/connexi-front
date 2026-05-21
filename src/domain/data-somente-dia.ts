const DATA_SOMENTE_DIA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function preencherComZero(valor: number): string {
  return String(valor).padStart(2, "0");
}

function formatarPartesData(ano: number, mes: number, dia: number): string {
  return `${ano}-${preencherComZero(mes)}-${preencherComZero(dia)}`;
}

function criarDataUtcSomenteDia(valor: string): Date | null {
  if (!DATA_SOMENTE_DIA_REGEX.test(valor)) {
    return null;
  }

  const [ano, mes, dia] = valor.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));

  if (
    data.getUTCFullYear() !== ano ||
    data.getUTCMonth() !== mes - 1 ||
    data.getUTCDate() !== dia
  ) {
    return null;
  }

  return data;
}

function formatarDataUtc(data: Date): string {
  return formatarPartesData(
    data.getUTCFullYear(),
    data.getUTCMonth() + 1,
    data.getUTCDate(),
  );
}

export function formatarDataSomenteDia(
  valor?: string | null,
  vazio = "-",
): string {
  if (!valor) {
    return vazio;
  }

  const data = criarDataUtcSomenteDia(valor.slice(0, 10));
  if (!data) {
    return valor;
  }

  const [ano, mes, dia] = formatarDataUtc(data).split("-");
  return `${dia}/${mes}/${ano}`;
}

export function obterDataSomenteDiaAtual(referencia = new Date()): string {
  return formatarPartesData(
    referencia.getFullYear(),
    referencia.getMonth() + 1,
    referencia.getDate(),
  );
}

export function adicionarDiasDataSomenteDia(
  valor: string,
  quantidadeDias: number,
): string {
  const data = criarDataUtcSomenteDia(valor);
  if (!data) {
    return valor;
  }

  data.setUTCDate(data.getUTCDate() + quantidadeDias);
  return formatarDataUtc(data);
}

export function calcularDiferencaDiasDataSomenteDia(
  dataInicial: string,
  dataFinal: string,
): number | null {
  const inicio = criarDataUtcSomenteDia(dataInicial);
  const fim = criarDataUtcSomenteDia(dataFinal);

  if (!inicio || !fim) {
    return null;
  }

  return Math.round((fim.getTime() - inicio.getTime()) / 86400000);
}

export function descreverDistanciaDataSomenteDia(
  valor?: string | null,
  vazio = "-",
): string {
  if (!valor) {
    return vazio;
  }

  const diferenca = calcularDiferencaDiasDataSomenteDia(
    obterDataSomenteDiaAtual(),
    valor.slice(0, 10),
  );

  if (diferenca === null) {
    return vazio;
  }

  if (diferenca === 0) {
    return "hoje";
  }

  if (diferenca > 0) {
    return `em ${diferenca} dia${diferenca > 1 ? "s" : ""}`;
  }

  const distancia = Math.abs(diferenca);
  return `ha ${distancia} dia${distancia > 1 ? "s" : ""}`;
}
