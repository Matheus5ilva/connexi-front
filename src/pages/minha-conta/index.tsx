import { useEffect, useMemo, useState } from "react";
import { FaLock, FaUserCog } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { encerrarSessaoAutenticada } from "../../auth/session";
import { PageHeader } from "../../components/ui/page-header";
import { PageLayout } from "../../components/ui/page-layout";
import { CarregamentoCentral } from "../../components/ui/carregamento-central";
import type { AlterarSenhaFormularioData } from "../../schemas/alterar-senha.schema";
import { resolveReturnTo } from "../../routes/return-to";
import {
  authService,
  mapFormularioAlterarSenhaParaRequest,
  toErrorMessage,
  type MinhaConta,
} from "../../services/api";
import { FormularioAlterarSenha } from "./components/formulario-alterar-senha";
import styles from "./styles.module.css";

const perfilLabels: Record<MinhaConta["perfil"], string> = {
  MASTER: "Mestre",
  PROFISSIONAL: "Profissional",
};

function formatarDataHora(value?: string | null): string {
  if (!value) {
    return "Não registrado";
  }

  const data = new Date(value);
  if (Number.isNaN(data.getTime())) {
    return "Não registrado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}

export function MinhaContaPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = resolveReturnTo(location, "/");
  const [minhaConta, setMinhaConta] = useState<MinhaConta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadCounter, setReloadCounter] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function carregarMinhaConta() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const conta = await authService.buscarMinhaConta();

        if (!isMounted) {
          return;
        }

        setMinhaConta(conta);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setMinhaConta(null);
        setLoadError(
          toErrorMessage(error, "Não foi possível carregar os dados da conta."),
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void carregarMinhaConta();

    return () => {
      isMounted = false;
    };
  }, [reloadCounter]);

  const dadosConta = useMemo(() => {
    if (!minhaConta) {
      return [];
    }

    return [
      { label: "Nome", value: minhaConta.nome },
      { label: "E-mail", value: minhaConta.email },
      { label: "Perfil", value: perfilLabels[minhaConta.perfil] },
      {
        label: "Último login",
        value: formatarDataHora(minhaConta.ultimoLoginEm),
      },
    ];
  }, [minhaConta]);

  async function handleAlterarSenha(values: AlterarSenhaFormularioData) {
    await authService.alterarSenha(
      mapFormularioAlterarSenhaParaRequest(values),
    );

    encerrarSessaoAutenticada();
    navigate("/login", {
      replace: true,
      state: {
        mensagemSucesso:
          "Senha alterada com sucesso. Faça login novamente para continuar.",
        returnTo,
      },
    });
  }

  return (
    <PageLayout>
      <PageHeader
        title="Minha Conta"
        subtitle="Consulte os dados da sua conta e atualize sua senha com segurança."
      />

      {isLoading ? (
        <CarregamentoCentral />
      ) : loadError ? (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Falha ao carregar a conta</h2>
          <p className={styles.cardDescription}>{loadError}</p>
          <div className={styles.actionRow}>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => setReloadCounter((value) => value + 1)}
            >
              Tentar novamente
            </button>
          </div>
        </section>
      ) : !minhaConta ? (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Conta não disponível</h2>
          <p className={styles.cardDescription}>
            Não foi possível recuperar os dados da conta no momento.
          </p>
        </section>
      ) : (
        <div className={styles.contentGrid}>
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>
              <FaUserCog className={styles.sectionIcon} />
              Dados da conta
            </h2>

            {minhaConta.deveTrocarSenha && (
              <p className={styles.warningBanner}>
                Sua conta ainda exige troca obrigatória de senha. Atualize a
                senha abaixo para liberar o acesso completo.
              </p>
            )}

            <div className={styles.infoGrid}>
              {dadosConta.map((item) => (
                <div key={item.label}>
                  <span className={styles.infoLabel}>{item.label}</span>
                  <p className={styles.infoValue}>{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>
              <FaLock className={styles.sectionIcon} />
              Segurança
            </h2>
            <p className={styles.cardDescription}>
              Para manter sua conta protegida, confirme a senha atual e defina
              uma nova senha.
            </p>

            <FormularioAlterarSenha
              submitLabel="Alterar senha"
              onSubmit={handleAlterarSenha}
            />
          </section>
        </div>
      )}
    </PageLayout>
  );
}


