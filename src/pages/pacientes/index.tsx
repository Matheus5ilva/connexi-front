import { useEffect, useState } from "react";
import { FaEdit, FaFileMedical, FaPlus } from "react-icons/fa";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  CompactFilterField,
  CompactFilters,
} from "../../components/ui/compact-filters";
import { PageHeader } from "../../components/ui/page-header";
import { PageLayout } from "../../components/ui/page-layout";
import { CarregamentoCentral } from "../../components/ui/carregamento-central";
import { StatusBadge } from "../../components/ui/status-badge";
import { Table } from "../../components/ui/table";
import { TableActionButton } from "../../components/ui/table-action-button";
import { TableTextCell } from "../../components/ui/table-text-cell";
import { formatarDataSomenteDia } from "../../domain/data-somente-dia";
import {
  pacienteService,
  toErrorMessage,
  type PacienteListaItem,
} from "../../services/api";
import styles from "./styles.module.css";
import { getSegmentoLabels } from "../../config/segmento-labels";
import type { LayoutOutletContext } from "../../layout";

const pacientesPath = "/pacientes";

type StatusFilter = "todos" | "ativo" | "inativo";

type FiltersState = {
  nome: string;
  status: StatusFilter;
  cpf: string;
  telefone: string;
  email: string;
};

const initialFilters: FiltersState = {
  nome: "",
  status: "todos",
  cpf: "",
  telefone: "",
  email: "",
};

function limparTexto(value: string): string | undefined {
  const texto = value.trim();
  return texto.length > 0 ? texto : undefined;
}

function mapStatusFilterToAtivo(filter: StatusFilter): boolean | undefined {
  if (filter === "ativo") {
    return true;
  }

  if (filter === "inativo") {
    return false;
  }

  return undefined;
}

