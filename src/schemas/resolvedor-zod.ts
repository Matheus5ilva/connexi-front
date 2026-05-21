import { toNestErrors, validateFieldsNatively } from "@hookform/resolvers";
import type { FieldError, FieldValues, Resolver } from "react-hook-form";
import type { ZodIssue, ZodType } from "zod";

type OpcoesResolvedorZod = {
  mode?: "async" | "sync";
  manterValoresBrutos?: boolean;
};

type IssueComErrosUniao = ZodIssue & {
  errors?: ZodIssue[][];
};

function listarIssuesZod(issues: readonly ZodIssue[]) {
  const errosCampos: Record<string, FieldError> = {};
  const fila = [...issues];

  while (fila.length > 0) {
    const issue = fila.shift();

    if (!issue) {
      continue;
    }

    const caminhoCampo =
      issue.path.length > 0 ? issue.path.join(".") : "root";

    if (!errosCampos[caminhoCampo]) {
      errosCampos[caminhoCampo] = {
        type: issue.code,
        message: issue.message,
      };
    }

    const issueComErrosUniao = issue as IssueComErrosUniao;
    if (Array.isArray(issueComErrosUniao.errors)) {
      issueComErrosUniao.errors.forEach((grupo) => {
        fila.push(...grupo);
      });
    }
  }

  return errosCampos;
}

export function criarResolvedorZod<TValores extends FieldValues>(
  schema: ZodType<TValores>,
  opcoes: OpcoesResolvedorZod = {},
): Resolver<TValores> {
  return async (valores, _, opcoesFormulario) => {
    const resultado =
      opcoes.mode === "sync"
        ? schema.safeParse(valores)
        : await schema.safeParseAsync(valores);

    if (resultado.success) {
      if (opcoesFormulario.shouldUseNativeValidation) {
        validateFieldsNatively({}, opcoesFormulario);
      }

      return {
        values: opcoes.manterValoresBrutos ? valores : resultado.data,
        errors: {},
      };
    }

    return {
      values: {},
      errors: toNestErrors(listarIssuesZod(resultado.error.issues), opcoesFormulario),
    };
  };
}
