import { type FormEvent, useEffect, useState } from "react";
import {
  FaCheck,
  FaLock,
  FaPlus,
  FaPowerOff,
  FaShieldAlt,
  FaSignOutAlt,
} from "react-icons/fa";
import { CarregamentoCentral } from "../../../components/ui/carregamento-central";
import { Modal } from "../../../components/ui/modal";
import { StatusBadge } from "../../../components/ui/status-badge";
import { Table } from "../../../components/ui/table";
import {
  adminTenantsService,
  toErrorMessage,
  type CredencialAdministrativa,
  type CriarTenantAdministrativoRequest,
  type NichoTenant,
  type TenantAdministrativo,
} from "../../../services/api";
import styles from "./styles.module.css";

const CHAVE_CREDENCIAL_ADMIN = "connexi.admin.authorization";

const NICHOS: Array<{ valor: NichoTenant; rotulo: string }> = [
  { valor: "SAUDE", rotulo: "Saúde" },
  { valor: "PET", rotulo: "Pet" },
  { valor: "ESTETICA", rotulo: "Estética" },
  { valor: "SERVICOS", rotulo: "Serviços" },
];

type FormularioLogin = {
  login: string;
  senha: string;
};

type FormularioCriacaoTenant = {
  nome: string;
  slug: string;
  nicho: NichoTenant;
  emailUsuarioInicial: string;
};

const LOGIN_INICIAL: FormularioLogin = {
  login: "",
  senha: "",
};

const CRIACAO_INICIAL: FormularioCriacaoTenant = {
  nome: "",
  slug: "",
  nicho: "SAUDE",
  emailUsuarioInicial: "",
};

function podeUsarStorage(): boolean {
  return typeof window !== "undefined";
}

function lerCredencialArmazenada(): CredencialAdministrativa | null {
  if (!podeUsarStorage()) {
    return null;
  }

  const authorization = window.sessionStorage
    .getItem(CHAVE_CREDENCIAL_ADMIN)
    ?.trim();

  return authorization ? { authorization } : null;
}

function salvarCredencialAdministrativa(credencial: CredencialAdministrativa) {
  if (!podeUsarStorage()) {
    return;
  }

  window.sessionStorage.setItem(
    CHAVE_CREDENCIAL_ADMIN,
    credencial.authorization,
  );
}

function removerCredencialAdministrativa() {
  if (!podeUsarStorage()) {
    return;
  }

  window.sessionStorage.removeItem(CHAVE_CREDENCIAL_ADMIN);
}

function montarCredencialAdministrativa(
  formulario: FormularioLogin,
): CredencialAdministrativa {
  return {
    authorization: `Basic ${window.btoa(`${formulario.login}:${formulario.senha}`)}`,
  };
}

function formatarDataHora(valor: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(valor));
}

function obterRotuloNicho(nicho: NichoTenant): string {
  return NICHOS.find((item) => item.valor === nicho)?.rotulo ?? nicho;
}

function montarPayloadCriacao(
  formulario: FormularioCriacaoTenant,
): CriarTenantAdministrativoRequest {
  const nome = formulario.nome.trim();

  return {
    nome,
    slug: formulario.slug.trim().toLowerCase(),
    nicho: formulario.nicho,
    emailUsuarioInicial: formulario.emailUsuarioInicial.trim().toLowerCase(),
    nomeConsultorio: nome,
  };
}

function substituirTenantNaLista(
  lista: TenantAdministrativo[],
  tenantAtualizado: TenantAdministrativo,
): TenantAdministrativo[] {
  return lista.map((tenant) =>
    tenant.id === tenantAtualizado.id ? tenantAtualizado : tenant,
  );
}

