import { z } from "zod";

export const emailNormalizadoSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Informe um e-mail válido.")
  .max(160, "E-mail muito longo.");

export const formularioLoginSchema = z.object({
  email: emailNormalizadoSchema,
  senha: z
    .string()
    .trim()
    .min(1, "Informe a senha para continuar.")
    .max(120, "Senha muito longa."),
});

export const formularioEsqueciSenhaSchema = z.object({
  email: emailNormalizadoSchema,
});

export const formularioRedefinirSenhaSchema = z
  .object({
    token: z
      .string()
      .trim()
      .min(20, "Link de redefinição inválido.")
      .max(512, "Link de redefinição inválido."),
    novaSenha: z
      .string()
      .trim()
      .min(6, "A nova senha deve ter pelo menos 6 caracteres.")
      .max(120, "A nova senha está muito longa."),
    confirmarNovaSenha: z
      .string()
      .trim()
      .min(6, "Confirme a nova senha.")
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

export const iniciarSessaoRequestSchema = z.object({
  email: emailNormalizadoSchema,
  password: z
    .string()
    .trim()
    .min(1, "Senha obrigatória.")
    .max(120, "Senha muito longa."),
});

export const solicitarRecuperacaoSenhaRequestSchema = z.object({
  email: emailNormalizadoSchema,
});

export const redefinirSenhaRequestSchema = z
  .object({
    token: z
      .string()
      .trim()
      .min(20, "Token de redefinição inválido.")
      .max(512, "Token de redefinição inválido."),
    newPassword: z
      .string()
      .trim()
      .min(6, "A nova senha deve ter pelo menos 6 caracteres.")
      .max(120, "A nova senha está muito longa."),
    confirmNewPassword: z
      .string()
      .trim()
      .min(6, "Confirme a nova senha.")
      .max(120, "A confirmação de senha está muito longa."),
  })
  .superRefine((value, context) => {
    if (value.newPassword !== value.confirmNewPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmNewPassword"],
        message: "A confirmação deve ser igual à nova senha.",
      });
    }
  });

export const alterarSenhaRequestSchema = z.object({
  currentPassword: z
    .string()
    .trim()
    .min(1, "Senha atual obrigatória.")
    .max(120, "Senha atual muito longa."),
  newPassword: z
    .string()
    .trim()
    .min(6, "A nova senha deve ter pelo menos 6 caracteres.")
    .max(120, "A nova senha está muito longa."),
  confirmNewPassword: z
    .string()
    .trim()
    .min(6, "Confirme a nova senha.")
    .max(120, "A confirmação de senha está muito longa."),
});

export type FormularioLoginData = z.infer<typeof formularioLoginSchema>;
export type FormularioEsqueciSenhaData = z.infer<
  typeof formularioEsqueciSenhaSchema
>;
export type FormularioRedefinirSenhaData = z.infer<
  typeof formularioRedefinirSenhaSchema
>;
