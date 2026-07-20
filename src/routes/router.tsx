import {
  Suspense,
  lazy,
  type ComponentType,
  type LazyExoticComponent,
  type ReactElement,
} from "react";
import {
  Navigate,
  createBrowserRouter,
  redirectDocument,
} from "react-router-dom";
import {
  ExigirAutenticacao,
  RedirecionarSeAutenticado,
  ValidarContextoTenant,
} from "./auth-guards";
import { APP_SITE_URL } from "../config/version";
import { apiConfig } from "../services/api";

type ModuloPagina<TNome extends string> = Record<TNome, ComponentType>;
type PaginaCarregavel = LazyExoticComponent<ComponentType>;
const TERMOS_COMPROMISSO_OFICIAL_URL =
  `${APP_SITE_URL}/termos-e-compromisso`;

function carregarPagina<TNome extends string>(
  importador: () => Promise<ModuloPagina<TNome>>,
  nomeExportado: TNome,
): PaginaCarregavel {
  return lazy(async () => {
    const modulo = await importador();
    return { default: modulo[nomeExportado] };
  });
}

const carregamentoPagina = (
  <div className="d-flex w-100 justify-content-center py-5" aria-live="polite">
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Carregando página...</span>
    </div>
  </div>
);

function renderizarPagina(Pagina: PaginaCarregavel): ReactElement {
  return (
    <Suspense fallback={carregamentoPagina}>
      <Pagina />
    </Suspense>
  );
}

