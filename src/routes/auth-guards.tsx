import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import {
  atualizarContextoTenantAutenticado,
  encerrarSessaoAutenticada,
  obterUltimaRotaPrivada,
  possuiSessaoNoTenantAtual,
  salvarUltimaRotaPrivada,
} from "../auth/session";
import {
  obterDestinoPosLogin,
  rotaPodeSerUltimaRotaPrivada,
  usuarioPodeAcessarRota,
} from "../auth/permissoes-visuais";
import { CarregamentoCentral } from "../components/ui/carregamento-central";
import {
  apiConfig,
  ehErroTenantInexistente,
  tenantService,
  toErrorMessage,
} from "../services/api";
import { useSessaoAutenticada } from "../auth/use-auth-session";
import styles from "./auth-guards.module.css";

const ROTA_HOME = "/";
const ROTA_LOGIN = "/login";
const ROTA_ACESSO_NEGADO = "/acesso-negado";
const ROTA_MINHA_CONTA = "/configuracoes/minha-conta";
const ROTA_TENANT_INEXISTENTE = "/tenant-inexistente";

type EstadoValidacaoTenant = "validando" | "valido" | "inexistente" | "erro";

function TelaValidandoTenant() {
  return <CarregamentoCentral ocuparTelaInteira />;
}

function TelaErroValidacaoTenant({
  mensagem,
}: {
  mensagem: string;
}) {
  return (
    <main className={styles.telaValidacao}>
      <section className={styles.cartaoValidacao}>
        <h1 className={styles.tituloValidacao}>
          Não foi possível validar o endereço
        </h1>
        <p className={styles.textoValidacao}>{mensagem}</p>
        <button
          type="button"
          className={styles.botaoValidacao}
          onClick={() => window.location.reload()}
        >
          Tentar novamente
        </button>
      </section>
    </main>
  );
}

export function ValidarContextoTenant() {
  const location = useLocation();
  const { isAuthenticated, user } = useSessaoAutenticada();
  const [estadoValidacao, setEstadoValidacao] =
    useState<EstadoValidacaoTenant>("validando");
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const tenantIdSessao = user?.tenantId;

  const sessaoValidaNoTenantAtual = possuiSessaoNoTenantAtual({
    isAuthenticated,
    user,
  });
  const destinoTenantValido = sessaoValidaNoTenantAtual ? ROTA_HOME : ROTA_LOGIN;

  useEffect(() => {
    let ativo = true;

    async function validarTenant() {
      setEstadoValidacao("validando");
      setMensagemErro(null);

      try {
        if (isAuthenticated && tenantIdSessao) {
          atualizarContextoTenantAutenticado(await tenantService.obterAtual());
        } else {
          await tenantService.validarContextoAtual();
        }

        if (ativo) {
          setEstadoValidacao("valido");
        }
      } catch (error) {
        if (!ativo) {
          return;
        }

        if (ehErroTenantInexistente(error)) {
          setEstadoValidacao("inexistente");
          return;
        }

        setMensagemErro(
          toErrorMessage(
            error,
            "Não foi possível validar o endereço do sistema. Tente novamente em instantes.",
          ),
        );
        setEstadoValidacao("erro");
      }
    }

    void validarTenant();

    return () => {
      ativo = false;
    };
  }, [isAuthenticated, tenantIdSessao]);

  useEffect(() => {
    if (
      estadoValidacao === "valido" &&
      isAuthenticated &&
      user &&
      apiConfig.tenantSubdomain &&
      user.tenantId !== apiConfig.tenantSubdomain
    ) {
      encerrarSessaoAutenticada();
    }
  }, [estadoValidacao, isAuthenticated, user]);

  if (estadoValidacao === "validando") {
    return <TelaValidandoTenant />;
  }

  if (estadoValidacao === "erro") {
    return (
      <TelaErroValidacaoTenant
        mensagem={
          mensagemErro ??
          "Não foi possível validar o endereço do sistema. Tente novamente em instantes."
        }
      />
    );
  }

  if (estadoValidacao === "inexistente") {
    if (location.pathname !== ROTA_TENANT_INEXISTENTE) {
      return <Navigate to={ROTA_TENANT_INEXISTENTE} replace />;
    }

    return <Outlet />;
  }

  if (location.pathname === ROTA_TENANT_INEXISTENTE) {
    return <Navigate to={destinoTenantValido} replace />;
  }

  return <Outlet />;
}

export function ExigirAutenticacao() {
  const location = useLocation();
  const { isAuthenticated, user } = useSessaoAutenticada();
  const rotaAtual = `${location.pathname}${location.search}${location.hash}`;
  const sessaoValidaNoTenantAtual = possuiSessaoNoTenantAtual({
    isAuthenticated,
    user,
  });

  useEffect(() => {
    if (
      sessaoValidaNoTenantAtual &&
      user &&
      !user.deveTrocarSenha &&
      usuarioPodeAcessarRota(user, location.pathname) &&
      rotaPodeSerUltimaRotaPrivada(rotaAtual)
    ) {
      salvarUltimaRotaPrivada(rotaAtual);
    }
  }, [location.pathname, rotaAtual, sessaoValidaNoTenantAtual, user]);

  if (!sessaoValidaNoTenantAtual) {
    return <Navigate to={ROTA_LOGIN} replace state={{ returnTo: rotaAtual }} />;
  }

  if (user?.deveTrocarSenha && location.pathname !== ROTA_MINHA_CONTA) {
    return <Navigate to={ROTA_MINHA_CONTA} replace state={{ returnTo: rotaAtual }} />;
  }

  if (user && !usuarioPodeAcessarRota(user, location.pathname)) {
    return <Navigate to={ROTA_ACESSO_NEGADO} replace state={{ from: rotaAtual }} />;
  }

  return <Outlet />;
}

export function RedirecionarSeAutenticado() {
  const { isAuthenticated, user } = useSessaoAutenticada();
  const sessaoValidaNoTenantAtual = possuiSessaoNoTenantAtual({
    isAuthenticated,
    user,
  });

  if (sessaoValidaNoTenantAtual) {
    const destino = user?.deveTrocarSenha
      ? ROTA_MINHA_CONTA
      : obterDestinoPosLogin(user, obterUltimaRotaPrivada());
    return <Navigate to={destino} replace />;
  }

  return <Outlet />;
}

