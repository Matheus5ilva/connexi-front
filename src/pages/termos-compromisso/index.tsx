import { useEffect, useState } from "react";
import { FaArrowLeft, FaFileSignature } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { BrandLogo } from "../../components/brand-logo";
import { APP_PRODUCTION_SITE_URL, APP_SITE_URL } from "../../config/version";
import styles from "./styles.module.css";

const UPDATE_DATE_LABEL = "16/04/2026";
const TERMOS_CANONICAL = `${APP_PRODUCTION_SITE_URL}/termos-e-compromisso`;
const LINKS_PUBLICOS = {
  home: `${APP_SITE_URL}/`,
  problema: `${APP_SITE_URL}/#problema`,
  solucao: `${APP_SITE_URL}/#solucao`,
  paraQuem: `${APP_SITE_URL}/#para-quem`,
  precos: `${APP_SITE_URL}/#precos`,
  termos: `${APP_SITE_URL}/termos-e-compromisso`,
} as const;
const NUMERO_WHATSAPP_PADRAO = "5531984505916";
const NUMERO_WHATSAPP = (
  import.meta.env.VITE_SUPPORT_WHATSAPP_NUMBER || NUMERO_WHATSAPP_PADRAO
).replace(/\D/g, "");
const WHATSAPP_TERMO_URL = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(
  "Olá, tenho dúvidas sobre os Termos de uso, compromisso e proteção de dados do CONNEXI.",
)}`;

const indiceTermos = [
  { id: "objeto", label: "1. Objeto" },
  { id: "aceitacao-dos-termos", label: "2. Aceitação dos termos" },
  {
    id: "disponibilidade-e-descontinuacao",
    label: "3. Disponibilidade e descontinuação",
  },
  { id: "backup-exportacao-portabilidade", label: "4. Backup e portabilidade" },
  { id: "cancelamento-retencao-exclusao", label: "5. Cancelamento e dados" },
  { id: "pagamento-e-reembolso", label: "6. Pagamento e reembolso" },
  { id: "suporte-atendimento", label: "7. Suporte e atendimento" },
  { id: "desenvolvimento-customizacoes", label: "8. Desenvolvimento" },
  { id: "responsabilidade-do-usuario", label: "9. Responsabilidade do usuário" },
  { id: "protecao-de-dados-lgpd", label: "10. Proteção de dados e LGPD" },
  { id: "seguranca-da-informacao", label: "11. Segurança da informação" },
  { id: "incidentes-de-seguranca", label: "12. Incidentes de segurança" },
  { id: "limitacao-de-responsabilidade", label: "13. Limitação de responsabilidade" },
  { id: "uso-proibido", label: "14. Uso proibido" },
  { id: "nivel-de-servico", label: "15. Nível de serviço" },
  { id: "alteracoes-dos-termos", label: "16. Alterações dos termos" },
  { id: "foro", label: "17. Foro" },
  { id: "disposicoes-gerais", label: "18. Disposições gerais" },
];

function garantirMetaDescricao(content: string) {
  const metaExistente = document.querySelector<HTMLMetaElement>(
    'meta[name="description"]',
  );
  const metaDescription =
    metaExistente ?? document.createElement("meta");

  metaDescription.name = "description";
  metaDescription.content = content;

  if (!metaExistente) {
    document.head.appendChild(metaDescription);
  }

  return {
    created: !metaExistente,
    previousContent: metaExistente?.content ?? null,
  };
}

function garantirCanonical(href: string) {
  const linkExistente = document.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  const canonical = linkExistente ?? document.createElement("link");

  canonical.rel = "canonical";
  canonical.href = href;

  if (!linkExistente) {
    document.head.appendChild(canonical);
  }

  return {
    created: !linkExistente,
    previousHref: linkExistente?.href ?? null,
  };
}

export function TermosCompromissoPage() {
  const navigate = useNavigate();
  const [secaoAtiva, setSecaoAtiva] = useState(indiceTermos[0].id);

  useEffect(() => {
    const tituloAnterior = document.title;
    const metaAnterior = garantirMetaDescricao(
      "Termos de uso, compromisso e proteção de dados do CONNEXI para profissionais que usam a plataforma.",
    );
    const canonicalAnterior = garantirCanonical(TERMOS_CANONICAL);

    document.title = "Termos de uso, compromisso e proteção de dados | CONNEXI";

    return () => {
      document.title = tituloAnterior;

      const metaDescription = document.querySelector<HTMLMetaElement>(
        'meta[name="description"]',
      );
      if (metaDescription && metaAnterior.created) {
        metaDescription.remove();
      } else if (metaDescription && metaAnterior.previousContent !== null) {
        metaDescription.content = metaAnterior.previousContent;
      }

      const canonical = document.querySelector<HTMLLinkElement>(
        'link[rel="canonical"]',
      );
      if (canonical && canonicalAnterior.created) {
        canonical.remove();
      } else if (canonical && canonicalAnterior.previousHref !== null) {
        canonical.href = canonicalAnterior.previousHref;
      }
    };
  }, []);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      return;
    }

    const secoes = indiceTermos
      .map(({ id }) => document.getElementById(id))
      .filter((secao): secao is HTMLElement => Boolean(secao));

    const observer = new IntersectionObserver(
      (entradas) => {
        const entradaVisivel = entradas.find((entrada) => entrada.isIntersecting);

        if (entradaVisivel?.target.id) {
          setSecaoAtiva(entradaVisivel.target.id);
        }
      },
      {
        rootMargin: "-34% 0px -56% 0px",
        threshold: 0,
      },
    );

    secoes.forEach((secao) => observer.observe(secao));

    return () => observer.disconnect();
  }, []);

  function voltar() {
    let origemMesmoSite = false;

    try {
      origemMesmoSite = document.referrer
        ? new URL(document.referrer).origin === window.location.origin
        : false;
    } catch {
      origemMesmoSite = false;
    }

    if (window.history.length > 1 && origemMesmoSite) {
      navigate(-1);
      return;
    }

    navigate("/");
  }

  return (
    <div className={styles.page}>
      <header className={styles.siteHeader}>
        <div className={styles.headerInner}>
          <a
            className={styles.logoLink}
            href={LINKS_PUBLICOS.home}
            aria-label="CONNEXI"
          >
            <BrandLogo size={32} />
          </a>

          <nav className={styles.headerNav} aria-label="Navegação principal">
            <a href={LINKS_PUBLICOS.problema}>O Problema</a>
            <a href={LINKS_PUBLICOS.solucao}>A Solução</a>
            <a href={LINKS_PUBLICOS.paraQuem}>Para Quem</a>
            <a href={LINKS_PUBLICOS.precos}>Preços</a>
            <a aria-current="page" href={LINKS_PUBLICOS.termos}>
              Termos
            </a>
          </nav>

          <a className={styles.headerAction} href={WHATSAPP_TERMO_URL}>
            Tirar dúvidas
          </a>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero} aria-labelledby="termos-title">
          <div className={styles.heroContent}>
            <div className={styles.eyebrowRow}>
              <span className={styles.eyebrowDot} aria-hidden="true" />
              <span className={styles.eyebrow}>Documento jurídico</span>
            </div>

            <h1 className={styles.title} id="termos-title">
              Termos e Compromisso
            </h1>
            <p className={styles.subtitle}>
              Este documento apresenta as condições de uso da plataforma, regras
              de suporte, responsabilidades das partes, tratamento de dados
              conforme a LGPD, política de cancelamento, backup e limitações de
              responsabilidade.
            </p>
          </div>

          <div className={styles.heroMeta}>
            <p>Última atualização: {UPDATE_DATE_LABEL}</p>
            <button
              type="button"
              className={styles.backButton}
              aria-label="Voltar"
              onClick={voltar}
            >
              <FaArrowLeft aria-hidden="true" />
              <span>Voltar</span>
            </button>
          </div>
        </section>

        <div className={styles.documentLayout}>
          <aside className={styles.documentAside}>
            <nav
              className={styles.summaryNav}
              aria-label="Índice do documento"
            >
              <h2>Índice do documento</h2>
              <ol>
                {indiceTermos.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      aria-current={secaoAtiva === item.id ? "location" : undefined}
                      className={
                        secaoAtiva === item.id ? styles.summaryLinkActive : ""
                      }
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <article className={styles.contentCard}>
        <header className={styles.contentHeader}>
          <div className={styles.contentTitleRow}>
            <FaFileSignature className={styles.contentIcon} />
            <div>
              <h2 className={styles.contentTitle}>Condições gerais de uso</h2>
              <p className={styles.contentMeta}>
                Última atualização: {UPDATE_DATE_LABEL}
              </p>
            </div>
          </div>

          <p className={styles.contentIntro}>
            Ao acessar, contratar ou utilizar a plataforma, o usuário declara
            que leu, compreendeu e concorda integralmente com as condições
            abaixo. Caso não concorde com qualquer disposição, deverá
            interromper imediatamente o uso do sistema.
          </p>
        </header>

        <div className={styles.sectionList}>
          <section
            className={styles.section}
            id="objeto"
            aria-labelledby="objeto-title"
          >
            <h3 id="objeto-title">1. Objeto</h3>
            <p>
              A plataforma CONNEXI é um sistema de gestão disponibilizado em
              modelo SaaS, destinado ao apoio de rotinas administrativas,
              financeiras, cadastrais e operacionais de profissionais,
              consultórios, clínicas e negócios relacionados.
            </p>
            <p>
              O sistema atua como ferramenta de apoio à gestão, não substituindo
              avaliação profissional, conferência documental, análise contábil,
              orientação jurídica, responsabilidade técnica ou decisão final do
              usuário.
            </p>
          </section>

          <section
            className={styles.section}
            id="aceitacao-dos-termos"
            aria-labelledby="aceitacao-dos-termos-title"
          >
            <h3 id="aceitacao-dos-termos-title">2. Aceitação dos termos</h3>
            <p>
              O uso da plataforma representa aceite integral deste termo,
              incluindo regras de limitação de responsabilidade, suporte,
              cancelamento, retenção de dados, proteção de dados e condições de
              desenvolvimento sob demanda.
            </p>
            <p>
              A continuidade de uso após atualizações deste documento será
              considerada como concordância automática com as novas condições.
            </p>
          </section>

          <section
            className={styles.section}
            id="disponibilidade-e-descontinuacao"
            aria-labelledby="disponibilidade-e-descontinuacao-title"
          >
            <h3 id="disponibilidade-e-descontinuacao-title">
              3. Disponibilidade e descontinuação do serviço
            </h3>
            <p>
              A plataforma é disponibilizada no estado em que se encontra,
              podendo sofrer atualizações, manutenções, melhorias, alterações de
              funcionalidade, suspensões temporárias ou descontinuação total ou
              parcial a qualquer momento.
            </p>
            <p>
              A contratada não garante disponibilidade contínua e ininterrupta
              do sistema, podendo ocorrer indisponibilidades por manutenção,
              falhas técnicas, serviços de terceiros, internet, energia, cloud,
              força maior ou eventos fora de seu controle.
            </p>
            <p>
              A descontinuação do sistema não gera direito a indenização,
              compensação financeira, lucros cessantes, danos morais ou
              reembolso de valores já pagos.
            </p>
          </section>

          <section
            className={styles.section}
            id="backup-exportacao-portabilidade"
            aria-labelledby="backup-exportacao-portabilidade-title"
          >
            <h3 id="backup-exportacao-portabilidade-title">
              4. Backup, exportação e portabilidade dos dados
            </h3>
            <p>
              Em caso de descontinuação, cancelamento ou solicitação formal, o
              usuário poderá solicitar a exportação dos seus dados, respeitado o
              prazo de retenção previsto neste termo.
            </p>
            <p>
              O backup poderá ser disponibilizado em formato técnico padrão,
              como SQL, JSON, CSV ou outro formato definido pela contratada.
            </p>
            <p>
              A contratada não garante compatibilidade do backup com outros
              sistemas, nem se responsabiliza por importação, interpretação,
              tratamento posterior ou uso externo dos dados exportados.
            </p>
            <p>
              Após a entrega do backup, a guarda, armazenamento, segurança,
              tratamento e uso das informações passam a ser de responsabilidade
              exclusiva do usuário.
            </p>
          </section>

          <section
            className={styles.section}
            id="cancelamento-retencao-exclusao"
            aria-labelledby="cancelamento-retencao-exclusao-title"
          >
            <h3 id="cancelamento-retencao-exclusao-title">
              5. Cancelamento, retenção e exclusão dos dados
            </h3>
            <p>
              O usuário poderá solicitar o cancelamento do serviço a qualquer
              momento, sem cobrança de multa ou taxa de cancelamento.
            </p>
            <p>
              O cancelamento não gera direito a reembolso de valores já pagos,
              independentemente do tempo restante de uso, modalidade contratada
              ou motivo do cancelamento.
            </p>
            <p>
              Após o cancelamento, os dados poderão permanecer armazenados pelo
              prazo de até 6 (seis) meses, exclusivamente para eventual
              reativação, solicitação de backup, cumprimento legal ou segurança
              operacional.
            </p>
            <p>
              Após esse prazo, os dados poderão ser excluídos de forma
              definitiva e irreversível, sem possibilidade de recuperação.
            </p>
            <p>
              Durante o período de retenção, o acesso ao sistema poderá ser
              bloqueado, limitado ou condicionado à regularização contratual.
            </p>
          </section>

          <section
            className={styles.section}
            id="pagamento-e-reembolso"
            aria-labelledby="pagamento-e-reembolso-title"
          >
            <h3 id="pagamento-e-reembolso-title">
              6. Política de pagamento e reembolso
            </h3>
            <p>
              Os valores pagos pelo usuário remuneram a disponibilização,
              manutenção e uso da plataforma durante o período contratado.
            </p>
            <p>
              Não haverá reembolso de valores pagos em caso de cancelamento,
              desistência, não utilização do sistema, indisponibilidades
              pontuais, mudança de necessidade do usuário ou encerramento da
              contratação.
            </p>
          </section>

          <section
            className={styles.section}
            id="suporte-atendimento"
            aria-labelledby="suporte-atendimento-title"
          >
            <h3 id="suporte-atendimento-title">
              7. Suporte, atendimento e horário comercial
            </h3>
            <p>
              O suporte ao usuário será prestado exclusivamente em dias úteis e
              em horário comercial, conforme definido pela contratada.
            </p>
            <p>
              O canal oficial de atendimento será o WhatsApp ou outro canal
              indicado pela contratada.
            </p>
            <p>
              Não há obrigação de atendimento imediato, plantão, suporte em
              finais de semana, feriados, período noturno ou fora do horário
              comercial, salvo contratação específica em separado.
            </p>
            <p>
              O suporte compreende orientação de uso, esclarecimento de dúvidas,
              análise de eventuais inconsistências e apoio operacional dentro
              dos limites da plataforma contratada.
            </p>
          </section>

          <section
            className={styles.section}
            id="desenvolvimento-customizacoes"
            aria-labelledby="desenvolvimento-customizacoes-title"
          >
            <h3 id="desenvolvimento-customizacoes-title">
              8. Solicitações de desenvolvimento, melhorias e customizações
            </h3>
            <p>
              Toda solicitação de desenvolvimento, melhoria, nova
              funcionalidade, alteração de regra de negócio, integração,
              customização ou ajuste específico será previamente analisada pela
              contratada.
            </p>
            <p>
              A solicitação não implica obrigação de desenvolvimento,
              implementação, prazo de entrega ou inclusão automática no sistema.
            </p>
            <p>
              A contratada poderá aceitar, recusar, postergar ou priorizar
              solicitações conforme critérios técnicos, comerciais,
              estratégicos, financeiros e operacionais.
            </p>
            <p>
              Funcionalidades, integrações ou customizações solicitadas pelo
              usuário poderão ser cobradas separadamente, mediante orçamento,
              aceite formal e definição de prazo específico.
            </p>
          </section>

          <section
            className={styles.section}
            id="responsabilidade-do-usuario"
            aria-labelledby="responsabilidade-do-usuario-title"
          >
            <h3 id="responsabilidade-do-usuario-title">
              9. Responsabilidade do usuário
            </h3>
            <p>
              O usuário é integralmente responsável pela veracidade,
              atualização, legalidade e integridade das informações cadastradas
              no sistema, incluindo dados de pacientes, clientes, profissionais,
              agendamentos, atendimentos, documentos e informações financeiras.
            </p>
            <p>
              Também é responsabilidade do usuário obter autorizações,
              consentimentos, bases legais e permissões necessárias para coleta,
              armazenamento e tratamento dos dados inseridos na plataforma.
            </p>
            <p>
              O usuário deve manter suas credenciais protegidas e responderá por
              todos os atos praticados por sua conta, equipe, colaboradores,
              parceiros ou terceiros autorizados.
            </p>
          </section>

          <section
            className={styles.section}
            id="protecao-de-dados-lgpd"
            aria-labelledby="protecao-de-dados-lgpd-title"
          >
            <h3 id="protecao-de-dados-lgpd-title">
              10. Proteção de dados e LGPD
            </h3>
            <p>
              O tratamento de dados pessoais observará a Lei nº 13.709/2018, Lei
              Geral de Proteção de Dados Pessoais (LGPD), naquilo que for
              aplicável à relação entre as partes.
            </p>
            <p>
              Para fins de LGPD, o usuário será considerado controlador dos
              dados pessoais de seus pacientes, clientes, colaboradores e demais
              titulares cadastrados no sistema.
            </p>
            <p>
              A contratada atuará como operadora dos dados, tratando as
              informações conforme instruções do usuário, finalidades da
              plataforma, obrigações legais, segurança do serviço e execução do
              contrato.
            </p>
            <p>
              O usuário é responsável por informar os titulares, definir bases
              legais, obter consentimentos quando necessário e garantir que os
              dados inseridos no sistema sejam tratados de forma lícita.
            </p>
            <p>
              Os dados poderão ser armazenados em infraestrutura própria ou de
              terceiros, incluindo provedores de hospedagem, cloud, banco de
              dados, monitoramento, segurança, pagamento e comunicação,
              observadas medidas razoáveis de proteção.
            </p>
          </section>

          <section
            className={styles.section}
            id="seguranca-da-informacao"
            aria-labelledby="seguranca-da-informacao-title"
          >
            <h3 id="seguranca-da-informacao-title">
              11. Segurança da informação
            </h3>
            <p>
              A contratada adotará medidas técnicas e administrativas razoáveis
              para proteger os dados contra acessos não autorizados, perda,
              alteração indevida, vazamentos e destruição acidental.
            </p>
            <p>
              Tais medidas podem incluir controle de acesso, autenticação,
              backups, criptografia, monitoramento, segregação lógica de dados e
              boas práticas de desenvolvimento seguro.
            </p>
            <p>
              Nenhum sistema é absolutamente imune a falhas, ataques,
              indisponibilidades ou incidentes, não sendo possível garantir
              segurança total e permanente.
            </p>
          </section>

          <section
            className={styles.section}
            id="incidentes-de-seguranca"
            aria-labelledby="incidentes-de-seguranca-title"
          >
            <h3 id="incidentes-de-seguranca-title">
              12. Incidentes de segurança
            </h3>
            <p>
              Em caso de incidente de segurança relevante que possa acarretar
              risco ou dano aos titulares de dados, a contratada comunicará o
              usuário em prazo razoável, considerando a natureza do incidente,
              apuração técnica e medidas necessárias de contenção.
            </p>
            <p>
              A responsabilidade da contratada, quando aplicável, observará os
              limites previstos neste termo.
            </p>
          </section>

          <section
            className={styles.section}
            id="limitacao-de-responsabilidade"
            aria-labelledby="limitacao-de-responsabilidade-title"
          >
            <h3 id="limitacao-de-responsabilidade-title">
              13. Limitação de responsabilidade
            </h3>
            <p>
              A contratada não será responsável por perdas financeiras, danos
              indiretos, lucros cessantes, danos morais, interrupção de
              atividade, decisões tomadas com base no sistema, falhas de
              terceiros, mau uso da plataforma ou informações incorretas
              inseridas pelo usuário.
            </p>
            <p>
              A responsabilidade total da contratada, se comprovada, ficará
              limitada ao valor efetivamente pago pelo usuário nos últimos 12
              (doze) meses anteriores ao evento que originou a reclamação.
            </p>
            <p>
              A contratada não responderá por prejuízos decorrentes de uso
              indevido, compartilhamento de senha, ausência de conferência de
              dados, descumprimento legal pelo usuário ou utilização do sistema
              fora de sua finalidade.
            </p>
          </section>

          <section
            className={styles.section}
            id="uso-proibido"
            aria-labelledby="uso-proibido-title"
          >
            <h3 id="uso-proibido-title">14. Uso proibido</h3>
            <p>
              É proibido utilizar o sistema para fins ilícitos, fraudulentos,
              abusivos, discriminatórios, ofensivos, contrários à legislação ou
              que violem direitos de terceiros.
            </p>
            <p>
              Também é proibido tentar acessar dados de outros usuários,
              explorar vulnerabilidades, realizar engenharia reversa, copiar
              indevidamente o sistema, comprometer a infraestrutura ou utilizar
              a plataforma de forma incompatível com sua finalidade.
            </p>
          </section>

          <section
            className={styles.section}
            id="nivel-de-servico"
            aria-labelledby="nivel-de-servico-title"
          >
            <h3 id="nivel-de-servico-title">15. Nível de serviço</h3>
            <p>
              A plataforma poderá adotar disponibilidade estimada de até 95%
              mensal, salvo indisponibilidades causadas por manutenção, serviços
              de terceiros, falhas externas, caso fortuito, força maior ou mau
              uso pelo usuário.
            </p>
            <p>
              A indisponibilidade eventual do sistema não gera direito a
              reembolso, abatimento, indenização ou compensação financeira.
            </p>
          </section>

          <section
            className={styles.section}
            id="alteracoes-dos-termos"
            aria-labelledby="alteracoes-dos-termos-title"
          >
            <h3 id="alteracoes-dos-termos-title">
              16. Alterações dos termos
            </h3>
            <p>
              A contratada poderá atualizar este termo a qualquer momento para
              refletir mudanças no sistema, regras comerciais, exigências legais
              ou melhorias operacionais.
            </p>
            <p>
              A versão mais recente ficará disponível na plataforma, e a
              continuidade de uso representará concordância com as alterações.
            </p>
          </section>

          <section
            className={styles.section}
            id="foro"
            aria-labelledby="foro-title"
          >
            <h3 id="foro-title">17. Foro</h3>
            <p>
              Fica eleito o foro da comarca da contratada para dirimir eventuais
              dúvidas ou conflitos decorrentes deste termo, salvo disposição
              legal obrigatória em sentido contrário.
            </p>
          </section>

          <section
            className={styles.section}
            id="disposicoes-gerais"
            aria-labelledby="disposicoes-gerais-title"
          >
            <h3 id="disposicoes-gerais-title">18. Disposições gerais</h3>
            <p>
              Este termo constitui o acordo integral entre as partes quanto ao
              uso da plataforma.
            </p>
            <p>
              Caso qualquer cláusula seja considerada inválida ou inexequível,
              as demais permanecerão válidas e eficazes.
            </p>
          </section>
        </div>
          </article>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <a
            className={styles.footerLogo}
            href={LINKS_PUBLICOS.home}
            aria-label="CONNEXI"
          >
            <BrandLogo size={30} />
          </a>

          <div className={styles.footerLinks}>
            <a href={LINKS_PUBLICOS.home}>Página inicial</a>
            <a aria-current="page" href={LINKS_PUBLICOS.termos}>
              Termos
            </a>
            <a href={WHATSAPP_TERMO_URL}>
              WhatsApp
            </a>
          </div>

          <p>© 2026 CONNEXI. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
