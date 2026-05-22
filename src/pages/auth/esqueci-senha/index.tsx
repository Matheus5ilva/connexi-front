import { useState } from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "../../../components/brand-logo";
import { AvisoErroFormulario } from "../../../components/ui/aviso-erro-formulario";
import { FormField } from "../../../components/ui/form-field";
import {
  authService,
  mapFormularioEsqueciSenhaParaRequest,
  toErrorMessage,
} from "../../../services/api";
import type { ErroFormularioAmigavel } from "../../../services/api/errors/erro-formulario";
import { normalizarErroZodFormulario } from "../../../services/api/errors/erro-formulario-validacao";
import {
  formularioEsqueciSenhaSchema,
  type FormularioEsqueciSenhaData,
} from "../../../schemas/auth.schema";
import styles from "../styles.module.css";

const mapaRotulosCampos = {
  email: "E-mail",
} satisfies Record<string, string>;

const EMAIL_HABILITADO = import.meta.env.VITE_EMAIL_HABILITADO === "true";

const MENSAGEM_EMAIL_INDISPONIVEL =
  "O envio de e-mails est\u00e1 temporariamente indispon\u00edvel. Estamos realizando ajustes na infraestrutura.";

export function PaginaEsqueciSenha() {
  const [formulario, setFormulario] = useState<FormularioEsqueciSenhaData>({
    email: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [errosFormulario, setErrosFormulario] = useState<
    ErroFormularioAmigavel[]
  >([]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMensagemErro(null);
    setMensagemSucesso(null);
    setErrosFormulario([]);

    if (!EMAIL_HABILITADO) {
      setMensagemErro(MENSAGEM_EMAIL_INDISPONIVEL);
      return;
    }

    const formularioValidado =
      formularioEsqueciSenhaSchema.safeParse(formulario);
    if (!formularioValidado.success) {
      const resultadoErro = normalizarErroZodFormulario(
        formularioValidado.error,
        {
          mapaRotulosCampos,
          mensagemPadrao: "Informe um e-mail válido.",
        },
      );
      setMensagemErro(resultadoErro.mensagemGlobal);
      setErrosFormulario(resultadoErro.erros);
      return;
    }

    setIsLoading(true);

    try {
      await authService.solicitarRecuperacaoSenha(
        mapFormularioEsqueciSenhaParaRequest(formularioValidado.data),
      );
      setMensagemSucesso(
        "Solicitação enviada. Verifique seu e-mail para continuar.",
      );
    } catch (submitError) {
      setMensagemErro(
        toErrorMessage(
          submitError,
          "Não foi possível enviar a solicitação agora. Tente novamente em instantes.",
        ),
      );
      setErrosFormulario([]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.authPage}>
      <section className={styles.brandPanel}>
        <div className={styles.brandInner}>
          <div className={styles.logoRow}>
            <BrandLogo size={28} />
          </div>
          <h1 className={styles.headline}>Recuperação de acesso</h1>
          <p className={styles.subtitle}>
            {
              "Informe o e-mail da conta para receber orientações de redefinição de senha com segurança."
            }
          </p>
          <ul className={styles.featureList}>
            <li className={styles.featureItem}>
              <span className={styles.featureDot} />
              {"Fluxo simples e claro para recuperação"}
            </li>
            <li className={styles.featureItem}>
              <span className={styles.featureDot} />
              {"Mensagens objetivas para evitar confusão"}
            </li>
            <li className={styles.featureItem}>
              <span className={styles.featureDot} />
              {"Experiência consistente com o restante do sistema"}
            </li>
          </ul>
        </div>
      </section>

      <section className={styles.formPanel}>
        <div className={styles.authCard}>
          <header className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Esqueci minha senha</h2>
            <p className={styles.cardSubtitle}>
              Digite seu e-mail para solicitar a redefinição.
            </p>
            {!EMAIL_HABILITADO ? (
              <p className={styles.serviceNotice} role="status">
                Serviço de e-mail temporariamente indisponível
              </p>
            ) : null}
          </header>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            {mensagemErro ? (
              <AvisoErroFormulario
                titulo={
                  errosFormulario.length > 0
                    ? "Verifique os campos abaixo:"
                    : "Não foi possível concluir a solicitação."
                }
                mensagem={
                  errosFormulario.length === 0 ? mensagemErro : undefined
                }
                erros={errosFormulario}
              />
            ) : null}

            <FormField id="forgot-email" label="E-mail" required>
              <input
                id="forgot-email"
                className={`${styles.input} ${mensagemErro ? styles.inputError : ""}`}
                type="email"
                value={formulario.email}
                autoComplete="email"
                onChange={(event) => {
                  setFormulario({ email: event.target.value });
                  setMensagemErro(null);
                  setErrosFormulario([]);
                }}
                placeholder="voce@consultorio.com"
              />
            </FormField>

            {mensagemSucesso ? (
              <p className={styles.feedbackSuccess} role="status">
                {mensagemSucesso}
              </p>
            ) : null}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? "Enviando..." : "Enviar solicitação"}
            </button>

            <div className={styles.helperRow}>
              <Link to="/login" className={styles.authLink}>
                Voltar para login
              </Link>
            </div>
          </form>

          <p className={styles.footerHint}>
            {
              "Se o e-mail estiver cadastrado, você receberá as próximas instruções."
            }
          </p>
        </div>
      </section>
    </div>
  );
}
