import { type FormEvent, useEffect, useState } from "react";
import {
  FaCheck,
  FaEdit,
  FaFileAlt,
  FaLock,
  FaPlus,
  FaPowerOff,
  FaShieldAlt,
  FaSignOutAlt,
  FaTrash,
} from "react-icons/fa";
import { CarregamentoCentral } from "../../../components/ui/carregamento-central";
import { Modal } from "../../../components/ui/modal";
import { StatusBadge } from "../../../components/ui/status-badge";
import { Table } from "../../../components/ui/table";
import { TableActionButton } from "../../../components/ui/table-action-button";
import {
  adminTenantLogsService,
  adminTenantsService,
  isApiError,
  toErrorMessage,
  type CredencialAdministrativa,
  type CriarTenantAdministrativoRequest,
  type NichoTenant,
  type PlanoTenant,
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

const PLANOS: Array<{ valor: PlanoTenant; rotulo: string }> = [
  { valor: "SOLO", rotulo: "Solo" },
  { valor: "EQUIPE", rotulo: "Equipe" },
];

type FormularioLogin = {
  login: string;
  senha: string;
};

type FormularioCriacaoTenant = {
  nome: string;
  slug: string;
  nicho: NichoTenant;
  plano: PlanoTenant;
  emailUsuarioInicial: string;
};

type FormularioEdicaoTenant = {
  nome: string;
  plano: PlanoTenant;
};

const LOGIN_INICIAL: FormularioLogin = {
  login: "",
  senha: "",
};

const CRIACAO_INICIAL: FormularioCriacaoTenant = {
  nome: "",
  slug: "",
  nicho: "SAUDE",
  plano: "SOLO",
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

function formatarDataInput(valor: Date): string {
  return [
    valor.getFullYear(),
    String(valor.getMonth() + 1).padStart(2, "0"),
    String(valor.getDate()).padStart(2, "0"),
  ].join("-");
}

function downloadBlob(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  link.rel = "noopener";
  link.click();

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 1000);
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
    plano: formulario.plano,
    emailUsuarioInicial: formulario.emailUsuarioInicial.trim().toLowerCase(),
    nomeConsultorio: nome,
  };
}