export function AdminTenants() {
  const [credencial, setCredencial] =
    useState<CredencialAdministrativa | null>(null);
  const [formularioLogin, setFormularioLogin] = useState(LOGIN_INICIAL);
  const [formularioCriacao, setFormularioCriacao] =
    useState(CRIACAO_INICIAL);
  const [tenants, setTenants] = useState<TenantAdministrativo[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [criacaoAberta, setCriacaoAberta] = useState(false);
  const [tenantParaInativar, setTenantParaInativar] =
    useState<TenantAdministrativo | null>(null);

  useEffect(() => {
    const credencialArmazenada = lerCredencialArmazenada();

    if (!credencialArmazenada) {
      return;
    }

    setCredencial(credencialArmazenada);
    void carregarTenants(credencialArmazenada, true);
  }, []);

  async function carregarTenants(
    credencialAtual: CredencialAdministrativa,
    exibirCarregamento: boolean,
  ) {
    try {
      if (exibirCarregamento) {
        setCarregando(true);
      }

      setErro(null);
      const lista = await adminTenantsService.listar(credencialAtual);
      setTenants(lista);
    } catch (error) {
      setErro(toErrorMessage(error, "Não foi possível listar os tenants."));
      removerCredencialAdministrativa();
      setCredencial(null);
    } finally {
      if (exibirCarregamento) {
        setCarregando(false);
      }
    }
  }

  async function enviarLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setCarregando(true);
      setErro(null);
      setSucesso(null);

      const proximaCredencial =
        montarCredencialAdministrativa(formularioLogin);
      const lista = await adminTenantsService.listar(proximaCredencial);

      salvarCredencialAdministrativa(proximaCredencial);
      setCredencial(proximaCredencial);
      setTenants(lista);
      setFormularioLogin(LOGIN_INICIAL);
    } catch (error) {
      setErro(
        toErrorMessage(error, "Login administrativo inválido ou sem permissão."),
      );
    } finally {
      setCarregando(false);
    }
  }

  async function criarTenant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!credencial) {
      return;
    }

    try {
      setCarregando(true);
      setErro(null);
      setSucesso(null);

      const tenantCriado = await adminTenantsService.criar(
        credencial,
        montarPayloadCriacao(formularioCriacao),
      );

      setTenants((listaAtual) => [tenantCriado, ...listaAtual]);
      setFormularioCriacao(CRIACAO_INICIAL);
      setCriacaoAberta(false);
      setSucesso("Tenant criado com sucesso.");
    } catch (error) {
      setErro(toErrorMessage(error, "Não foi possível criar o tenant."));
    } finally {
      setCarregando(false);
    }
  }

  async function ativarTenant(tenant: TenantAdministrativo) {
    if (!credencial) {
      return;
    }

    try {
      setCarregando(true);
      setErro(null);
      setSucesso(null);

      const tenantAtualizado = await adminTenantsService.ativar(
        credencial,
        tenant.id,
      );

      setTenants((listaAtual) =>
        substituirTenantNaLista(listaAtual, tenantAtualizado),
      );
      setSucesso("Tenant ativado com sucesso.");
    } catch (error) {
      setErro(toErrorMessage(error, "Não foi possível ativar o tenant."));
    } finally {
      setCarregando(false);
    }
  }

  async function confirmarInativacaoTenant() {
    if (!credencial || !tenantParaInativar) {
      return;
    }

    try {
      setCarregando(true);
      setErro(null);
      setSucesso(null);

      const tenantAtualizado = await adminTenantsService.inativar(
        credencial,
        tenantParaInativar.id,
      );

      setTenants((listaAtual) =>
        substituirTenantNaLista(listaAtual, tenantAtualizado),
      );
      setTenantParaInativar(null);
      setSucesso("Tenant inativado com sucesso.");
    } catch (error) {
      setErro(toErrorMessage(error, "Não foi possível inativar o tenant."));
    } finally {
      setCarregando(false);
    }
  }

  function sair() {
    removerCredencialAdministrativa();
    setCredencial(null);
    setTenants([]);
    setErro(null);
    setSucesso(null);
  }

  function renderizarStatus(tenant: TenantAdministrativo) {
    return (
      <StatusBadge
        label={tenant.ativo ? "Ativo" : "Inativo"}
        variant={tenant.ativo ? "success" : "danger"}
      />
    );
  }

  function renderizarNicho(tenant: TenantAdministrativo) {
    return (
      <span className={styles.badgeNicho}>{obterRotuloNicho(tenant.nicho)}</span>
    );
  }

  function renderizarAcoes(tenant: TenantAdministrativo) {
    return (
      <div className={styles.acoes}>
        {tenant.ativo ? (
          <button
            type="button"
            className={styles.botaoPerigo}
            onClick={() => setTenantParaInativar(tenant)}
            disabled={carregando}
          >
            <FaPowerOff aria-hidden="true" />
            Inativar
          </button>
        ) : (
          <button
            type="button"
            className={styles.botaoSucesso}
            onClick={() => void ativarTenant(tenant)}
            disabled={carregando}
          >
            <FaCheck aria-hidden="true" />
            Ativar
          </button>
        )}
      </div>
    );
  }

  if (!credencial) {
    return (
      <main className={styles.pagina}>
        <section className={styles.loginCard}>
          <div className={styles.iconeLogin}>
            <FaShieldAlt aria-hidden="true" />
          </div>

          <h1>Administração de Tenants</h1>
          <p>Acesso interno restrito ao dono do produto.</p>

          {erro ? (
            <div className="alert alert-danger" role="alert">
              {erro}
            </div>
          ) : null}

          <form className={styles.formulario} onSubmit={enviarLogin}>
            <label>
              Login
              <input
                type="text"
                value={formularioLogin.login}
                onChange={(event) =>
                  setFormularioLogin((atual) => ({
                    ...atual,
                    login: event.target.value,
                  }))
                }
                autoComplete="username"
                required
              />
            </label>

            <label>
              Senha
              <input
                type="password"
                value={formularioLogin.senha}
                onChange={(event) =>
                  setFormularioLogin((atual) => ({
                    ...atual,
                    senha: event.target.value,
                  }))
                }
                autoComplete="current-password"
                required
              />
            </label>

            <button type="submit" className={styles.botaoPrimario}>
              <FaLock aria-hidden="true" />
              Entrar
            </button>
          </form>

          {carregando ? <CarregamentoCentral /> : null}
        </section>
      </main>
    );
  }

  return (
    <main className={styles.pagina}>
      <section className={styles.cabecalho}>
        <div>
          <span className={styles.etiqueta}>Área interna</span>
          <h1>Administração de Tenants</h1>
          <p>Gerencie tenants no schema público sem acessar dados dos clientes.</p>
        </div>

        <div className={styles.botoesCabecalho}>
          <button
            type="button"
            className={styles.botaoSecundario}
            onClick={sair}
          >
            <FaSignOutAlt aria-hidden="true" />
            Sair
          </button>
          <button
            type="button"
            className={styles.botaoPrimario}
            onClick={() => {
              setFormularioCriacao(CRIACAO_INICIAL);
              setCriacaoAberta(true);
              setErro(null);
              setSucesso(null);
            }}
          >
            <FaPlus aria-hidden="true" />
            Criar tenant
          </button>
        </div>
      </section>

      {erro ? (
        <div className="alert alert-danger" role="alert">
          {erro}
        </div>
      ) : null}

      {sucesso ? (
        <div className="alert alert-success" role="status">
          {sucesso}
        </div>
      ) : null}

      {carregando && tenants.length === 0 ? (
        <CarregamentoCentral />
      ) : (
        <Table
          data={tenants}
          caption="Tenants cadastrados"
          emptyMessage="Nenhum tenant cadastrado."
          columns={[
            { key: "nome", label: "Nome" },
            { key: "slug", label: "Subdomínio/schema" },
            {
              key: "nicho",
              label: "Nicho",
              render: renderizarNicho,
            },
            {
              key: "ativo",
              label: "Status",
              align: "center",
              render: renderizarStatus,
            },
            {
              key: "criadoEm",
              label: "Criado em",
              render: (tenant) => formatarDataHora(tenant.criadoEm),
            },
            {
              key: "atualizadoEm",
              label: "Atualizado em",
              render: (tenant) => formatarDataHora(tenant.atualizadoEm),
            },
            {
              key: "acoes",
              label: "Ações",
              align: "right",
              render: renderizarAcoes,
            },
          ]}
        />
      )}

      <Modal
        open={criacaoAberta}
        onClose={() => setCriacaoAberta(false)}
        title="Criar tenant"
        subtitle="O schema será criado e as migrations serão executadas pelo backend."
        maxWidth="720px"
      >
        <form className={styles.formulario} onSubmit={criarTenant}>
          <div className={styles.gradeFormulario}>
            <label>
              Nome
              <input
                type="text"
                value={formularioCriacao.nome}
                onChange={(event) =>
                  setFormularioCriacao((atual) => ({
                    ...atual,
                    nome: event.target.value,
                  }))
                }
                required
              />
            </label>

            <label>
              Subdomínio/schema
              <input
                type="text"
                value={formularioCriacao.slug}
                onChange={(event) =>
                  setFormularioCriacao((atual) => ({
                    ...atual,
                    slug: event.target.value,
                  }))
                }
                placeholder="psi-matheus"
                required
              />
            </label>

            <label>
              Nicho
              <select
                value={formularioCriacao.nicho}
                onChange={(event) =>
                  setFormularioCriacao((atual) => ({
                    ...atual,
                    nicho: event.target.value as NichoTenant,
                  }))
                }
              >
                {NICHOS.map((nicho) => (
                  <option key={nicho.valor} value={nicho.valor}>
                    {nicho.rotulo}
                  </option>
                ))}
              </select>
            </label>

            <label>
              E-mail do usuário inicial
              <input
                type="email"
                value={formularioCriacao.emailUsuarioInicial}
                onChange={(event) =>
                  setFormularioCriacao((atual) => ({
                    ...atual,
                    emailUsuarioInicial: event.target.value,
                  }))
                }
                required
              />
            </label>
          </div>

          <div className={styles.rodapeModal}>
            <button
              type="button"
              className={styles.botaoSecundario}
              onClick={() => setCriacaoAberta(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.botaoPrimario}
              disabled={carregando}
            >
              Criar tenant
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(tenantParaInativar)}
        onClose={() => setTenantParaInativar(null)}
        title="Inativar tenant"
        subtitle="Confirmação obrigatória para suspensão de acesso."
      >
        <div className={styles.confirmacao}>
          <p>Ao inativar este tenant, o acesso ao sistema será suspenso.</p>
          <strong>{tenantParaInativar?.nome}</strong>
        </div>

        <div className={styles.rodapeModal}>
          <button
            type="button"
            className={styles.botaoSecundario}
            onClick={() => setTenantParaInativar(null)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.botaoPerigo}
            onClick={() => void confirmarInativacaoTenant()}
            disabled={carregando}
          >
            Inativar tenant
          </button>
        </div>
      </Modal>
    </main>
  );
}
