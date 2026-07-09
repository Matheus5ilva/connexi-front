import { useEffect, useState } from "react";
import {
  FaChevronLeft,
  FaEdit,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaShieldAlt,
  FaUser,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { CarregamentoCentral } from "../../../components/ui/carregamento-central";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout } from "../../../components/ui/page-layout";
import { StatusBadge } from "../../../components/ui/status-badge";
import { parseRouteNumericId } from "../../../schemas/runtime-input.schema";
import {
  secretariaService,
  toErrorMessage,
  type Secretaria,
} from "../../../services/api";
import styles from "../styles.module.css";

function exibirValor(valor?: string | number | null): string {
  if (valor === null || valor === undefined || valor === "") {
    return "-";
  }

  return String(valor);
}

function getCidadeResumo(secretaria: Secretaria): string {
  const cidade = secretaria.pessoa.cidade;
  const siglaEstado = cidade?.siglaEstado ?? cidade?.estado?.sigla;
  return [cidade?.nome, siglaEstado].filter(Boolean).join(" - ") || "-";
}

export function VisualizarSecretaria() {
  const navigate = useNavigate();
  const { id } = useParams();
  const secretariaId = parseRouteNumericId(id);
  const [secretaria, setSecretaria] = useState<Secretaria | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!secretariaId) {
      setErro("Secretária inválida.");
      setCarregando(false);
      return;
    }

    const idValido = secretariaId;
    let ativo = true;

    async function carregarSecretaria() {
      setCarregando(true);
      setErro(null);

      try {
        const encontrada = await secretariaService.buscarPorId(idValido);
        if (ativo) {
          setSecretaria(encontrada);
        }
      } catch (error) {
        if (ativo) {
          setErro(toErrorMessage(error, "Não foi possível carregar a secretária."));
          setSecretaria(null);
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    void carregarSecretaria();

    return () => {
      ativo = false;
    };
  }, [secretariaId]);

  if (carregando) {
    return (
      <PageLayout>
        <CarregamentoCentral />
      </PageLayout>
    );
  }

  if (!secretaria) {
    return (
      <PageLayout>
        <section className={styles.feedbackCard} role="alert">
          <p className={styles.feedbackError}>
            {erro ?? "Secretária não encontrada."}
          </p>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => navigate("/secretarias")}
          >
            Voltar
          </button>
        </section>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="Secretária"
        subtitle={secretaria.pessoa.nome}
        left={
          <div className={styles.titleWithBack}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => navigate("/secretarias")}
              aria-label="Voltar para a lista de secretárias"
            >
              <FaChevronLeft />
            </button>
            <div>
              <h1 className={styles.pageTitle}>{secretaria.pessoa.nome}</h1>
              <p className={styles.pageSubtitle}>Dados da secretária</p>
            </div>
          </div>
        }
        right={
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => navigate(`/secretarias/${secretaria.id}/editar`)}
          >
            <FaEdit />
            Editar
          </button>
        }
      />

      <section className={styles.kpiGrid} aria-label="Resumo da secretária">
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Status</span>
          <div className={styles.kpiBadge}>
            <StatusBadge
              label={secretaria.ativo ? "Ativa" : "Inativa"}
              variant={secretaria.ativo ? "success" : "danger"}
            />
          </div>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Financeiro</span>
          <strong className={styles.kpiValue}>
            {secretaria.podeAcessarFinanceiro ? "Liberado" : "Bloqueado"}
          </strong>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Cidade</span>
          <strong className={styles.kpiValue}>{getCidadeResumo(secretaria)}</strong>
        </article>
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>
            <FaUser className={styles.sectionIcon} />
            Dados cadastrais
          </h2>
          <div className={styles.infoGrid}>
            <div>
              <span className={styles.infoLabel}>Nome</span>
              <p className={styles.infoValue}>{secretaria.pessoa.nome}</p>
            </div>
            <div>
              <span className={styles.infoLabel}>Status</span>
              <p className={styles.infoValue}>
                {secretaria.ativo ? "Ativa" : "Inativa"}
              </p>
            </div>
            <div className={styles.colSpan2}>
              <span className={styles.infoLabel}>E-mail de acesso</span>
              <p className={styles.infoValue}>
                {exibirValor(secretaria.pessoa.contato.email)}
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
              <span className={styles.infoLabel}>Telefone</span>
              <p className={styles.infoValue}>
                {exibirValor(secretaria.pessoa.contato.telefone)}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>WhatsApp</span>
              <p className={styles.infoValue}>
                {exibirValor(secretaria.pessoa.contato.whatsapp)}
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
                {exibirValor(secretaria.pessoa.endereco?.cep)}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>Bairro</span>
              <p className={styles.infoValue}>
                {exibirValor(secretaria.pessoa.endereco?.bairro)}
              </p>
            </div>
            <div className={styles.colSpan2}>
              <span className={styles.infoLabel}>Logradouro</span>
              <p className={styles.infoValue}>
                {[
                  secretaria.pessoa.endereco?.logradouro,
                  secretaria.pessoa.endereco?.numero?.toString(),
                ]
                  .filter(Boolean)
                  .join(", ") || "-"}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>Complemento</span>
              <p className={styles.infoValue}>
                {exibirValor(secretaria.pessoa.endereco?.complemento)}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>Cidade</span>
              <p className={styles.infoValue}>{getCidadeResumo(secretaria)}</p>
            </div>
          </div>
        </section>

        <section className={`${styles.sectionCard} ${styles.colSpan2}`}>
          <h2 className={styles.sectionTitle}>
            <FaShieldAlt className={styles.sectionIcon} />
            Acesso e permissões
          </h2>
          <div className={styles.infoGrid}>
            <div>
              <span className={styles.infoLabel}>Financeiro</span>
              <p className={styles.infoValue}>
                {secretaria.podeAcessarFinanceiro ? "Liberado" : "Bloqueado"}
              </p>
            </div>
            <div>
              <span className={styles.infoLabel}>Troca de senha</span>
              <p className={styles.infoValue}>
                {secretaria.deveTrocarSenha ? "Pendente" : "Não pendente"}
              </p>
            </div>
            <div className={styles.colSpan2}>
              <span className={styles.infoLabel}>Acesso clínico</span>
              <p className={styles.infoValue}>
                Bloqueado para histórico, prontuários e atendimentos clínicos.
              </p>
            </div>
          </div>
        </section>

      </div>
    </PageLayout>
  );
}
