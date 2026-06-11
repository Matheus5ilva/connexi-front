import {
  FaArrowRight,
  FaCalendarCheck,
  FaChartLine,
  FaCheck,
  FaClipboardList,
  FaWhatsapp,
  FaInstagram,
  FaTwitter,
  FaUserAlt,
  FaSpa,
  FaHeart,
} from "react-icons/fa";
import { FaLeaf } from "react-icons/fa6";
import { BrandLogo } from "../../components/brand-logo";
import styles from "./styles.module.css";

const whatsappContratar =
  "https://wa.me/5538988499084?text=Ol%C3%A1%2C%20quero%20conhecer%20o%20CONNEXI.";

const whatsappDuvidas =
  "https://wa.me/5538988499084?text=Ol%C3%A1%2C%20tenho%20algumas%20d%C3%BAvidas%20sobre%20o%20CONNEXI.";

export function PaginaInicialPublica() {
  return (
    <>
      <main className={styles.page}>
        <section className={styles.hero}>
          <header className={styles.header}>
            <BrandLogo className={styles.brand} size={30} />

            <a
              href={whatsappDuvidas}
              target="_blank"
              className={styles.headerLink}
            >
              Tirar dúvidas
            </a>
          </header>

          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <span className={styles.badge}>
                Sistema para saúde e bem-estar
              </span>

              <h1>Organize seus atendimentos em um só lugar</h1>

              <p>
                Agenda, clientes, histórico de atendimentos e financeiro para
                profissionais de saúde e bem-estar.
              </p>

              <div className={styles.heroActions}>
                <a
                  href={whatsappContratar}
                  target="_blank"
                  className={styles.primaryButton}
                >
                  <FaWhatsapp />
                  Quero conhecer
                </a>

                <a
                  href={whatsappDuvidas}
                  target="_blank"
                  className={styles.secondaryButton}
                >
                  Tirar dúvidas
                  <FaArrowRight />
                </a>
              </div>

              <div className={styles.trustRow}>
                <span>
                  <FaCheck /> Tudo em um único lugar
                </span>
                <span>
                  <FaCheck /> Feito para quem atende sozinho
                </span>
                <span>
                  <FaCheck /> Simples desde o primeiro uso
                </span>
              </div>
            </div>

            <div
              className={styles.productPreview}
              aria-label="Prévia do sistema"
            >
              <div className={styles.previewTop}>
                <div>
                  <small>Resumo de hoje</small>
                  <strong>8 atendimentos</strong>
                </div>
                <span>Organizado</span>
              </div>

              <div className={styles.previewCards}>
                <article>
                  <FaCalendarCheck />
                  <span>Próximo atendimento</span>
                  <strong>10:30</strong>
                </article>

                <article>
                  <FaChartLine />
                  <span>Recebido no mês</span>
                  <strong>R$ 4.680</strong>
                </article>
              </div>

              <div className={styles.previewList}>
                <div>
                  <span>Maria Souza</span>
                  <strong className={styles.statusSuccess}>Confirmado</strong>
                </div>
                <div>
                  <span>João Lima</span>
                  <strong className={styles.statusWarning}>Pendente</strong>
                </div>
                <div>
                  <span>Ana Costa</span>
                  <strong className={styles.statusInfo}>Em atendimento</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.problemSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.eyebrow}>O problema</span>
            <h2>Seu trabalho não deveria ficar espalhado.</h2>
            <p>
              Quando tudo fica em lugares diferentes, sua rotina fica mais
              cansativa e difícil de acompanhar entre um atendimento e outro.
            </p>
          </div>

          <div className={styles.problemGrid}>
            <article>
              <span>01</span>
              <h3>Agenda separada</h3>
              <p>
                Você marca atendimentos em um lugar e controla clientes em
                outro.
              </p>
            </article>

            <article>
              <span>02</span>
              <h3>Histórico espalhado</h3>
              <p>
                Informações importantes acabam ficando em anotações, arquivos ou
                conversas.
              </p>
            </article>

            <article>
              <span>03</span>
              <h3>Financeiro manual</h3>
              <p>
                Recebimentos e pendências dependem de planilhas difíceis de
                manter.
              </p>
            </article>
          </div>
        </section>

        <section className={styles.solutionSection}>
          <div className={styles.solutionCard}>
            <div className={styles.solutionContent}>
              <span className={styles.eyebrow}>A solução</span>
              <h2>Uma rotina mais profissional em poucos cliques.</h2>
              <p>
                O CONNEXI centraliza o essencial para você atender melhor,
                acompanhar seus clientes e cuidar da organização do seu
                trabalho com mais clareza.
              </p>
            </div>

            <div className={styles.featureGrid}>
              <article>
                <FaCalendarCheck />
                <h3>Agenda inteligente</h3>
                <p>Controle seus atendimentos de forma simples e visual.</p>
              </article>

              <article>
                <FaClipboardList />
                <h3>Cadastro organizado</h3>
                <p>Tenha clientes, contatos e histórico sempre à mão.</p>
              </article>

              <article>
                <FaHeart />
                <h3>Histórico organizado</h3>
                <p>Registre informações importantes de cada atendimento.</p>
              </article>

              <article>
                <FaChartLine />
                <h3>Financeiro simplificado</h3>
                <p>Acompanhe recebidos, pendentes e atrasados com clareza.</p>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.audienceSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.eyebrow}>Para quem é</span>
            <h2>Feito para profissionais que atendem pessoas.</h2>
            <p>
              Uma solução simples para quem trabalha com hora marcada e precisa
              organizar agenda, clientes, histórico e financeiro sem
              complicação.
            </p>
          </div>

          <div className={styles.audienceGrid}>
            <article>
              <FaHeart /> Psicólogos
            </article>
            <article>
              <FaUserAlt /> Nutricionistas
            </article>
            <article>
              <FaSpa /> Esteticistas
            </article>
            <article>
              <FaLeaf /> Massoterapeutas
            </article>
            <article>
              <FaUserAlt /> Acupunturistas
            </article>
            <article>
              <FaClipboardList /> Terapeutas
            </article>
          </div>
        </section>

        <section className={styles.finalCta}>
          <div className={styles.finalCtaContent}>
            <span className={styles.badgeDark}>Comece com simplicidade</span>
            <h2>Sua rotina já é corrida. Sua organização não precisa ser.</h2>
            <p>
              Fale pelo WhatsApp e veja como o CONNEXI pode ajudar sua rotina
              de atendimentos a sair das planilhas.
            </p>

            <div className={styles.heroActions}>
              <a
                href={whatsappContratar}
                target="_blank"
                className={styles.primaryButton}
              >
                <FaWhatsapp />
                Solicitar acesso
              </a>

              <a
                href={whatsappDuvidas}
                target="_blank"
                className={styles.finalSecondaryButton}
              >
                Quero tirar dúvidas
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <strong>CONNEXI</strong>
            <span>Sistema simples para profissionais de saúde e bem-estar</span>
          </div>

          <div className={styles.footerSocial}>
            <a
              href="https://instagram.com"
              target="_blank"
              aria-label="Instagram"
            >
              <FaInstagram />
            </a>

            <a href="https://twitter.com" target="_blank" aria-label="Twitter">
              <FaTwitter />
            </a>
          </div>
        </div>

        <div className={styles.footerBottom}>
          © {new Date().getFullYear()} CONNEXI. Todos os direitos reservados.
        </div>
      </footer>
    </>
  );
}