const Layout = carregarPagina(() => import("../layout"), "Layout");
const AdminTenants = carregarPagina(
  () => import("../pages/admin/tenants"),
  "AdminTenants",
);
const PaginaAcessoNegado = carregarPagina(
  () => import("../pages/access-denied"),
  "PaginaAcessoNegado",
);
const Agenda = carregarPagina(() => import("../pages/agenda"), "Agenda");
const PaginaEsqueciSenha = carregarPagina(
  () => import("../pages/auth/esqueci-senha"),
  "PaginaEsqueciSenha",
);
const PaginaLogin = carregarPagina(
  () => import("../pages/auth/login"),
  "PaginaLogin",
);
const PaginaRedefinirSenha = carregarPagina(
  () => import("../pages/auth/redefinir-senha"),
  "PaginaRedefinirSenha",
);
const PaginaTenantInexistente = carregarPagina(
  () => import("../pages/auth/tenant-not-found"),
  "PaginaTenantInexistente",
);
const ConsultaAtendimento = carregarPagina(
  () => import("../pages/consulta"),
  "ConsultaAtendimento",
);
const Consultorio = carregarPagina(
  () => import("../pages/consultorio"),
  "Consultorio",
);
const EditarConsultorio = carregarPagina(
  () => import("../pages/consultorio/editar"),
  "EditarConsultorio",
);
const Configuracoes = carregarPagina(
  () => import("../pages/configuracoes"),
  "Configuracoes",
);
const EditarConfiguracoes = carregarPagina(
  () => import("../pages/configuracoes/editar"),
  "EditarConfiguracoes",
);
const ContasReceber = carregarPagina(
  () => import("../pages/contas-receber"),
  "ContasReceber",
);
const VisualizarContaReceber = carregarPagina(
  () => import("../pages/contas-receber/visualizar"),
  "VisualizarContaReceber",
);
const Convenios = carregarPagina(
  () => import("../pages/convenios"),
  "Convenios",
);
const EditarConvenio = carregarPagina(
  () => import("../pages/convenios/editar"),
  "EditarConvenio",
);
const NovoConvenio = carregarPagina(
  () => import("../pages/convenios/novo"),
  "NovoConvenio",
);
const VisualizarConvenio = carregarPagina(
  () => import("../pages/convenios/visualizar"),
  "VisualizarConvenio",
);
const ContasPagar = carregarPagina(
  () => import("../pages/documentos-pagar"),
  "ContasPagar",
);
const EditarContaPagar = carregarPagina(
  () => import("../pages/documentos-pagar/editar"),
  "EditarContaPagar",
);
const NovaContaPagar = carregarPagina(
  () => import("../pages/documentos-pagar/novo"),
  "NovaContaPagar",
);
const VisualizarContaPagar = carregarPagina(
  () => import("../pages/documentos-pagar/visualizar"),
  "VisualizarContaPagar",
);
const FluxoCaixa = carregarPagina(
  () => import("../pages/fluxo-caixa"),
  "FluxoCaixa",
);
const FormasPagamento = carregarPagina(
  () => import("../pages/formas-pagamento"),
  "FormasPagamento",
);
const EditarFormaPagamento = carregarPagina(
  () => import("../pages/formas-pagamento/editar"),
  "EditarFormaPagamento",
);
const NovaFormaPagamento = carregarPagina(
  () => import("../pages/formas-pagamento/novo"),
  "NovaFormaPagamento",
);
const VisualizarFormaPagamento = carregarPagina(
  () => import("../pages/formas-pagamento/visualizar"),
  "VisualizarFormaPagamento",
);
const Home = carregarPagina(() => import("../pages/home"), "Home");
const PaginaInicialPublica = carregarPagina(
  () => import("../pages/inicio-publico"),
  "PaginaInicialPublica",
);
const MinhaContaPage = carregarPagina(
  () => import("../pages/minha-conta"),
  "MinhaContaPage",
);
const PaginaNaoEncontrada = carregarPagina(
  () => import("../pages/not-found"),
  "PaginaNaoEncontrada",
);
const Pacientes = carregarPagina(
  () => import("../pages/pacientes"),
  "Pacientes",
);
const EditarPaciente = carregarPagina(
  () => import("../pages/pacientes/editar"),
  "EditarPaciente",
);
const NovoPaciente = carregarPagina(
  () => import("../pages/pacientes/novo"),
  "NovoPaciente",
);
const ProntuariosPaciente = carregarPagina(
  () => import("../pages/pacientes/prontuarios"),
  "ProntuariosPaciente",
);
const VisualizarPaciente = carregarPagina(
  () => import("../pages/pacientes/visualizar"),
  "VisualizarPaciente",
);
const Profissionais = carregarPagina(
  () => import("../pages/profissionais"),
  "Profissionais",
);
const EditarProfissional = carregarPagina(
  () => import("../pages/profissionais/editar"),
  "EditarProfissional",
);
const Especialidades = carregarPagina(
  () => import("../pages/profissionais/especialidades"),
  "Especialidades",
);
const EditarEspecialidade = carregarPagina(
  () => import("../pages/profissionais/especialidades/editar"),
  "EditarEspecialidade",
);
const NovaEspecialidade = carregarPagina(
  () => import("../pages/profissionais/especialidades/nova"),
  "NovaEspecialidade",
);
const VisualizarEspecialidade = carregarPagina(
  () => import("../pages/profissionais/especialidades/visualizar"),
  "VisualizarEspecialidade",
);
const Servicos = carregarPagina(
  () => import("../pages/servicos"),
  "Servicos",
);
const Secretarias = carregarPagina(
  () => import("../pages/secretarias"),
  "Secretarias",
);
const NovaSecretaria = carregarPagina(
  () => import("../pages/secretarias/novo"),
  "NovaSecretaria",
);
const VisualizarSecretaria = carregarPagina(
  () => import("../pages/secretarias/visualizar"),
  "VisualizarSecretaria",
);
const EditarSecretaria = carregarPagina(
  () => import("../pages/secretarias/editar"),
  "EditarSecretaria",
);
const EditarServico = carregarPagina(
  () => import("../pages/servicos/editar"),
  "EditarServico",
);
const NovoServico = carregarPagina(
  () => import("../pages/servicos/novo"),
  "NovoServico",
);
const VisualizarServico = carregarPagina(
  () => import("../pages/servicos/visualizar"),
  "VisualizarServico",
);
const TermosCompromissoPage = carregarPagina(
  () => import("../pages/termos-compromisso"),
  "TermosCompromissoPage",
);

