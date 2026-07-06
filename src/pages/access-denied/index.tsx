import { FaArrowLeft, FaHome } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { obterRotaInicialPermitida } from "../../auth/permissoes-visuais";
import { useSessaoAutenticada } from "../../auth/use-auth-session";
import logo from "../../assets/logo.png";
import styles from "../not-found/styles.module.css";

export function PaginaAcessoNegado() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSessaoAutenticada();
  const caminhoAtual =
    (location.state as { from?: string } | null)?.from ?? location.pathname;
  const destinoSeguro = obterRotaInicialPermitida(user);
  const podeVoltarParaPaginaAnterior = location.key !== "default";

  function voltarPaginaAnterior() {
    if (podeVoltarParaPaginaAnterior) {
      navigate(-1);
      return;
    }

    navigate(destinoSeguro, { replace: true });
  }

  return (
    <main className={styles.wrapper}>
      <section className={styles.card} aria-labelledby="acesso-negado-title">
        <img className={styles.logo} src={logo} alt="CONNEXI" />

        <span className={styles.errorCode} aria-hidden="true">
          403
        </span>

        <h1 id="acesso-negado-title" className={styles.title}>
          Acesso negado
        </h1>
        <p className={styles.subtitle}>
          Seu perfil nao tem permissao para acessar esta area.
        </p>

        <p className={styles.pathHint}>
          Caminho acessado: <strong>{caminhoAtual}</strong>
        </p>

        <div className={styles.actions}>
          <button
            className={styles.btnPrimary}
            onClick={() => navigate(destinoSeguro, { replace: true })}
            type="button"
          >
            <FaHome />
            <span>Ir para area inicial</span>
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
