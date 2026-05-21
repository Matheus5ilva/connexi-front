export type DadosViaCep = {
  logradouro?: string;
  bairro?: string;
  nomeCidade?: string;
  codigoIbgeCidade?: string;
};

type RespostaViaCep = {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  ibge?: string;
};

export async function buscarEnderecoPorCep(
  cepInformado: string,
): Promise<DadosViaCep | null> {
  const cep = cepInformado.replace(/\D/g, "");
  if (cep.length !== 8) {
    return null;
  }

  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  if (!response.ok) {
    return null;
  }

  const data: RespostaViaCep = await response.json();
  if (data.erro) {
    return null;
  }

  return {
    logradouro: data.logradouro,
    bairro: data.bairro,
    nomeCidade: data.localidade,
    codigoIbgeCidade: data.ibge,
  };
}
