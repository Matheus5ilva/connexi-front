import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import logo from "../../../assets/logo.png";
import { AvisoErroFormulario } from "../../../components/ui/aviso-erro-formulario";
import { FormField } from "../../../components/ui/form-field";
import {
  authService,
  mapFormularioRedefinirSenhaParaRequest,
  toErrorMessage,
} from "../../../services/api";
import type { ErroFormularioAmigavel } from "../../../services/api/errors/erro-formulario";
import { normalizarErroZodFormulario } from "../../../services/api/errors/erro-formulario-validacao";
import {
  formularioRedefinirSenhaSchema,
  type FormularioRedefinirSenhaData,
} from "../../../schemas/auth.schema";
import styles from "../styles.module.css";

function obterToken(searchParams: URLSearchParams): string {
  return searchParams.get("token")?.trim() || "";
}

const mapaRotulosCampos = {
  novaSenha: "Nova senha",
  confirmarNovaSenha: "Confirmar nova senha",
} satisfies Record<string, string>;

export function PaginaRedefinirSenha() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => obterToken(searchParams), [searchParams]);

  const [formulario, setFormulario] = useState<
    Omit<FormularioRedefinirSenhaData, "token">
  >({
    novaSenha: "",
    confirmarNovaSenha: "",
  });
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [errosFormulario, setErrosFormulario] = useState<
    ErroFormularioAmigavel[]
  >([]);

  const tokenValido = token.length >= 20;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMensagemErro(null);
    setErrosFormulario([]);

    const formularioValidado = formularioRedefinirSenhaSchema.safeParse({
      token,
      ...formulario,
    });

    if (!formularioValidado.success) {
      const resultadoErro = normalizarErroZodFormulario(
        formularioValidado.error,
        {
          mapaRotulosCampos,
          mensagemPadrao: "Não foi possível validar os dados informados.",
        },
      );
      setMensagemErro(resultadoErro.mensagemGlobal);
      setErrosFormulario(resultadoErro.erros);
      return;
    }

    setIsLoading(true);

    try {
      await authService.redefinirSenha(
        mapFormularioRedefinirSenhaParaRequest(formularioValidado.data),
      );

      navigate("/login", {
        replace: true,
        state: {
          mensagemSucesso:
            "Senha redefinida com sucesso. Faça login para continuar.",
        },
      });
    } catch (submitError) {
      setMensagemErro(
        toErrorMessage(
          submitError,
          "Não foi possível redefinir a senha com esse link. Solicite uma nova recuperação e tente novamente.",
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
            <img className={styles.logoImage} src={logo} alt="CONNEXI" />
            <span className={styles.logoText}>ONNEXI</span>
          </div>
          <h1 className={styles.headline}>Defina sua nova senha</h1>
          <p className={styles.subtitle}>
            {
              "Crie uma nova senha para retomar o acesso à sua conta com segurança."
            }
          </p>
          <ul className={styles.featureList}>
            <li className={styles.featureItem}>
              <span className={styles.featureDot} />
              {"Seu link de recuperação é validado antes do envio"}
            </li>
            <li className={styles.featureItem}>
              <span className={styles.featureDot} />
              {"A nova senha precisa coincidir com a confirmação informada"}
            </li>
            <li className={styles.featureItem}>
              <span className={styles.featureDot} />
              {"Após concluir, basta entrar novamente com a nova senha"}
            </li>
          </ul>
        </div>
      </section>

      <section className={styles.formPanel}>
        <div className={styles.authCard}>
          <header className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Redefinir senha</h2>
            <p className={styles.cardSubtitle}>
              {"Informe a nova senha para concluir a recuperação de acesso."}
            </p>
          </header>

          {!tokenValido ? (
            <>
              <p className={styles.feedbackError} role="alert">
                {"O link de redefinição é inválido ou está incompleto."}
              </p>
              <div className={styles.helperRow}>
                <Link to="/esqueci-senha" className={styles.authLink}>
                  Solicitar novo link
                </Link>
                <Link to="/login" className={styles.authLink}>
                  Voltar para login
                </Link>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              {mensagemErro ? (
                <AvisoErroFormulario
                  titulo={
                    errosFormulario.length > 0
                      ? "Verifique os campos abaixo:"
                      : "Não foi possível concluir a redefinição."
                  }
                  mensagem={
                    errosFormulario.length === 0 ? mensagemErro : undefined
                  }
                  erros={errosFormulario}
                />
              ) : null}

              <FormField id="reset-nova-senha" label="Nova senha" required>
                <div className={styles.passwordRow}>
                  <input
                    id="reset-nova-senha"
                    className={`${styles.input} ${mensagemErro ? styles.inputError : ""}`}
                    type={mostrarNovaSenha ? "text" : "password"}
                    value={formulario.novaSenha}
                    autoComplete="new-password"
                    onChange={(event) => {
                      setFormulario((prev) => ({
                        ...prev,
                        novaSenha: event.target.value,
                      }));
                      setMensagemErro(null);
                      setErrosFormulario([]);
                    }}
                    placeholder="Digite a nova senha"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setMostrarNovaSenha((prev) => !prev)}
                    aria-label={
                      mostrarNovaSenha ? "Ocultar senha" : "Mostrar senha"
                    }
                  >
                    {mostrarNovaSenha ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </FormField>

              <FormField
                id="reset-confirmar-nova-senha"
                label="Confirmar nova senha"
                required
              >
                <div className={styles.passwordRow}>
                  <input
                    id="reset-confirmar-nova-senha"
                    className={`${styles.input} ${mensagemErro ? styles.inputError : ""}`}
                    type={mostrarConfirmacao ? "text" : "password"}
                    value={formulario.confirmarNovaSenha}
                    autoComplete="new-password"
                    onChange={(event) => {
                      setFormulario((prev) => ({
                        ...prev,
                        confirmarNovaSenha: event.target.value,
                      }));
                      setMensagemErro(null);
                      setErrosFormulario([]);
                    }}
                    placeholder="Repita a nova senha"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setMostrarConfirmacao((prev) => !prev)}
                    aria-label={
                      mostrarConfirmacao
                        ? "Ocultar confirmação"
                        : "Mostrar confirmação"
                    }
                  >
                    {mostrarConfirmacao ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </FormField>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={isLoading}
              >
                {isLoading ? "Redefinindo..." : "Redefinir senha"}
              </button>

              <div className={styles.helperRow}>
                <Link to="/esqueci-senha" className={styles.authLink}>
                  Solicitar novo link
                </Link>
                <Link to="/login" className={styles.authLink}>
                  Voltar para login
                </Link>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