function criarRotasPublicas() {
  return [
    {
      path: "/",
      element: renderizarPagina(PaginaInicialPublica),
    },
    {
      path: "/tenant-inexistente",
      element: <Navigate to="/" replace />,
    },
    {
      path: "/admin/tenants",
      element: renderizarPagina(AdminTenants),
    },
    {
      path: "/termos-e-compromisso",
      element: renderizarPagina(TermosCompromissoPage),
    },
    {
      path: "*",
      element: renderizarPagina(PaginaNaoEncontrada),
    },
  ];
}

function criarRotasTenant() {
  return [
    {
      path: "/termos-e-compromisso",
      loader: () => redirectDocument(TERMOS_COMPROMISSO_OFICIAL_URL),
    },
    {
      element: <ValidarContextoTenant />,
      children: [
        {
          path: "/tenant-inexistente",
          element: renderizarPagina(PaginaTenantInexistente),
        },
        {
          element: <RedirecionarSeAutenticado />,
          children: [
            {
              path: "/login",
              element: renderizarPagina(PaginaLogin),
            },
            {
              path: "/esqueci-senha",
              element: renderizarPagina(PaginaEsqueciSenha),
            },
            {
              path: "/redefinir-senha",
              element: renderizarPagina(PaginaRedefinirSenha),
            },
            {
              path: "/auth/reset-password",
              element: renderizarPagina(PaginaRedefinirSenha),
            },
          ],
        },
        {
          element: <ExigirAutenticacao />,
          children: [
            {
              element: renderizarPagina(Layout),
              children: [
                {
                  path: "/",
                  element: renderizarPagina(Home),
                },
                {
                  path: "/dashboard",
                  element: renderizarPagina(Home),
                },
                {
                  path: "/acesso-negado",
                  element: renderizarPagina(PaginaAcessoNegado),
                },
                {
                  path: "/agenda",
                  element: renderizarPagina(Agenda),
                },
                {
                  path: "/profissional",
                  element: renderizarPagina(Profissionais),
                },
                {
                  path: "/profissional/editar",
                  element: renderizarPagina(EditarProfissional),
                },
                {
                  path: "/profissional/especialidades",
                  element: renderizarPagina(Especialidades),
                },
                {
                  path: "/profissional/especialidades/nova",
                  element: renderizarPagina(NovaEspecialidade),
                },
                {
                  path: "/profissional/especialidades/:id",
                  element: renderizarPagina(VisualizarEspecialidade),
                },
                {
                  path: "/profissional/especialidades/:id/editar",
                  element: renderizarPagina(EditarEspecialidade),
                },
                {
                  path: "/profissionais",
                  element: <Navigate to="/profissional" replace />,
                },
                {
                  path: "/profissionais/novo",
                  element: <Navigate to="/profissional/editar" replace />,
                },
                {
                  path: "/profissionais/:id",
                  element: <Navigate to="/profissional" replace />,
                },
                {
                  path: "/profissionais/:id/editar",
                  element: <Navigate to="/profissional/editar" replace />,
                },
                {
                  path: "/profissionais/especialidades",
                  element: <Navigate to="/profissional/especialidades" replace />,
                },
                {
                  path: "/profissionais/especialidades/nova",
                  element: <Navigate to="/profissional/especialidades/nova" replace />,
                },
                {
                  path: "/profissionais/especialidades/:id",
                  element: renderizarPagina(VisualizarEspecialidade),
                },
                {
                  path: "/profissionais/especialidades/:id/editar",
                  element: renderizarPagina(EditarEspecialidade),
                },
                {
                  path: "/consultorio",
                  element: renderizarPagina(Consultorio),
                },
                {
                  path: "/consultorio/editar",
                  element: renderizarPagina(EditarConsultorio),
                },
                {
                  path: "/consultorios",
                  element: <Navigate to="/consultorio" replace />,
                },
                {
                  path: "/consultorios/novo",
                  element: <Navigate to="/consultorio/editar" replace />,
                },
                {
                  path: "/consultorios/:id",
                  element: <Navigate to="/consultorio" replace />,
                },
                {
                  path: "/consultorios/:id/editar",
                  element: <Navigate to="/consultorio/editar" replace />,
                },
                {
                  path: "/consultas/:agendamentoId",
                  element: renderizarPagina(ConsultaAtendimento),
                },
                {
                  path: "/pacientes",
                  element: renderizarPagina(Pacientes),
                },
                {
                  path: "/pacientes/novo",
                  element: renderizarPagina(NovoPaciente),
                },
                {
                  path: "/pacientes/:id",
                  element: renderizarPagina(VisualizarPaciente),
                },
                {
                  path: "/pacientes/:id/editar",
                  element: renderizarPagina(EditarPaciente),
                },
                {
                  path: "/pacientes/:id/prontuarios",
                  element: renderizarPagina(ProntuariosPaciente),
                },
                {
                  path: "/financeiro/convenios",
                  element: renderizarPagina(Convenios),
                },
                {
                  path: "/financeiro/convenios/novo",
                  element: renderizarPagina(NovoConvenio),
                },
                {
                  path: "/financeiro/convenios/:id",
                  element: renderizarPagina(VisualizarConvenio),
                },
                {
                  path: "/financeiro/convenios/:id/editar",
                  element: renderizarPagina(EditarConvenio),
                },
                {
                  path: "/financeiro/servicos",
                  element: renderizarPagina(Servicos),
                },
                {
                  path: "/financeiro/servicos/novo",
                  element: renderizarPagina(NovoServico),
                },
                {
                  path: "/financeiro/servicos/:id",
                  element: renderizarPagina(VisualizarServico),
                },
                {
                  path: "/financeiro/servicos/:id/editar",
                  element: renderizarPagina(EditarServico),
                },
                {
                  path: "/financeiro/contas-a-pagar",
                  element: renderizarPagina(ContasPagar),
                },
                {
                  path: "/financeiro/contas-a-pagar/novo",
                  element: renderizarPagina(NovaContaPagar),
                },
                {
                  path: "/financeiro/contas-a-pagar/:id",
                  element: renderizarPagina(VisualizarContaPagar),
                },
                {
                  path: "/financeiro/contas-a-pagar/:id/editar",
                  element: renderizarPagina(EditarContaPagar),
                },
                {
                  path: "/financeiro/formas-pagamento",
                  element: renderizarPagina(FormasPagamento),
                },
                {
                  path: "/financeiro/formas-pagamento/novo",
                  element: renderizarPagina(NovaFormaPagamento),
                },
                {
                  path: "/financeiro/formas-pagamento/:id",
                  element: renderizarPagina(VisualizarFormaPagamento),
                },
                {
                  path: "/financeiro/formas-pagamento/:id/editar",
                  element: renderizarPagina(EditarFormaPagamento),
                },
                {
                  path: "/financeiro/contas-a-receber",
                  element: renderizarPagina(ContasReceber),
                },
                {
                  path: "/financeiro/contas-a-receber/:id",
                  element: renderizarPagina(VisualizarContaReceber),
                },
                {
                  path: "/financeiro/fluxo-caixa",
                  element: renderizarPagina(FluxoCaixa),
                },
                {
                  path: "/configuracoes",
                  element: renderizarPagina(Configuracoes),
                },
                {
                  path: "/configuracoes/editar",
                  element: renderizarPagina(EditarConfiguracoes),
                },
                {
                  path: "/configuracoes/minha-conta",
                  element: renderizarPagina(MinhaContaPage),
                },
                {
                  path: "/secretarias",
                  element: renderizarPagina(Secretarias),
                },
                {
                  path: "/secretarias/novo",
                  element: renderizarPagina(NovaSecretaria),
                },
                {
                  path: "/secretarias/:id",
                  element: renderizarPagina(VisualizarSecretaria),
                },
                {
                  path: "/secretarias/:id/editar",
                  element: renderizarPagina(EditarSecretaria),
                },
              ],
            },
          ],
        },
        {
          path: "*",
          element: renderizarPagina(PaginaNaoEncontrada),
        },
      ],
    },
  ];
}

const router = createBrowserRouter(
  apiConfig.tenantSubdomain ? criarRotasTenant() : criarRotasPublicas(),
);

export { router };