export function Pacientes() {
  const navigate = useNavigate();
  const { segmento } = useOutletContext<LayoutOutletContext>();
  const labels = getSegmentoLabels(segmento);
  const pessoaMinuscula = labels.pessoa.toLowerCase();
  const pessoasMinuscula = labels.pessoas.toLowerCase();
  const [pacientes, setPacientes] = useState<PacienteListaItem[]>([]);
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const hasAdvancedFilters =
    Boolean(filters.cpf.trim()) ||
    Boolean(filters.telefone.trim()) ||
    Boolean(filters.email.trim());
  const hasActiveFilters =
    Boolean(filters.nome.trim()) ||
    filters.status !== "todos" ||
    hasAdvancedFilters;

  useEffect(() => {
    let active = true;

    async function carregarPacientes() {
      try {
        setLoading(true);
        setLoadError(null);

        const response = await pacienteService.listar({
          page: 1,
          limit: 100,
          nome: limparTexto(filters.nome),
          cpf: limparTexto(filters.cpf),
          telefone: limparTexto(filters.telefone),
          email: limparTexto(filters.email),
          ativo: mapStatusFilterToAtivo(filters.status),
        });

        if (!active) {
          return;
        }

        setPacientes(response.items);
      } catch (error) {
        if (!active) {
          return;
        }

        setPacientes([]);
        setLoadError(
          toErrorMessage(
            error,
            `Não foi possível carregar a lista de ${pessoasMinuscula}.`,
          ),
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void carregarPacientes();

    return () => {
      active = false;
    };
  }, [filters, pessoasMinuscula]);

  function handleFilterChange<K extends keyof FiltersState>(
    key: K,
    value: FiltersState[K],
  ) {
    setFilters((previous) => ({ ...previous, [key]: value }));
  }

  function handleClearFilters() {
    setFilters(initialFilters);
    setShowAdvancedFilters(false);
  }

  function renderStatusBadge(ativo: boolean) {
    return ativo ? (
      <StatusBadge label="Ativo" variant="success" />
    ) : (
      <StatusBadge label="Inativo" variant="neutral" />
    );
  }

  const emptyMessage =
    loadError ||
    `Nenhum ${pessoaMinuscula} encontrado para os filtros selecionados.`;

  return (
    <PageLayout>
      <PageHeader
        title={labels.pessoas}
        subtitle={`Gestão de ${pessoasMinuscula} cadastrados`}
        right={
          <button
            className={styles.btnPrimary}
            onClick={() =>
              navigate("/pacientes/novo", {
                state: { returnTo: pacientesPath },
              })
            }
            type="button"
          >
            <FaPlus />
            <span>Cadastrar {pessoaMinuscula}</span>
          </button>
        }
      />

      <CompactFilters
        fields={
          <>
            <CompactFilterField label={`Nome do ${pessoaMinuscula}`} grow>
              <input
                value={filters.nome}
                placeholder={`Digite o nome do ${pessoaMinuscula}`}
                onChange={(event) =>
                  handleFilterChange("nome", event.target.value)
                }
              />
            </CompactFilterField>

            <CompactFilterField label="Status">
              <select
                value={filters.status}
                onChange={(event) =>
                  handleFilterChange(
                    "status",
                    event.target.value as StatusFilter,
                  )
                }
              >
                <option value="todos">Todos</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </CompactFilterField>
          </>
        }
        advancedFields={
          <>
            <CompactFilterField label="CPF">
              <input
                value={filters.cpf}
                placeholder="000.000.000-00"
                onChange={(event) =>
                  handleFilterChange("cpf", event.target.value)
                }
              />
            </CompactFilterField>

            <CompactFilterField label="Telefone">
              <input
                value={filters.telefone}
                placeholder="(00) 00000-0000"
                onChange={(event) =>
                  handleFilterChange("telefone", event.target.value)
                }
              />
            </CompactFilterField>

            <CompactFilterField label="E-mail">
              <input
                value={filters.email}
                placeholder={`${pessoaMinuscula}@exemplo.com`}
                onChange={(event) =>
                  handleFilterChange("email", event.target.value)
                }
              />
            </CompactFilterField>
          </>
        }
        advancedVisible={showAdvancedFilters}
        advancedActive={hasAdvancedFilters}
        onToggleAdvanced={() => setShowAdvancedFilters((previous) => !previous)}
        toggleCollapsedLabel="Mais filtros"
        toggleExpandedLabel="Ocultar filtros"
        advancedId="pacientes-filtros-avancados"
        showClear={hasActiveFilters}
        onClear={handleClearFilters}
      />

      {loading && pacientes.length === 0 ? (
        <CarregamentoCentral />
      ) : (
        <Table
          data={pacientes}
          caption={`Tabela de ${pessoasMinuscula} cadastrados`}
          emptyMessage={emptyMessage}
          onRowClick={(row) =>
            navigate(`/pacientes/${row.id}`, {
              state: { returnTo: pacientesPath },
            })
          }
          getRowClassName={() => styles.patientRow}
          getRowAriaLabel={(row) => `Abrir perfil de ${row.nome}`}
          columns={[
            {
              key: "paciente",
              label: labels.pessoa,
              render: (row) => (
                <TableTextCell
                  primary={row.nome}
                  secondary={row.cpf ? `CPF ${row.cpf}` : "CPF não informado"}
                />
              ),
            },
            {
              key: "telefone",
              label: "Telefone",
              render: (row) => (
                <TableTextCell primary={row.telefone || "Não informado"} />
              ),
            },
            {
              key: "email",
              label: "E-mail",
              render: (row) => (
                <TableTextCell primary={row.email || "Não informado"} />
              ),
            },
            {
              key: "dataNascimento",
              label: "Nascimento",
              render: (row) => (
                <TableTextCell
                  primary={formatarDataSomenteDia(row.dataNascimento)}
                />
              ),
            },
            {
              key: "status",
              label: "Status",
              align: "center",
              render: (row) => renderStatusBadge(row.ativo),
            },
            {
              key: "acoes",
              label: "Ações",
              align: "right",
              render: (row) => (
                <div className={styles.actionButtons}>
                  <TableActionButton
                    icon={<FaEdit color="var(--color-brand-dark)" />}
                    label={`Editar ${row.nome}`}
                    title="Editar"
                    onClick={() =>
                      navigate(`/pacientes/${row.id}/editar`, {
                        state: { returnTo: pacientesPath },
                      })
                    }
                  />

                  <TableActionButton
                    icon={<FaFileMedical color="var(--color-brand-dark)" />}
                    label={`Prontuários de ${row.nome}`}
                    title="Atendimentos"
                    onClick={() =>
                      navigate(`/pacientes/${row.id}/prontuarios`, {
                        state: { returnTo: pacientesPath },
                      })
                    }
                  />
                </div>
              ),
            },
          ]}
        />
      )}
    </PageLayout>
  );
}
