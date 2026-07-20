import { useEffect, useRef, useState } from "react";
import { FaInstagram, FaWhatsapp } from "react-icons/fa";
import { HiOutlineBars3, HiOutlineXMark } from "react-icons/hi2";
import {
  MdAccountBalanceWallet,
  MdArrowForward,
  MdCalendarToday,
  MdChatBubble,
  MdCheckCircle,
  MdContentPasteSearch,
  MdEventAvailable,
  MdFavorite,
  MdGroup,
  MdHistoryEdu,
  MdMedicalServices,
  MdMoreHoriz,
  MdNoteAlt,
  MdPayments,
  MdRestaurant,
  MdSelfImprovement,
  MdSpa,
  MdVerified,
} from "react-icons/md";
import { BrandLogo } from "../../components/brand-logo";
import { APP_SITE_URL } from "../../config/version";
import landingAgendaMock from "../../assets/landing-agenda-mock.png";
import styles from "./styles.module.css";

const NUMERO_WHATSAPP_PADRAO = "5531984505916";
const NUMERO_WHATSAPP = (
  import.meta.env.VITE_SUPPORT_WHATSAPP_NUMBER || NUMERO_WHATSAPP_PADRAO
).replace(/\D/g, "");

const mensagemComercial =
  "Olá, quero conhecer o CONNEXI para organizar minha rotina de atendimentos.";
const mensagemPlanoSolo =
  "Olá! Tenho interesse no plano SOLO do CONNEXI por R$ 44,90 por mês. Gostaria de saber como contratar.";
const mensagemPlanoEquipe =
  "Olá! Tenho interesse no plano EQUIPE do CONNEXI por R$ 59,90 por mês. Gostaria de saber como contratar.";
const instagramUrl = normalizarUrlExterna(import.meta.env.VITE_INSTAGRAM_URL);
const whatsappComercial = montarLinkWhatsApp(mensagemComercial);
const whatsappPlanoSolo = montarLinkWhatsApp(mensagemPlanoSolo);
const whatsappPlanoEquipe = montarLinkWhatsApp(mensagemPlanoEquipe);
const termosCompromissoUrl = `${APP_SITE_URL}/termos-e-compromisso`;
const jsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://connexi.com.br/#organization",
      name: "CONNEXI",
      url: "https://connexi.com.br/",
      logo: "https://connexi.com.br/icon-512.png",
    },
    {
      "@type": "WebSite",
      "@id": "https://connexi.com.br/#website",
      url: "https://connexi.com.br/",
      name: "CONNEXI",
      publisher: { "@id": "https://connexi.com.br/#organization" },
      inLanguage: "pt-BR",
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://connexi.com.br/#software",
      name: "CONNEXI",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "Sistema para organizar agenda, clientes, atendimentos e financeiro de profissionais autônomos e pequenos negócios.",
      offers: [
        {
          "@type": "Offer",
          name: "Plano SOLO",
          price: "44.90",
          priceCurrency: "BRL",
          url: "https://connexi.com.br/#precos",
        },
        {
          "@type": "Offer",
          name: "Plano EQUIPE",
          price: "59.90",
          priceCurrency: "BRL",
          url: "https://connexi.com.br/#precos",
        },
      ],
    },
  ],
});

function montarLinkWhatsApp(mensagem: string): string {
  return `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensagem)}`;
}