function montarPayloadEdicao(formulario: FormularioEdicaoTenant) {
  return {
    nome: formulario.nome.trim(),
    plano: formulario.plano,
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
  const [credencial, setCredencial] = useState<CredencialAdministrativa | null>(
    null,
  );
  const [formularioLogin, setFormularioLogin] = useState(LOGIN_INICIAL);
  const [formularioCriacao, setFormularioCriacao] = useState(CRIACAO_INICIAL);
  const [tenants, setTenants] = useState<TenantAdministrativo[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [criacaoAberta, setCriacaoAberta] = useState(false);
  const [tenantParaEditar, setTenantParaEditar] =
    useState<TenantAdministrativo | null>(null);
  const [formularioEdicao, setFormularioEdicao] =
    useState<FormularioEdicaoTenant>({
      nome: "",
      plano: "SOLO",
    });
  const [tenantParaInativar, setTenantParaInativar] =
    useState<TenantAdministrativo | null>(null);
  const [tenantParaExcluir, setTenantParaExcluir] =
    useState<TenantAdministrativo | null>(null);
  const [confirmacaoExclusao, setConfirmacaoExclusao] = useState("");
  const [tenantParaLog, setTenantParaLog] =
    useState<TenantAdministrativo | null>(null);
  const [dataLog, setDataLog] = useState(formatarDataInput(new Date()));
  const [erroLog, setErroLog] = useState<string | null>(null);
  const [baixandoLog, setBaixandoLog] = useState(false);
  const dataHoje = formatarDataInput(new Date());

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

      const proximaCredencial = montarCredencialAdministrativa(formularioLogin);
      const lista = await adminTenantsService.listar(proximaCredencial);

      salvarCredencialAdministrativa(proximaCredencial);
      setCredencial(proximaCredencial);
      setTenants(lista);
      setFormularioLogin(LOGIN_INICIAL);
    } catch (error) {
      setErro(
        toErrorMessage(
          error,
          "Login administrativo inválido ou sem permissão.",
        ),
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

  function abrirEdicaoTenant(tenant: TenantAdministrativo) {
    setTenantParaEditar(tenant);
    setFormularioEdicao({
      nome: tenant.nome,
      plano: tenant.plano,
    });
    setErro(null);
    setSucesso(null);
  }

  async function atualizarTenant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!credencial || !tenantParaEditar) {
      return;
    }

    try {
      setCarregando(true);
      setErro(null);
      setSucesso(null);

      const tenantAtualizado = await adminTenantsService.atualizar(
        credencial,
        tenantParaEditar.id,
        montarPayloadEdicao(formularioEdicao),
      );

      setTenants((listaAtual) =>
        substituirTenantNaLista(listaAtual, tenantAtualizado),
      );
      setTenantParaEditar(null);
      setSucesso("Tenant atualizado com sucesso.");
    } catch (error) {
      setErro(toErrorMessage(error, "Não foi possível atualizar o tenant."));
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

  function abrirExclusaoTenant(tenant: TenantAdministrativo) {
    setTenantParaExcluir(tenant);
    setConfirmacaoExclusao("");
    setErro(null);
    setSucesso(null);
  }

  async function confirmarExclusaoTenant() {
    if (!credencial || !tenantParaExcluir) {
      return;
    }

    if (confirmacaoExclusao.trim() !== tenantParaExcluir.slug) {
      setErro("Digite o schema do tenant exatamente como exibido para confirmar.");
      return;
    }

    try {
      setCarregando(true);
      setErro(null);
      setSucesso(null);

      await adminTenantsService.excluir(credencial, tenantParaExcluir.id);

      setTenants((listaAtual) =>
        listaAtual.filter((tenant) => tenant.id !== tenantParaExcluir.id),
      );
      setTenantParaExcluir(null);
      setConfirmacaoExclusao("");
      setSucesso("Tenant excluído com sucesso.");
    } catch (error) {
      setErro(toErrorMessage(error, "Não foi possível excluir o tenant."));
    } finally {
      setCarregando(false);
    }
  }

  function abrirLogTenant(tenant: TenantAdministrativo) {
    setTenantParaLog(tenant);
    setDataLog(formatarDataInput(new Date()));
    setErroLog(null);
    setErro(null);
    setSucesso(null);
  }

  function fecharLogTenant() {
    if (baixandoLog) {
      return;
    }

    setTenantParaLog(null);
    setErroLog(null);
  }

  async function baixarLogTenant() {
    if (!credencial || !tenantParaLog) {
      return;
    }

    try {
      setBaixandoLog(true);
      setErroLog(null);

      const blob = await adminTenantLogsService.baixar(
        credencial,
        tenantParaLog.id,
        dataLog,
      );

      downloadBlob(blob, `connexi-${tenantParaLog.slug}-${dataLog}.log`);
      setTenantParaLog(null);
      setSucesso("Download do log iniciado.");
    } catch (error) {
      if (isApiError(error) && error.status === 404) {
        setErroLog("Nenhum log encontrado para este tenant nesta data.");
        return;
      }

      setErroLog(toErrorMessage(error, "Não foi possível baixar o log."));
    } finally {
      setBaixandoLog(false);
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
      <span className={styles.badgeNicho}>
        {obterRotuloNicho(tenant.nicho)}
      </span>
    );
  }

  function renderizarPlano(tenant: TenantAdministrativo) {
    return (
      PLANOS.find((item) => item.valor === tenant.plano)?.rotulo ??
      tenant.plano
    );
  }

  function renderizarAcoes(tenant: TenantAdministrativo) {
    return (
      <div className={styles.acoes}>
        <TableActionButton
          icon={<FaEdit color="var(--color-brand-dark)" />}
          label={`Editar ${tenant.nome}`}
          title="Editar"
          onClick={() => abrirEdicaoTenant(tenant)}
          disabled={carregando}
        />
        <TableActionButton
          icon={<FaFileAlt color="var(--color-brand-dark)" />}
          label={`Baixar log de ${tenant.nome}`}
          title="Log"
          onClick={() => abrirLogTenant(tenant)}
          disabled={carregando}
        />
        <TableActionButton
          icon={
            tenant.ativo ? (
              <FaPowerOff color="var(--color-danger)" />
            ) : (
              <FaCheck color="var(--color-success)" />
            )
          }
          label={`${tenant.ativo ? "Inativar" : "Reativar"} ${tenant.nome}`}
          title={tenant.ativo ? "Inativar" : "Reativar"}
          tone={tenant.ativo ? "danger" : "success"}
          onClick={() =>
            tenant.ativo
              ? setTenantParaInativar(tenant)
              : void ativarTenant(tenant)
          }
          disabled={carregando}
        />
        {!tenant.ativo ? (
          <TableActionButton
            icon={<FaTrash color="var(--color-danger)" />}
            label={`Excluir ${tenant.nome}`}
            title="Excluir"
            tone="danger"
            onClick={() => abrirExclusaoTenant(tenant)}
            disabled={carregando}
          />
        ) : null}
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
          <p>
            Gerencie tenants no schema público sem acessar dados dos clientes.
          </p>
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
              key: "plano",
              label: "Plano",
              align: "center",
              render: renderizarPlano,
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
              key: "dataInativacao",
              label: "Inativado em",
              render: (tenant) =>
                tenant.dataInativacao
                  ? formatarDataHora(tenant.dataInativacao)
                  : "-",
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
              Plano
              <select
                value={formularioCriacao.plano}
                onChange={(event) =>
                  setFormularioCriacao((atual) => ({
                    ...atual,
                    plano: event.target.value as PlanoTenant,
                  }))
                }
              >
                {PLANOS.map((plano) => (
                  <option key={plano.valor} value={plano.valor}>
                    {plano.rotulo}
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
        open={Boolean(tenantParaEditar)}
        onClose={() => setTenantParaEditar(null)}
        title="Editar tenant"
        subtitle="Ajuste nome e plano do tenant."
        maxWidth="560px"
      >
        <form className={styles.formulario} onSubmit={atualizarTenant}>
          <div className={styles.confirmacao}>
            <span>Tenant</span>
            <strong>{tenantParaEditar?.nome}</strong>
          </div>

          <div className={styles.gradeFormulario}>
            <label>
              Nome
              <input
                type="text"
                value={formularioEdicao.nome}
                onChange={(event) =>
                  setFormularioEdicao((atual) => ({
                    ...atual,
                    nome: event.target.value,
                  }))
                }
                required
              />
            </label>

            <label>
              Subdomínio/schema
              <input type="text" value={tenantParaEditar?.slug ?? ""} readOnly />
            </label>

            <label>
              Plano
              <select
                value={formularioEdicao.plano}
                onChange={(event) =>
                  setFormularioEdicao((atual) => ({
                    ...atual,
                    plano: event.target.value as PlanoTenant,
                  }))
                }
              >
                {PLANOS.map((plano) => (
                  <option key={plano.valor} value={plano.valor}>
                    {plano.rotulo}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.rodapeModal}>
            <button
              type="button"
              className={styles.botaoSecundario}
              onClick={() => setTenantParaEditar(null)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.botaoPrimario}
              disabled={carregando}
            >
              Salvar tenant
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

      <Modal
        open={Boolean(tenantParaExcluir)}
        onClose={() => setTenantParaExcluir(null)}
        title="Excluir tenant"
        subtitle="Esta ação remove o tenant e o schema de dados correspondente."
      >
        <div className={styles.confirmacao}>
          <p>
            Exclua apenas tenants inativos e sem necessidade de recuperação.
            Esta ação não pode ser desfeita.
          </p>
          <strong>{tenantParaExcluir?.nome}</strong>
        </div>

        <label className={styles.campoConfirmacao}>
          Digite o schema <strong>{tenantParaExcluir?.slug}</strong> para confirmar
          <input
            type="text"
            value={confirmacaoExclusao}
            onChange={(event) => setConfirmacaoExclusao(event.target.value)}
            autoComplete="off"
          />
        </label>

        <div className={styles.rodapeModal}>
          <button
            type="button"
            className={styles.botaoSecundario}
            onClick={() => setTenantParaExcluir(null)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.botaoPerigo}
            onClick={() => void confirmarExclusaoTenant()}
            disabled={
              carregando ||
              confirmacaoExclusao.trim() !== tenantParaExcluir?.slug
            }
          >
            Excluir tenant
          </button>
        </div>
      </Modal>

      <Modal
        open={Boolean(tenantParaLog)}
        onClose={fecharLogTenant}
        title="Baixar log do tenant"
        subtitle="Baixe o log gerado para este tenant na data selecionada."
      >
        <form
          className={styles.formulario}
          onSubmit={(event) => {
            event.preventDefault();
            void baixarLogTenant();
          }}
        >
          <div className={styles.confirmacao}>
            <span>Tenant</span>
            <strong>{tenantParaLog?.nome}</strong>
          </div>

          {erroLog ? (
            <div className="alert alert-warning" role="alert">
              {erroLog}
            </div>
          ) : null}

          <label>
            Data do log
            <input
              type="date"
              value={dataLog}
              max={dataHoje}
              onChange={(event) => {
                setDataLog(event.target.value);
                setErroLog(null);
              }}
              required
            />
          </label>

          <div className={styles.rodapeModal}>
            <button
              type="button"
              className={styles.botaoSecundario}
              onClick={fecharLogTenant}
              disabled={baixandoLog}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.botaoPrimario}
              disabled={baixandoLog || !dataLog || dataLog > dataHoje}
            >
              <FaFileAlt aria-hidden="true" />
              {baixandoLog ? "Baixando..." : "Baixar Log"}
            </button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
