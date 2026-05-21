export const MENSAGEM_TEXTO_SEM_HTML =
  "Este campo contém termos não permitidos.";

const PADROES_HTML_OU_SCRIPT = [
  /[<>]/,
  /<\/?\s*[a-z][^>]*>/i,
  /\bjavascript\s*:/i,
  /\bon[a-z]+\s*=/i,
  /<\s*script/i,
  /<\/\s*script\s*>/i,
];

const PADROES_SQL_PERIGOSO = [
  /\bdrop\s+(database|table|schema|index|view|function|procedure)\b/i,
  /\bdelete\s+from\b/i,
  /\btruncate(?:\s+table)?\b/i,
  /\balter\s+table\b/i,
  /\binsert\s+into\b/i,
  /\bupdate\s+[\w".[\]-]+\s+set\b/i,
  /\bunion(?:\s+all)?\s+select\b/i,
  /\bselect\s+\*\s+from\b/i,
  /--/,
  /;\s*--/,
  /\/\*/,
  /\*\//,
];

export function contemHtmlOuScript(valor: string): boolean {
  return PADROES_HTML_OU_SCRIPT.some((padrao) => padrao.test(valor));
}

export function contemComandoSqlPerigoso(valor: string): boolean {
  return PADROES_SQL_PERIGOSO.some((padrao) => padrao.test(valor));
}

export function contemTextoInseguro(valor: string): boolean {
  return contemHtmlOuScript(valor) || contemComandoSqlPerigoso(valor);
}

export function validarTextoSemHtml(valor: string): boolean {
  return !contemTextoInseguro(valor);
}
