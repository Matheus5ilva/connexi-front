import { FaArrowLeft, FaHome } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { possuiSessaoNoTenantAtual } from "../../auth/session";
import { useSessaoAutenticada } from "../../auth/use-auth-session";
import logo from "../../assets/logo.png";
import { apiConfig } from "../../services/api";
import styles from "./styles.module.css";

type DestinoPrincipal404 = {
  caminho: string;
  rotulo: string;
};

function obterDestinoPrincipal404(params: {
  contextoPublico: boolean;
  sessaoValidaNoTenantAtual: boolean;
}): DestinoPrincipal404 {
  if (params.contextoPublico) {
    return {
      caminho: "/",
      rotulo: "Ir para a pagina inicial",
    };
  }

  if (params.sessaoValidaNoTenantAtual) {
    return {
      caminho: "/",
      rotulo: "Ir para o painel",
    };
  }

  return {
    caminho: "/login",
    rotulo: "Ir para o login",
  };
}

export function PaginaNaoEncontrada() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useSessaoAutenticada();
  const contextoPublico = !apiConfig.tenantSubdomain;
  const sessaoValidaNoTenantAtual = possuiSessaoNoTenantAtual({
    isAuthenticated,
    user,
  });
  const destinoPrincipal = obterDestinoPrincipal404({
    contextoPublico,
    sessaoValidaNoTenantAtual,
  });
  const caminhoAtual = `${location.pathname}${location.search}${location.hash}`;
  const podeVoltarParaPaginaAnterior = location.key !== "default";

  function voltarPaginaAnterior() {
    if (podeVoltarParaPaginaAnterior) {
      navigate(-1);
      return;
    }

    navigate(destinoPrincipal.caminho, { replace: true });
  }

  return (
    <main className={styles.wrapper}>
      <section
        className={styles.card}
        aria-labelledby="pagina-nao-encontrada-title"
      >
        <img className={styles.logo} src={logo} alt="CONNEXI" />

        <span className={styles.errorCode} aria-hidden="true">
          404
        </span>

        <h1 id="pagina-nao-encontrada-title" className={styles.title}>
          Pagina nao encontrada
        </h1>
        <p className={styles.subtitle}>
          O endereco informado nao existe ou foi movido. Confira a URL e volte
          para um caminho seguro do contexto atual.
        </p>

        <p className={styles.pathHint}>
          Caminho acessado: <strong>{caminhoAtual}</strong>
        </p>

        <div className={styles.actions}>
          <button
            className={styles.btnPrimary}
            onClick={() => navigate(destinoPrincipal.caminho, { replace: true })}
            type="button"
          >
            <FaHome />
            <span>{destinoPrincipal.rotulo}</span>
          </button>

          <button
            className={styles.btnSecondary}
            onClick={voltarPaginaAnterior}
            type="button"
          >
            <FaArrowLeft />
            <span>Voltar</span>
          </button>
        </div>
      </section>
    </main>
  );
}
