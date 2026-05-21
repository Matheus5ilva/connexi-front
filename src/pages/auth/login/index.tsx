import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { iniciarSessaoApi } from "../../../auth/session";
import { BrandLogo } from "../../../components/brand-logo";
import { AvisoErroFormulario } from "../../../components/ui/aviso-erro-formulario";
import { FormField } from "../../../components/ui/form-field";
import { resolveReturnTo } from "../../../routes/return-to";
import {
  authService,
  mapFormularioLoginParaIniciarSessaoRequest,
  toErrorMessage,
} from "../../../services/api";
import type { ErroFormularioAmigavel } from "../../../services/api/errors/erro-formulario";
import { normalizarErroZodFormulario } from "../../../services/api/errors/erro-formulario-validacao";
import {
  formularioLoginSchema,
  type FormularioLoginData,
} from "../../../schemas/auth.schema";
import styles from "../styles.module.css";

type EstadoLogin = FormularioLoginData;

type EstadoLocalizacaoLogin = {
  mensagemSucesso?: string;
};

const mapaRotulosCampos = {
  email: "E-mail",
  senha: "Senha",
} satisfies Record<string, string>;

function obterMensagemSucesso(state: unknown): string | null {
  if (!state || typeof state !== "object") return null;

  const { mensagemSucesso } = state as EstadoLocalizacaoLogin;
  return typeof mensagemSucesso === "string" && mensagemSucesso.trim()
    ? mensagemSucesso.trim()
    : null;
}

export function PaginaLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = resolveReturnTo(location, "/");

  const mensagemSucesso = useMemo(
    () => obterMensagemSucesso(location.state),
    [location.state],
  );

  const [formulario, setFormulario] = useState<EstadoLogin>({
    email: "",
    senha: "",
  });

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [errosFormulario, setErrosFormulario] = useState<
    ErroFormularioAmigavel[]
  >([]);

  function handleChange<K extends keyof EstadoLogin>(
    key: K,
    value: EstadoLogin[K],
  ) {
    setFormulario((prev) => ({ ...prev, [key]: value }));
    setMensagemErro(null);
    setErrosFormulario([]);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMensagemErro(null);
    setErrosFormulario([]);

    const formularioValidado = formularioLoginSchema.safeParse(formulario);

    if (!formularioValidado.success) {
      const resultadoErro = normalizarErroZodFormulario(
        formularioValidado.error,
        {
          mapaRotulosCampos,
          mensagemPadrao: "Dados de login inválidos.",
        },
      );

      setMensagemErro(resultadoErro.mensagemGlobal);
      setErrosFormulario(resultadoErro.erros);
      return;
    }

    setIsLoading(true);

    try {
      const respostaLogin = await authService.iniciarSessao(
        mapFormularioLoginParaIniciarSessaoRequest(formularioValidado.data),
      );

      const usuarioAutenticado = iniciarSessaoApi(respostaLogin);

      const destino = usuarioAutenticado.deveTrocarSenha
        ? "/configuracoes/minha-conta"
        : returnTo;

      navigate(destino, {
        replace: true,
        state: usuarioAutenticado.deveTrocarSenha ? { returnTo } : undefined,
      });
    } catch (submitError) {
      setMensagemErro(
        toErrorMessage(
          submitError,
          "Não foi possível entrar no sistema agora.",
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

          <h1 className={styles.headline}>
            Organize sua rotina com{" "}
            <span className={styles.gradientText}>leveza</span>
          </h1>
          <p className={styles.subtitle}>
            Agenda, clientes, histórico e financeiro em um só lugar, sem
            complicação.
          </p>
          <ul className={styles.featureList}>
            <li className={styles.featureItem}>
              <span className={styles.featureDot} />
              Agenda organizada
            </li>
            <li className={styles.featureItem}>
              <span className={styles.featureDot} />
              Clientes e histórico centralizados
            </li>
            <li className={styles.featureItem}>
              <span className={styles.featureDot} />
              Financeiro simples e claro
            </li>
          </ul>
        </div>
      </section>

      <section className={styles.formPanel}>
        <div className={styles.authCard}>
          <header className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Entrar na sua conta</h2>
            <p className={styles.cardSubtitle}>
              Informe seus dados para acessar o CONNEXI.
            </p>
          </header>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            {mensagemErro ? (
              <AvisoErroFormulario
                titulo={
                  errosFormulario.length > 0
                    ? "Verifique os campos abaixo:"
                    : "Não foi possível concluir o acesso."
                }
                mensagem={
                  errosFormulario.length === 0 ? mensagemErro : undefined
                }
                erros={errosFormulario}
              />
            ) : null}

            <FormField id="login-email" label="E-mail" required>
              <input
                id="login-email"
                className={`${styles.input} ${
                  mensagemErro ? styles.inputError : ""
                }`}
                type="email"
                value={formulario.email}
                autoComplete="email"
                onChange={(event) => handleChange("email", event.target.value)}
                placeholder="voce@email.com"
              />
            </FormField>

            <FormField id="login-senha" label="Senha" required>
              <div className={styles.passwordRow}>
                <input
                  id="login-senha"
                  className={`${styles.input} ${
                    mensagemErro ? styles.inputError : ""
                  }`}
                  type={mostrarSenha ? "text" : "password"}
                  value={formulario.senha}
                  autoComplete="current-password"
                  onChange={(event) =>
                    handleChange("senha", event.target.value)
                  }
                  placeholder="Digite sua senha"
                />

                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setMostrarSenha((prev) => !prev)}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarSenha ? "Ocultar" : "Mostrar"}
                </button>
              </div>
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
              {isLoading ? "Entrando..." : "Entrar"}
            </button>

            <div className={styles.helperRow}>
              <span />
              <Link to="/esqueci-senha" className={styles.authLink}>
                Esqueci minha senha
              </Link>
            </div>
          </form>

          <p className={styles.footerHint}>
            Ao entrar, você declara ciência das diretrizes da plataforma.{" "}
            <Link
              to="/termos-e-compromisso"
              className={styles.authLink}
              target="_blank"
              rel="noreferrer"
            >
              Leia os termos e compromisso
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
