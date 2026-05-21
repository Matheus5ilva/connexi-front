import { useEffect, useMemo, useState } from "react";
import {
  FaBuilding,
  FaEdit,
  FaIdCard,
  FaMapMarkerAlt,
  FaPhoneAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/ui/page-header";
import { PageLayout } from "../../components/ui/page-layout";
import { CarregamentoCentral } from "../../components/ui/carregamento-central";
import {
  consultorioService,
  toErrorMessage,
  type Consultorio as ConsultorioDetalhe,
} from "../../services/api";
import styles from "./styles.module.css";

function getCidadeResumo(consultorio: ConsultorioDetalhe): string {
  const cidade = consultorio.pessoa.cidade;
  const siglaEstado = cidade?.siglaEstado ?? cidade?.estado?.sigla;
  return (
    [cidade?.nome, siglaEstado].filter(Boolean).join(" - ") || "Não informado"
  );
}

function getTextoOuPadrao(value?: string | null): string {
  const texto = value?.trim();
  return texto ? texto : "Não informado";
}

function getStatusLabel(ativo: boolean): string {
  return ativo ? "Ativo" : "Inativo";
}

export function Consultorio() {
  const navigate = useNavigate();
  const [consultorio, setConsultorio] = useState<ConsultorioDetalhe | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadCounter, setReloadCounter] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function carregarConsultorio() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const consultorioAtual = await consultorioService.buscarPrincipal();

        if (!isMounted) {
          return;
        }

        setConsultorio(consultorioAtual);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setConsultorio(null);
        setLoadError(
          toErrorMessage(error, "Não foi possível carregar o consultório."),
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void carregarConsultorio();

    return () => {
      isMounted = false;
    };
  }, [reloadCounter]);

  const pageAction = (
    <button
      type="button"
      className={styles.btnPrimary}
      onClick={() => navigate("/consultorio/editar")}
    >
      <FaEdit />
      <span>
        {consultorio ? "Editar consultório" : "Cadastrar consultório"}
      </span>
    </button>
  );

  const cidadeResumo = useMemo(
    () => (consultorio ? getCidadeResumo(consultorio) : "Não informado"),
    [consultorio],
  );

  return (
    <PageLayout>
      <PageHeader
        title="Consultório"
        subtitle="Consulte e mantenha atualizados os dados principais do consultório."
        right={pageAction}
      />

      {isLoading ? (
        <CarregamentoCentral />
      ) : loadError ? (
        <section className={styles.emptyCard}>
          <h2 className={styles.emptyTitle}>Falha ao carregar o consultório</h2>
          <p className={styles.emptyDescription}>{loadError}</p>
          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => setReloadCounter((value) => value + 1)}
            >
              Tentar novamente
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => navigate("/consultorio/editar")}
            >
              Ir para edição
            </button>
          </div>
        </section>
      ) : !consultorio ? (
        <section className={styles.emptyCard}>
          <h2 className={styles.emptyTitle}>Nenhum consultório cadastrado</h2>
          <p className={styles.emptyDescription}>
            Cadastre o consultório principal para completar o perfil da
            operação.
          </p>
          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => navigate("/consultorio/editar")}
            >
              Cadastrar consultório
            </button>
          </div>
        </section>
      ) : (
        <>
          <section
            className={styles.kpiGrid}
            aria-label="Resumo do consultório"
          >
            <article className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Status</span>
              <strong
                className={`${styles.statusBadge} ${
                  consultorio.ativo
                    ? styles.statusBadgeAtivo
                    : styles.statusBadgeInativo
                }`}
              >
                {getStatusLabel(consultorio.ativo)}
              </strong>
            </article>
            <article className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Cidade principal</span>
              <strong className={styles.kpiValue}>{cidadeResumo}</strong>
            </article>
            <article className={styles.kpiCard}>
              <span className={styles.kpiLabel}>CNPJ</span>
              <strong className={styles.kpiValue}>
                {getTextoOuPadrao(consultorio.cnpj)}
              </strong>
            </article>
          </section>

          <div className={styles.contentGrid}>
            <section className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>
                <FaBuilding className={styles.sectionIcon} />
                Dados principais
              </h2>
              <div className={styles.infoGrid}>
                <div>
                  <span className={styles.infoLabel}>Nome do consultório</span>
                  <p className={styles.infoValue}>{consultorio.pessoa.nome}</p>
                </div>
                <div>
                  <span className={styles.infoLabel}>Status</span>
                  <p className={styles.infoValue}>
                    {getStatusLabel(consultorio.ativo)}
                  </p>
                </div>
                <div>
                  <span className={styles.infoLabel}>Razão social</span>
                  <p className={styles.infoValue}>
                    {getTextoOuPadrao(consultorio.razaoSocial)}
                  </p>
                </div>
                <div>
                  <span className={styles.infoLabel}>CNPJ</span>
                  <p className={styles.infoValue}>
                    {getTextoOuPadrao(consultorio.cnpj)}
                  </p>
                </div>
              </div>
            </section>

            <section className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>
                <FaPhoneAlt className={styles.sectionIcon} />
                Contato
              </h2>
              <div className={styles.infoGrid}>
                <div>
                  <span className={styles.infoLabel}>E-mail</span>
                  <p className={styles.infoValue}>
                    {getTextoOuPadrao(consultorio.pessoa.contato.email)}
                  </p>
                </div>
                <div>
                  <span className={styles.infoLabel}>Telefone</span>
                  <p className={styles.infoValue}>
                    {getTextoOuPadrao(consultorio.pessoa.contato.telefone)}
                  </p>
                </div>
                <div className={styles.colSpan2}>
                  <span className={styles.infoLabel}>WhatsApp</span>
                  <p className={styles.infoValue}>
                    {getTextoOuPadrao(consultorio.pessoa.contato.whatsapp)}
                  </p>
                </div>
              </div>
            </section>

            <section className={`${styles.sectionCard} ${styles.colSpan2}`}>
              <h2 className={styles.sectionTitle}>
                <FaMapMarkerAlt className={styles.sectionIcon} />
                Endereço
              </h2>
              <div className={styles.infoGrid}>
                <div>
                  <span className={styles.infoLabel}>CEP</span>
                  <p className={styles.infoValue}>
                    {getTextoOuPadrao(consultorio.pessoa.endereco?.cep)}
                  </p>
                </div>
                <div>
                  <span className={styles.infoLabel}>Bairro</span>
                  <p className={styles.infoValue}>
                    {getTextoOuPadrao(consultorio.pessoa.endereco?.bairro)}
                  </p>
                </div>
                <div className={styles.colSpan2}>
                  <span className={styles.infoLabel}>Logradouro</span>
                  <p className={styles.infoValue}>
                    {[
                      consultorio.pessoa.endereco?.logradouro,
                      consultorio.pessoa.endereco?.numero?.toString(),
                    ]
                      .filter(Boolean)
                      .join(", ") || "Não informado"}
                  </p>
                </div>
                <div>
                  <span className={styles.infoLabel}>Complemento</span>
                  <p className={styles.infoValue}>
                    {getTextoOuPadrao(consultorio.pessoa.endereco?.complemento)}
                  </p>
                </div>
                <div>
                  <span className={styles.infoLabel}>Cidade</span>
                  <p className={styles.infoValue}>{cidadeResumo}</p>
                </div>
              </div>
            </section>

            <section className={`${styles.sectionCard} ${styles.colSpan2}`}>
              <h2 className={styles.sectionTitle}>
                <FaIdCard className={styles.sectionIcon} />
                Orientações cadastrais
              </h2>
              <p className={styles.notesText}>
                Mantenha os dados do consultório sempre atualizados para
                garantir consistência nas operações administrativas e no uso
                diário do sistema.
              </p>
            </section>
          </div>
        </>
      )}
    </PageLayout>
  );
}
