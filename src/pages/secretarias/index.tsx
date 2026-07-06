import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { FaCheck, FaEdit, FaKey, FaPlus, FaPowerOff } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { CarregamentoCentral } from "../../components/ui/carregamento-central";
import { Modal } from "../../components/ui/modal";
import { PageHeader } from "../../components/ui/page-header";
import { PageLayout } from "../../components/ui/page-layout";
import { StatusBadge } from "../../components/ui/status-badge";
import { Table } from "../../components/ui/table";
import { TableActionButton } from "../../components/ui/table-action-button";
import {
  secretariaService,
  toErrorMessage,
  type Secretaria,
} from "../../services/api";
import { senhaProvisoriaSecretariaFormularioSchema } from "../../schemas/secretaria.schema";
import styles from "./styles.module.css";

function substituirSecretaria(
  lista: Secretaria[],
  secretariaAtualizada: Secretaria,
): Secretaria[] {
  return lista.map((secretaria) =>
    secretaria.id === secretariaAtualizada.id ? secretariaAtualizada : secretaria,
  );
}

export function Secretarias() {
  const navigate = useNavigate();
  const [secretarias, setSecretarias] = useState<Secretaria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [secretariaSenha, setSecretariaSenha] = useState<Secretaria | null>(
    null,
  );
  const [senhaProvisoria, setSenhaProvisoria] = useState("");
  const [erroSenha, setErroSenha] = useState<string | null>(null);
  const [alterandoSenha, setAlterandoSenha] = useState(false);

  const carregarSecretarias = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    try {
      setSecretarias(await secretariaService.listar());
    } catch (error) {
      setErro(toErrorMessage(error, "Não foi possível carregar as secretárias."));
      setSecretarias([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregarSecretarias();
  }, [carregarSecretarias]);

  const secretariaAtiva = useMemo(
    () => secretarias.find((secretaria) => secretaria.ativo) ?? null,
    [secretarias],
  );

  async function alternarStatus(secretaria: Secretaria) {
    setErro(null);
    setSucesso(null);

    try {
      const atualizada = await secretariaService.atualizarStatus(secretaria.id, {
        ativo: !secretaria.ativo,
      });
      setSecretarias((listaAtual) =>
        substituirSecretaria(listaAtual, atualizada),
      );
      setSucesso(
        atualizada.ativo
          ? "Secretária ativada com sucesso."
          : "Secretária inativada com sucesso.",
      );
    } catch (error) {
      setErro(
        toErrorMessage(error, "Não foi possível alterar o status da secretária."),
      );
    }
  }

  function abrirRedefinicaoSenha(secretaria: Secretaria) {
    setSecretariaSenha(secretaria);
    setSenhaProvisoria("");
    setErroSenha(null);
  }

  async function redefinirSenha(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!secretariaSenha) {
      return;
    }

    const senhaValidada =
      senhaProvisoriaSecretariaFormularioSchema.safeParse(senhaProvisoria);

    if (!senhaValidada.success) {
      setErroSenha(senhaValidada.error.issues[0]?.message ?? "Senha inválida.");
      return;
    }

    setAlterandoSenha(true);
    setErroSenha(null);

    try {
      await secretariaService.redefinirSenha(secretariaSenha.id, {
        senhaProvisoria: senhaValidada.data,
      });
      setSecretariaSenha(null);
      setSenhaProvisoria("");
      setSucesso("Senha provisória redefinida com sucesso.");
    } catch (error) {
      setErroSenha(toErrorMessage(error, "Não foi possível redefinir a senha."));
    } finally {
      setAlterandoSenha(false);
    }
  }

  return (
    <PageLayout>
      <PageHeader
        title="Secretárias"
        subtitle="Gerencie o acesso de secretária deste tenant."
        right={
          <button
            className={styles.btnPrimary}
            type="button"
            onClick={() => navigate("/secretarias/novo")}
          >
            <FaPlus />
            <span>Nova secretária</span>
          </button>
        }
      />

      {erro ? (
        <section className={styles.feedbackCard} role="alert">
          <p className={styles.feedbackError}>{erro}</p>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => void carregarSecretarias()}
          >
            Tentar novamente
          </button>
        </section>
      ) : null}

      {sucesso ? (
        <div className="alert alert-success" role="status">
          {sucesso}
        </div>
      ) : null}

      {secretariaAtiva ? (
        <p className={styles.feedbackInfo}>
          Secretária ativa: <strong>{secretariaAtiva.pessoa.nome}</strong>
        </p>
      ) : null}

      {carregando ? (
        <CarregamentoCentral />
      ) : (
        <Table
          data={secretarias}
          caption="Tabela de secretárias"
          emptyMessage="Nenhuma secretária cadastrada."
          onRowClick={(row) => navigate(`/secretarias/${row.id}`)}
          getRowClassName={() => styles.linhaSecretaria}
          getRowAriaLabel={(row) => `Visualizar ${row.pessoa.nome}`}
          columns={[
            {
              key: "nome",
              label: "Secretária",
              render: (row) => (
                <div className={styles.nameCell}>
                  <strong className={styles.nameValue}>{row.pessoa.nome}</strong>
                  <span className={styles.nameHint}>{row.pessoa.contato.email}</span>
                </div>
              ),
            },
            {
              key: "telefone",
              label: "Telefone",
              render: (row) => row.pessoa.contato.telefone || "-",
            },
            {
              key: "financeiro",
              label: "Financeiro",
              align: "center",
              render: (row) =>
                row.podeAcessarFinanceiro ? "Liberado" : "Bloqueado",
            },
            {
              key: "status",
              label: "Status",
              align: "center",
              render: (row) => (
                <StatusBadge
                  label={row.ativo ? "Ativa" : "Inativa"}
                  variant={row.ativo ? "success" : "danger"}
                />
              ),
            },
            {
              key: "acoes",
              label: "Ações",
              align: "right",
              render: (row) => (
                <div className={styles.actionButtons}>
                  <TableActionButton
                    icon={<FaEdit color="var(--color-brand-dark)" />}
                    label={`Editar ${row.pessoa.nome}`}
                    title="Editar"
                    onClick={() => navigate(`/secretarias/${row.id}/editar`)}
                  />
                  <TableActionButton
                    icon={<FaKey color="var(--color-brand-dark)" />}
                    label={`Redefinir senha de ${row.pessoa.nome}`}
                    title="Redefinir senha"
                    onClick={() => abrirRedefinicaoSenha(row)}
                  />
                  <TableActionButton
                    icon={
                      row.ativo ? (
                        <FaPowerOff color="var(--color-danger)" />
                      ) : (
                        <FaCheck color="var(--color-success)" />
                      )
                    }
                    label={`${row.ativo ? "Inativar" : "Ativar"} ${row.pessoa.nome}`}
                    title={row.ativo ? "Inativar" : "Ativar"}
                    tone={row.ativo ? "danger" : "success"}
                    onClick={() => void alternarStatus(row)}
                  />
                </div>
              ),
            },
          ]}
        />
      )}

      <Modal
        open={Boolean(secretariaSenha)}
        onClose={() => {
          if (!alterandoSenha) {
            setSecretariaSenha(null);
            setErroSenha(null);
          }
        }}
        title="Redefinir senha"
        subtitle="Informe uma senha provisória para a secretária."
      >
        <form className={styles.formulario} onSubmit={redefinirSenha}>
          <div className={styles.confirmBody}>
            <p>
              Secretária: <strong>{secretariaSenha?.pessoa.nome}</strong>
            </p>
            {erroSenha ? (
              <p className={styles.feedbackError} role="alert">
                {erroSenha}
              </p>
            ) : null}
          </div>

          <label>
            Senha provisória
            <input
              type="password"
              value={senhaProvisoria}
              onChange={(event) => {
                setSenhaProvisoria(event.target.value);
                setErroSenha(null);
              }}
              autoComplete="new-password"
              required
            />
          </label>

          <div className={styles.rodapeModal}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => setSecretariaSenha(null)}
              disabled={alterandoSenha}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={alterandoSenha}
            >
              {alterandoSenha ? "Salvando..." : "Redefinir senha"}
            </button>
          </div>
        </form>
      </Modal>
    </PageLayout>
  );
}
