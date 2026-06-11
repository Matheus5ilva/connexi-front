import { useMemo } from "react";
import { FaArrowRight } from "react-icons/fa6";
import { BrandLogo } from "../../../components/brand-logo";
import { apiConfig } from "../../../services/api";
import styles from "./styles.module.css";

const NUMERO_WHATSAPP_PADRAO = "5538988499084";
const NUMERO_WHATSAPP = (
  import.meta.env.VITE_SUPPORT_WHATSAPP_NUMBER || NUMERO_WHATSAPP_PADRAO
).replace(/\D/g, "");

const MENSAGEM_CONTRATACAO =
  "Olá, tenho interesse em contratar o sistema. Pode me explicar como funciona?";
const MENSAGEM_DESBLOQUEIO =
  "Olá, estou tentando acessar meu sistema, mas o subdomínio não está funcionando. Pode me ajudar?";
const ROTA_INICIAL = "/";

function montarLinkWhatsApp(mensagem: string): string {
  return `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensagem)}`;
}

export function PaginaTenantInexistente() {
  const host =
    typeof window === "undefined" ? apiConfig.hostname : window.location.host;
  const subdominio = apiConfig.tenantSubdomain || "não identificado";

  const linkContratacao = useMemo(
    () => montarLinkWhatsApp(MENSAGEM_CONTRATACAO),
    [],
  );
  const linkDesbloqueio = useMemo(
    () => montarLinkWhatsApp(MENSAGEM_DESBLOQUEIO),
    [],
  );

  function voltarParaFluxoInicial() {
    if (typeof window === "undefined") {
      return;
    }

    window.location.assign(ROTA_INICIAL);
  }

  return (
    <div className={styles.page}>
      <section className={styles.heroSection}>
        <div className={styles.brandRow}>
          <BrandLogo size={30} />
        </div>

        <h1 className={styles.heroTitle}>Este espaço ainda não está ativo</h1>
        <p className={styles.heroDescription}>
          O subdomínio informado não foi encontrado ou ainda não foi liberado.
          Se você deseja contratar o sistema ou precisa reativar seu acesso,
          fale conosco.
        </p>

        <div className={styles.heroActions}>
          <a
            href={linkContratacao}
            className={styles.btnPrimary}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>Contratar sistema</span>
            <FaArrowRight />
          </a>
          <a
            href={linkDesbloqueio}
            className={styles.btnSecondary}
            target="_blank"
            rel="noopener noreferrer"
          >
            Desbloquear acesso
          </a>
        </div>

        <div className={styles.tenantBox}>
          <p className={styles.tenantLine}>
            <strong>Subdomínio:</strong> {subdominio}
          </p>
          <p className={styles.tenantLine}>
            <strong>Endereço:</strong> {host}
          </p>
          <p className={styles.revalidationHint}>
            Se o endereço acabou de ser liberado ou você mudou de subdomínio,
            tente retornar ao início para validar novamente o acesso.
          </p>
          <div className={styles.retryRow}>
            <button
              type="button"
              className={styles.retryButton}
              onClick={voltarParaFluxoInicial}
            >
              Tentar acessar novamente
            </button>
            <p className={styles.retryFeedback}>
              O sistema valida primeiro o subdomínio e depois decide entre login
              ou aplicação.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.contentSection}>
        <article className={styles.infoCard}>
          <h2 className={styles.cardTitle}>
            Uma plataforma simples para saúde e bem-estar
          </h2>
          <ul className={styles.featureList}>
            <li>Agenda organizada para a rotina diária</li>
            <li>Clientes, atendimentos e histórico em um fluxo único</li>
            <li>Financeiro claro para substituir planilhas</li>
            <li>Tudo em um só lugar, sem complexidade desnecessária</li>
          </ul>
        </article>

        <article className={styles.infoCard}>
          <h2 className={styles.cardTitle}>Se você já é cliente</h2>
          <p className={styles.cardDescription}>
            Entre em contato para desbloquear seu acesso. Se ainda não utiliza o
            sistema, podemos apresentar a plataforma em poucos minutos.
          </p>
          <div className={styles.inlineActions}>
            <a
              href={linkDesbloqueio}
              className={styles.inlineLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Solicitar desbloqueio
            </a>
            <a
              href={linkContratacao}
              className={styles.inlineLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Falar sobre contratação
            </a>
          </div>
        </article>
      </section>
    </div>
  );
}