function normalizarUrlExterna(valor?: string): string | null {
  const urlInformada = valor?.trim();

  if (!urlInformada) {
    return null;
  }

  try {
    const url = new URL(urlInformada);
    return ["https:", "http:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

export function PaginaInicialPublica() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [headerRolado, setHeaderRolado] = useState(false);
  const pageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function sincronizarHeader() {
      const deveDestacar = window.scrollY > 50;
      setHeaderRolado((atual) =>
        atual === deveDestacar ? atual : deveDestacar,
      );
    }

    sincronizarHeader();
    window.addEventListener("scroll", sincronizarHeader, { passive: true });
    return () => window.removeEventListener("scroll", sincronizarHeader);
  }, []);

  useEffect(() => {
    if (!menuAberto) {
      return;
    }

    function fecharComEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuAberto(false);
      }
    }

    window.addEventListener("keydown", fecharComEscape);
    return () => window.removeEventListener("keydown", fecharComEscape);
  }, [menuAberto]);

  useEffect(() => {
    const pagina = pageRef.current;

    if (!pagina) {
      return;
    }

    const elementos = Array.from(
      pagina.querySelectorAll<HTMLElement>("[data-reveal]"),
    );

    if (!("IntersectionObserver" in window)) {
      return;
    }

    pagina.classList.add(styles.revealReady);

    const observer = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (!entrada.isIntersecting) {
            return;
          }

          entrada.target.classList.add(styles.revealActive);
          observer.unobserve(entrada.target);
        });
      },
      { rootMargin: "0px 0px -50px 0px", threshold: 0.1 },
    );

    let segundoFrame = 0;
    const primeiroFrame = requestAnimationFrame(() => {
      segundoFrame = requestAnimationFrame(() => {
        elementos.forEach((elemento) => {
          observer.observe(elemento);
        });
      });
    });

    return () => {
      cancelAnimationFrame(primeiroFrame);
      cancelAnimationFrame(segundoFrame);
      observer.disconnect();
      pagina.classList.remove(styles.revealReady);
      elementos.forEach((elemento) =>
        elemento.classList.remove(styles.revealActive),
      );
    };
  }, []);

  function fecharMenu() {
    setMenuAberto(false);
  }

  return (
    <>
      <script type="application/ld+json">{jsonLd}</script>
      <main ref={pageRef} className={styles.landingPage}>
        <header
          className={`${styles.header} ${headerRolado ? styles.headerScrolled : ""}`}
        >
          <div className={styles.headerInner}>
            <a className={styles.logoLink} href="/" aria-label="CONNEXI">
              <BrandLogo size={32} />
            </a>

            <nav className={styles.desktopNav} aria-label="Navegação principal">
              <a href="#problema">O Problema</a>
              <a href="#solucao">A Solução</a>
              <a href="#para-quem">Para Quem</a>
              <a href="#precos">Preços</a>
            </nav>

            <div className={styles.headerActions}>
              <a
                className={styles.headerButton}
                href={whatsappComercial}
                target="_blank"
                rel="noopener noreferrer"
              >
                Quero conhecer
              </a>
              <button
                className={styles.menuButton}
                type="button"
                aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
                aria-expanded={menuAberto}
                aria-controls="landing-mobile-menu"
                onClick={() => setMenuAberto((aberto) => !aberto)}
              >
                <span className={styles.menuIcon} aria-hidden="true">
                  <HiOutlineBars3
                    className={`${styles.menuIconSvg} ${
                      menuAberto ? styles.menuIconHidden : styles.menuIconVisible
                    }`}
                  />
                  <HiOutlineXMark
                    className={`${styles.menuIconSvg} ${
                      menuAberto ? styles.menuIconVisible : styles.menuIconHidden
                    }`}
                  />
                </span>
              </button>
            </div>
          </div>

          <nav
            id="landing-mobile-menu"
            className={`${styles.mobileNav} ${menuAberto ? styles.mobileNavOpen : ""}`}
            aria-label="Navegação mobile"
          >
            <a href="#problema" onClick={fecharMenu}>
              O Problema
            </a>
            <a href="#solucao" onClick={fecharMenu}>
              A Solução
            </a>
            <a href="#para-quem" onClick={fecharMenu}>
              Para Quem
            </a>
            <a href="#precos" onClick={fecharMenu}>
              Preços
            </a>
            <a
              href={whatsappComercial}
              target="_blank"
              rel="noopener noreferrer"
              onClick={fecharMenu}
            >
              Tirar dúvidas
            </a>
            <a
              href={whatsappComercial}
              target="_blank"
              rel="noopener noreferrer"
              onClick={fecharMenu}
            >
              Quero conhecer
            </a>
          </nav>
        </header>

        <div>
          <section className={styles.hero}>
            <div className={styles.architecture} aria-hidden="true">
              <svg
                fill="none"
                viewBox="0 0 400 400"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  height="300"
                  stroke="white"
                  strokeWidth="2"
                  width="300"
                  x="50"
                  y="50"
                />
                <rect
                  height="300"
                  stroke="white"
                  strokeWidth="2"
                  width="300"
                  x="100"
                  y="100"
                />
              </svg>
            </div>

            <div className={`${styles.container} ${styles.heroContent}`}>
              <div className={styles.reveal} data-reveal>
                <span className={styles.heroBadgeDot} aria-hidden="true" />
                Sistema para saúde e bem-estar
              </div>

              <h1
                className={`${styles.reveal} ${styles.delay100} ${styles.heroTitle}`}
                data-reveal
              >
                Organize seus atendimentos em um só lugar
              </h1>

              <p
                className={`${styles.reveal} ${styles.delay200} ${styles.heroText}`}
                data-reveal
              >
                Agenda, clientes, histórico de atendimentos e financeiro para
                profissionais que buscam excelência, autoridade e cuidado.
              </p>

              <div
                className={`${styles.reveal} ${styles.delay300} ${styles.heroActions}`}
                data-reveal
              >
                <a
                  className={styles.heroPrimary}
                  href={whatsappComercial}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaWhatsapp aria-hidden="true" />
                  Quero conhecer
                </a>
                <a
                  className={styles.heroSecondary}
                  href={whatsappComercial}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Tirar dúvidas
                  <MdArrowForward aria-hidden="true" />
                </a>
              </div>

              <div
                className={`${styles.reveal} ${styles.delay400} ${styles.heroBenefits}`}
                data-reveal
              >
                <div>
                  <MdCheckCircle aria-hidden="true" /> Tudo em um único lugar
                </div>
                <div>
                  <MdCheckCircle aria-hidden="true" /> Feito para quem atende
                  sozinho
                </div>
                <div>
                  <MdCheckCircle aria-hidden="true" /> Simples desde o primeiro
                  uso
                </div>
              </div>
            </div>
          </section>

          <section className={styles.problem} id="problema">
            <div className={styles.container}>
              <div
                className={`${styles.splitHeader} ${styles.reveal}`}
                data-reveal
              >
                <div className={styles.splitTitle}>
                  <span className={styles.sectionBadge}>O desafio atual</span>
                  <h2>Seu trabalho não deveria ficar espalhado.</h2>
                </div>
                <p>
                  Quando tudo fica em lugares diferentes, sua rotina de
                  atendimentos fica mais cansativa e difícil de acompanhar.
                </p>
              </div>

              <div className={styles.problemGrid}>
                <article
                  className={`${styles.problemCard} ${styles.reveal}`}
                  data-reveal
                >
                  <div className={styles.problemIcon}>
                    <MdCalendarToday aria-hidden="true" />
                  </div>
                  <h3>Agenda separada</h3>
                  <p>
                    Você marca atendimentos em um lugar e controla clientes em
                    outro, perdendo o histórico precioso de cada consulta.
                  </p>
                </article>

                <article
                  className={`${styles.problemCard} ${styles.reveal} ${styles.delay100}`}
                  data-reveal
                >
                  <div className={styles.problemIcon}>
                    <MdHistoryEdu aria-hidden="true" />
                  </div>
                  <h3>Histórico espalhado</h3>
                  <p>
                    Informações importantes acabam ficando em anotações soltas,
                    arquivos no computador ou conversas de WhatsApp.
                  </p>
                </article>

                <article
                  className={`${styles.problemCard} ${styles.reveal} ${styles.delay200}`}
                  data-reveal
                >
                  <div className={styles.problemIcon}>
                    <MdPayments aria-hidden="true" />
                  </div>
                  <h3>Financeiro manual</h3>
                  <p>
                    Recebimentos e pendências dependem de planilhas complexas ou
                    controles em papel que são difíceis de atualizar.
                  </p>
                </article>
              </div>
            </div>
          </section>

          <section className={styles.solution} id="solucao">
            <div className={`${styles.container} ${styles.solutionStack}`}>
              <div className={styles.solutionBlock}>
                <div
                  className={`${styles.solutionCopy} ${styles.reveal}`}
                  data-reveal
                >
                  <div>
                    <span className={styles.sectionBadge}>Produtividade</span>
                    <h2>Uma rotina mais profissional em poucos cliques.</h2>
                    <p>
                      O CONNEXI centraliza o essencial para você atender melhor,
                      acompanhar seus clientes e cuidar da organização com
                      clareza e autoridade.
                    </p>
                  </div>

                  <div className={styles.miniGrid}>
                    <article>
                      <MdEventAvailable aria-hidden="true" />
                      <strong>Agenda inteligente</strong>
                      <span>
                        Controle total visual e simplificado da sua grade
                        horária.
                      </span>
                    </article>
                    <article>
                      <MdNoteAlt aria-hidden="true" />
                      <strong>Histórico organizado</strong>
                      <span>
                        Evoluções e registros acessíveis em um clique.
                      </span>
                    </article>
                  </div>
                </div>

                <div
                  className={`${styles.interfaceColumn} ${styles.reveal} ${styles.delay200}`}
                  data-reveal
                >
                  <div className={styles.interfaceGlow} aria-hidden="true" />
                  <div className={styles.interfaceFrame}>
                    <img
                      src={landingAgendaMock}
                      alt=""
                      aria-hidden="true"
                      width={512}
                      height={279}
                      loading="lazy"
                      decoding="async"
                      className={styles.interfaceImage}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.solutionBlock}>
                <div
                  className={`${styles.financeColumn} ${styles.reveal}`}
                  data-reveal
                >
                  <div className={styles.interfaceGlow} aria-hidden="true" />
                  <div className={styles.financeMock}>
                    <div className={styles.financeCard}>
                      <div className={styles.financeTop}>
                        <div>
                          <h3>Fluxo de Caixa</h3>
                          <p>Resumo mensal consolidado</p>
                        </div>
                        <MdMoreHoriz aria-hidden="true" />
                      </div>

                      <div className={styles.goalBlock}>
                        <div>
                          <span>Meta Mensal</span>
                          <strong>82%</strong>
                        </div>
                        <i aria-hidden="true">
                          <span />
                        </i>
                      </div>

                      <div className={styles.financeTiles}>
                        <article>
                          <small>Recebido</small>
                          <strong>R$ 4.680</strong>
                        </article>
                        <article>
                          <small>Pendente</small>
                          <strong>R$ 1.200</strong>
                        </article>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`${styles.solutionCopy} ${styles.reveal} ${styles.delay200}`}
                  data-reveal
                >
                  <div>
                    <span className={styles.sectionBadge}>Gestão</span>
                    <h2>Controle unificado para maior segurança.</h2>
                    <p>
                      Administre seus clientes e suas finanças sem precisar de
                      várias ferramentas. O CONNEXI oferece tudo em uma
                      interface focada na sua tranquilidade.
                    </p>
                  </div>

                  <div className={styles.highlightGrid}>
                    <article>
                      <div>
                        <MdGroup aria-hidden="true" />
                      </div>
                      <div>
                        <strong>Cadastro unificado</strong>
                        <p>
                          Centralize dados e contatos em um banco de dados
                          seguro.
                        </p>
                      </div>
                    </article>
                    <article>
                      <div>
                        <MdAccountBalanceWallet aria-hidden="true" />
                      </div>
                      <div>
                        <strong>Financeiro simples</strong>
                        <p>
                          Monitore pagamentos e evite inadimplência com
                          facilidade.
                        </p>
                      </div>
                    </article>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.segments} id="para-quem">
            <div className={`${styles.container} ${styles.center}`}>
              <span
                className={`${styles.sectionBadge} ${styles.reveal}`}
                data-reveal
              >
                Ecossistema
              </span>
              <h2
                className={`${styles.sectionTitleCenter} ${styles.reveal} ${styles.delay100}`}
                data-reveal
              >
                Feito para quem cuida de pessoas.
              </h2>
              <p
                className={`${styles.sectionTextCenter} ${styles.reveal} ${styles.delay200}`}
                data-reveal
              >
                Uma solução robusta e escalável para profissionais que prezam
                por uma imagem corporativa e máxima organização.
              </p>

              <div className={styles.segmentGrid}>
                <article
                  className={`${styles.segmentCard} ${styles.reveal} ${styles.delay100}`}
                  data-reveal
                >
                  <MdFavorite aria-hidden="true" />
                  <span>Psicólogos</span>
                </article>
                <article
                  className={`${styles.segmentCard} ${styles.reveal} ${styles.delay150}`}
                  data-reveal
                >
                  <MdRestaurant aria-hidden="true" />
                  <span>Nutris</span>
                </article>
                <article
                  className={`${styles.segmentCard} ${styles.reveal} ${styles.delay200}`}
                  data-reveal
                >
                  <MdSpa aria-hidden="true" />
                  <span>Estética</span>
                </article>
                <article
                  className={`${styles.segmentCard} ${styles.reveal} ${styles.delay250}`}
                  data-reveal
                >
                  <MdSelfImprovement aria-hidden="true" />
                  <span>Terapias</span>
                </article>
                <article
                  className={`${styles.segmentCard} ${styles.reveal} ${styles.delay300}`}
                  data-reveal
                >
                  <MdMedicalServices aria-hidden="true" />
                  <span>Saúde</span>
                </article>
                <article
                  className={`${styles.segmentCard} ${styles.reveal} ${styles.delay350}`}
                  data-reveal
                >
                  <MdContentPasteSearch aria-hidden="true" />
                  <span>Coaching</span>
                </article>
              </div>
            </div>
          </section>

          <section className={styles.pricing} id="precos">
            <div className={styles.container}>
              <div className={styles.pricingHeader}>
                <span
                  className={`${styles.sectionBadge} ${styles.reveal}`}
                  data-reveal
                >
                  Planos
                </span>
                <h2
                  className={`${styles.pricingTitle} ${styles.reveal} ${styles.delay100}`}
                  data-reveal
                >
                  Investimento em qualidade.
                </h2>
                <p
                  className={`${styles.sectionTextCenter} ${styles.reveal} ${styles.delay200}`}
                  data-reveal
                >
                  Escolha o plano ideal para escalar seu atendimento com
                  segurança e tecnologia.
                </p>
              </div>

              <div className={styles.pricingGrid}>
                <article
                  className={`${styles.planCard} ${styles.reveal}`}
                  data-reveal
                >
                  <div className={styles.planIntro}>
                    <h3>Plano SOLO</h3>
                    <div className={styles.price}>
                      <strong>R$ 44,90</strong>
                      <span>/ mês</span>
                    </div>
                  </div>

                  <ul>
                    <li>
                      <MdCheckCircle aria-hidden="true" />
                      Tudo em um único lugar
                    </li>
                    <li>
                      <MdCheckCircle aria-hidden="true" />
                      Feito para quem atende sozinho
                    </li>
                    <li>
                      <MdCheckCircle aria-hidden="true" />
                      Simples desde o primeiro uso
                    </li>
                  </ul>

                  <a
                    className={styles.planButton}
                    href={whatsappPlanoSolo}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Quero conhecer
                  </a>
                </article>

                <article
                  className={`${styles.planCard} ${styles.planFeatured} ${styles.reveal} ${styles.delay200}`}
                  data-reveal
                >
                  <div className={styles.planBadge}>
                    PROFISSIONAL + SECRETARIA
                  </div>
                  <div className={styles.planIntro}>
                    <h3>Plano EQUIPE</h3>
                    <div className={styles.price}>
                      <strong>R$ 59,90</strong>
                      <span>/ mês</span>
                    </div>
                  </div>

                  <ul>
                    <li>
                      <MdVerified aria-hidden="true" />
                      Todos os recursos do Solo
                    </li>
                    <li>
                      <MdVerified aria-hidden="true" />
                      Você e sua secretaria
                    </li>
                    <li>
                      <MdVerified aria-hidden="true" />
                      Financeiro simplificado
                    </li>
                  </ul>

                  <a
                    className={styles.planButton}
                    href={whatsappPlanoEquipe}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Quero o plano EQUIPE
                  </a>
                </article>
              </div>
            </div>
          </section>

          <section className={styles.finalCta}>
            <div className={styles.container}>
              <div className={`${styles.ctaCard} ${styles.reveal}`} data-reveal>
                <div className={styles.ctaPattern} aria-hidden="true">
                  <svg
                    height="100%"
                    preserveAspectRatio="none"
                    viewBox="0 0 100 100"
                    width="100%"
                  >
                    <path d="M0 0 L100 0 L100 100 Z" fill="white" />
                  </svg>
                </div>
                <div className={styles.ctaCopy}>
                  <div className={styles.ctaBadge}>Transformação Digital</div>
                  <h2>
                    Sua rotina já é corrida. Sua organização não precisa ser.
                  </h2>
                  <p>
                    Migre hoje para o CONNEXI e experimente o nível de
                    organização que seu profissionalismo exige.
                  </p>
                  <div className={styles.ctaActions}>
                    <a
                      href={whatsappComercial}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MdChatBubble aria-hidden="true" />
                      Falar com Especialista
                    </a>
                    <a
                      href={whatsappComercial}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Tirar Dúvidas
                    </a>
                  </div>
                </div>

                <div className={styles.ctaVisual} aria-hidden="true">
                  <div>
                    <strong>100%</strong>
                    <span>Cloud Based</span>
                    <i />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <footer className={styles.footer}>
          <div className={styles.container}>
            <div className={styles.footerInner}>
              <a href="/" aria-label="CONNEXI" className={styles.footerLogo}>
                <BrandLogo size={32} />
              </a>

              <div className={styles.footerMeta}>
                <span>© 2026 CONNEXI. Todos os direitos reservados.</span>
                <a href={termosCompromissoUrl}>Termos</a>
                <a
                  href={whatsappComercial}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp
                </a>
              </div>

              <nav aria-label="Redes sociais" className={styles.footerSocials}>
                {instagramUrl ? (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram do CONNEXI"
                  >
                    <FaInstagram aria-hidden="true" />
                  </a>
                ) : null}
              </nav>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
