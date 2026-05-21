import { useEffect, useState } from "react";
import { FaEdit, FaIdCard, FaMapMarkerAlt, FaPhoneAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { NotFoundCard } from "../../components/ui/not-found-card";
import { PageHeader } from "../../components/ui/page-header";
import { PageLayout } from "../../components/ui/page-layout";
import { CarregamentoCentral } from "../../components/ui/carregamento-central";
import { toErrorMessage, type Profissional } from "../../services/api";
import { carregarProfissionalPrincipal } from "./utils/carregar-profissional-principal";
import styles from "./styles.module.css";

function formatarStatus(ativo: boolean): string {
  return ativo ? "Ativo" : "Inativo";
}

export function Profissionais() {
  const navigate = useNavigate();
  const [profissional, setProfissional] = useState<Profissional | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProfissional() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const fetched = await carregarProfissionalPrincipal();

        if (!isMounted) {
          return;
        }

        setProfissional(fetched);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setLoadError(
          toErrorMessage(
            error,
            "Não foi possível carregar o perfil profissional.",
          ),
        );
        setProfissional(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProfissional();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <PageLayout>
        <CarregamentoCentral />
      </PageLayout>
    );
  }

  if (!profissional) {
    return (
      <PageLayout>
        <NotFoundCard
          title={
            loadError
              ? "Falha ao carregar o perfil profissional"
              : "Perfil profissional não encontrado"
          }
          description={
            loadError ??
            "Não encontramos um profissional cadastrado neste ambiente."
          }
          actionLabel="Tentar novamente"
          onAction={() => window.location.reload()}
        />
      </PageLayout>
    );
  }

  const especialidadeNome =
    profissional.especialidadeDetalhe?.nome ??
    profissional.especialidade ??
    "Não informada";

  const endereco = profissional.pessoa.endereco;
  const cidade = profissional.pessoa.cidade;

  return (
    <PageLayout>
      <PageHeader
        title="Meu perfil profissional"
        subtitle="Dados principais do profissional responsável pelo atendimento"
        right={
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => navigate("/profissional/editar")}
          >
            <FaEdit />
            <span>Editar perfil</span>
          </button>
        }
      />

      <section
        className={styles.kpiGrid}
        aria-label="Resumo do perfil profissional"
      >
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Status</span>
          <strong
            className={`${styles.statusBadge} ${
              profissional.ativo
                ? styles.statusBadgeAtivo
                : styles.statusBadgeInativo
            }`}
          >
            {formatarStatus(profissional.ativo)}
          </strong>
        </article>

        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Especialidade</span>
          <strong className={styles.kpiValue}>{especialidadeNome}</strong>
        </article>

        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Conselho</span>
          <strong className={styles.kpiValue}>
            {profissional.conselho ?? "Não informado"}
          </strong>
        </article>
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>
            <FaIdCard className={styles.sectionIcon} />
            Dados principais
          </h2>

          <div className={styles.infoGrid}>
            <div>
              <span className={styles.infoLabel}>Nome</span>
              <p className={styles.infoValue}>{profissional.nome}</p>
            </div>

            <div>
              <span className={styles.infoLabel}>Tipo profissional</span>
              <p className={styles.infoValue}>
                {profissional.tipoProfissional ?? "Não informado"}
              </p>
            </div>

            <div>
              <span className={styles.infoLabel}>Número de registro</span>
              <p className={styles.infoValue}>
                {profissional.numeroRegistro ?? "Não informado"}
              </p>
            </div>

            <div>
              <span className={styles.infoLabel}>Especialidade</span>
              <p className={styles.infoValue}>{especialidadeNome}</p>
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
                {profissional.pessoa.contato.email ?? "Não informado"}
              </p>
            </div>

            <div>
              <span className={styles.infoLabel}>Telefone</span>
              <p className={styles.infoValue}>
                {profissional.pessoa.contato.telefone ?? "Não informado"}
              </p>
            </div>

            <div className={styles.colSpan2}>
              <span className={styles.infoLabel}>WhatsApp</span>
              <p className={styles.infoValue}>
                {profissional.pessoa.contato.whatsapp ?? "Não informado"}
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
              <p className={styles.infoValue}>{endereco?.cep || "-"}</p>
            </div>

            <div className={styles.colSpan2}>
              <span className={styles.infoLabel}>Logradouro</span>
              <p className={styles.infoValue}>{endereco?.logradouro || "-"}</p>
            </div>

            <div>
              <span className={styles.infoLabel}>Número</span>
              <p className={styles.infoValue}>{endereco?.numero ?? "-"}</p>
            </div>

            <div>
              <span className={styles.infoLabel}>Complemento</span>
              <p className={styles.infoValue}>{endereco?.complemento || "-"}</p>
            </div>

            <div>
              <span className={styles.infoLabel}>Bairro</span>
              <p className={styles.infoValue}>{endereco?.bairro || "-"}</p>
            </div>

            <div>
              <span className={styles.infoLabel}>Cidade</span>
              <p className={styles.infoValue}>{cidade?.nome || "-"}</p>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
