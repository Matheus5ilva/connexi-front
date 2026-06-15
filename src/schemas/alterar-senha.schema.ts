import { z } from "zod";

export const alterarSenhaSchema = z
  .object({
    senhaAtual: z
      .string()
      .trim()
      .min(1, "Informe a senha atual.")
      .max(120, "A senha atual está muito longa."),
    novaSenha: z
      .string()
      .trim()
      .min(6, "A nova senha deve ter pelo menos 6 caracteres.")
      .regex(
        /(?=.*[A-Za-z])(?=.*\d)/,
        "A senha deve conter pelo menos uma letra e um número.",
      )
      .max(120, "A nova senha está muito longa."),
    confirmarNovaSenha: z
      .string()
      .trim()
      .min(6, "Confirme a nova senha.")
      .regex(
        /(?=.*[A-Za-z])(?=.*\d)/,
        "A senha deve conter pelo menos uma letra e um número.",
      )
      .max(120, "A confirmação de senha está muito longa."),
  })
  .superRefine((value, context) => {
    if (value.novaSenha !== value.confirmarNovaSenha) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmarNovaSenha"],
        message: "A confirmação deve ser igual à nova senha.",
      });
    }
  });

export type AlterarSenhaFormularioData = z.infer<typeof alterarSenhaSchema>;
