import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FaChartLine,
  FaChevronDown,
  FaCreditCard,
  FaList,
  FaMoneyBillWave,
  FaMoneyCheckAlt,
  FaPowerOff,
  FaThLarge,
  FaUserCog,
  FaUsers,
} from "react-icons/fa";
import { encerrarSessaoAutenticada } from "../../auth/session";
import {
  usuarioPodeVerItemMenu,
  type ItemMenuVisual,
} from "../../auth/permissoes-visuais";
import { useSessaoAutenticada } from "../../auth/use-auth-session";
import { BrandLogo } from "../brand-logo";
import { authService } from "../../services/api";
import styles from "./styles.module.css";
import { APP_NAME, APP_DOMAIN, APP_VERSION } from "../../config/version";
import { getSegmentoLabels, type Segmento } from "../../config/segmento-labels";
import { getSegmentoIcons } from "../../config/segmento-icons";

type Props = {
  open: boolean;
  onClose: () => void;
  segmento: Segmento;
};

export function Sidebar({ open, onClose, segmento }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSessaoAutenticada();
  const labels = getSegmentoLabels(segmento);
  const icons = getSegmentoIcons(segmento);
  const AgendaIcon = icons.agenda;
  const PessoaIcon = icons.pessoa;
  const ProfissionalIcon = icons.profissional;
  const NegocioIcon = icons.negocio;
  const FinanceiroIcon = icons.financeiro;
  const ParceriaIcon = icons.parceria;
  const ServicoIcon = icons.servico;
  const ConfiguracaoIcon = icons.configuracao;
  const [dropdownOpen, setDropdownOpen] = useState({
    pacientes: false,
    profissional: false,
    consultorio: false,
    financeiro: false,
    configuracao: false,
  });
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isProfissionaisRoute =
    location.pathname.startsWith("/profissional") ||
    location.pathname.startsWith("/profissionais");
  const isSecretariasRoute = location.pathname.startsWith("/secretarias");
  const isConsultorioRoute =
    location.pathname.startsWith("/consultorio") ||
    location.pathname.startsWith("/consultorios") ||
    isSecretariasRoute;
  const isFinanceiroRoute = location.pathname.startsWith("/financeiro");
  const isConfiguracaoRoute = location.pathname.startsWith("/configuracoes");
  const isMinhaContaRoute = location.pathname === "/configuracoes/minha-conta";
  const isConfiguracoesSistemaRoute =
    location.pathname.startsWith("/configuracoes") && !isMinhaContaRoute;
  const podeVerMenu = (item: ItemMenuVisual) =>
    usuarioPodeVerItemMenu(user, item);
  const podeVerGrupoProfissional =
    podeVerMenu("profissional") || podeVerMenu("especialidades");
  const podeVerGrupoConsultorio =
    podeVerMenu("consultorio") || podeVerMenu("secretarias");
  const itensFinanceiros: readonly ItemMenuVisual[] = [
    "contasReceber",
    "contasPagar",
    "fluxoCaixa",
    "formasPagamento",
    "convenios",
    "servicos",
  ];
  const podeVerGrupoFinanceiro = itensFinanceiros.some(podeVerMenu);
  const podeVerGrupoConfiguracao =
    podeVerMenu("configuracoes") || podeVerMenu("minhaConta");

  const isProfissionalSubmenuOpen = dropdownOpen.profissional;
  const isConsultorioSubmenuOpen =
    dropdownOpen.consultorio || isConsultorioRoute;
  const isFinanceiroSubmenuOpen = dropdownOpen.financeiro;
  const isConfiguracaoSubmenuOpen =
    dropdownOpen.configuracao || isConfiguracaoRoute;

  function closeAllDropdowns() {
    setDropdownOpen({
      pacientes: false,
      profissional: false,
      consultorio: false,
      financeiro: false,
      configuracao: false,
    });
  }

  function handleCloseSidebar() {
    closeAllDropdowns();
    onClose();
  }

  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth > 768) {
      return;
    }

    onClose();
  }, [location.pathname, onClose]);

  function toggleDropdown(
    key:
      | "pacientes"
      | "profissional"
      | "consultorio"
      | "financeiro"
      | "configuracao",
  ) {
    setDropdownOpen((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function closeOnMobile() {
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      handleCloseSidebar();
    }
  }

  function handleSidebarMouseLeave() {
    if (typeof window !== "undefined" && window.innerWidth > 768) {
      closeAllDropdowns();
    }
  }

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await authService.encerrarSessao();
    } catch {
      // Keep logout flow deterministic even when API is unavailable.
    } finally {
      encerrarSessaoAutenticada();
      handleCloseSidebar();
      navigate("/login", { replace: true });
      setIsLoggingOut(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={`${styles.overlay} ${open ? styles.active : ""}`}
        onClick={handleCloseSidebar}
        aria-label="Fechar menu lateral"
        tabIndex={open ? 0 : -1}
      />

      <aside
        className={`${styles.sidebar} ${open ? styles.active : ""}`}
        onMouseLeave={handleSidebarMouseLeave}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>
            <BrandLogo className={styles.sidebarBrand} size={26} />
          </div>
        </div>

        <nav className={styles.navContainer} aria-label="Navegação principal">
          {podeVerMenu("home") ? (
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `${styles.navLinkMed} ${isActive ? styles.activeLink : ""}`
              }
              onClick={closeOnMobile}
            >
              <FaThLarge className={styles.icon} />
              <span className={styles.linkText}>Home</span>
            </NavLink>
          ) : null}

          {podeVerMenu("agenda") ? (
            <NavLink
              to="/agenda"
              className={({ isActive }) =>
                `${styles.navLinkMed} ${isActive ? styles.activeLink : ""}`
              }
              onClick={closeOnMobile}
            >
              <AgendaIcon className={styles.icon} />
              <span className={styles.linkText}>Agenda</span>
            </NavLink>
          ) : null}

          {podeVerMenu("pacientes") ? (
            <NavLink
              to="/pacientes"
              className={({ isActive }) =>
                `${styles.navLinkMed} ${isActive ? styles.activeLink : ""}`
              }
              onClick={closeOnMobile}
            >
              <PessoaIcon className={styles.icon} />
              <span className={styles.linkText}>{labels.pessoas}</span>
            </NavLink>
          ) : null}
          {podeVerGrupoProfissional ? (
            <div
              className={`${styles.navItemMed} ${isProfissionalSubmenuOpen ? styles.open : ""}`}
            >
            <button
              className={`${styles.navLinkMed} ${isProfissionaisRoute ? styles.activeLink : ""}`}
              onClick={() => toggleDropdown("profissional")}
              type="button"
              aria-expanded={isProfissionalSubmenuOpen}
              aria-controls="submenu-profissional"
            >
              <ProfissionalIcon className={styles.icon} />
              <span className={styles.linkText}>Profissional</span>
              <FaChevronDown className={styles.submenuArrow} />
            </button>

            <div className={styles.submenu} id="submenu-profissional">
              {podeVerMenu("profissional") ? (
                <NavLink
                  to="/profissional"
                  end
                  className={({ isActive }) =>
                    `${styles.submenuLink} ${isActive ? styles.activeSubmenuLink : ""}`
                  }
                  onClick={closeOnMobile}
                >
                  <ProfissionalIcon className={styles.icon} />
                  <span className={styles.linkText}>Meu Perfil</span>
                </NavLink>
              ) : null}

              {podeVerMenu("especialidades") ? (
                <NavLink
                  to="/profissional/especialidades"
                  className={({ isActive }) =>
                    `${styles.submenuLink} ${isActive ? styles.activeSubmenuLink : ""}`
                  }
                  onClick={closeOnMobile}
                >
                  <FaList className={styles.icon} />
                  <span className={styles.linkText}>Especialidades</span>
                </NavLink>
              ) : null}
            </div>
            </div>
          ) : null}

          {podeVerGrupoConsultorio ? (
            <div
              className={`${styles.navItemMed} ${isConsultorioSubmenuOpen ? styles.open : ""}`}
            >
            <button
              className={`${styles.navLinkMed} ${isConsultorioRoute ? styles.activeLink : ""}`}
              onClick={() => toggleDropdown("consultorio")}
              type="button"
              aria-expanded={isConsultorioSubmenuOpen}
              aria-controls="submenu-consultorio"
            >
              <NegocioIcon className={styles.icon} />
              <span className={styles.linkText}>{labels.negocio}</span>
              <FaChevronDown className={styles.submenuArrow} />
            </button>

            <div className={styles.submenu} id="submenu-consultorio">
              {podeVerMenu("consultorio") ? (
                <NavLink
                  to="/consultorio"
                  className={({ isActive }) =>
                    `${styles.submenuLink} ${isActive ? styles.activeSubmenuLink : ""}`
                  }
                  onClick={closeOnMobile}
                >
                  <NegocioIcon className={styles.icon} />
                  <span className={styles.linkText}>Dados do negócio</span>
                </NavLink>
              ) : null}

              {podeVerMenu("secretarias") ? (
                <NavLink
                  to="/secretarias"
                  className={({ isActive }) =>
                    `${styles.submenuLink} ${isActive ? styles.activeSubmenuLink : ""}`
                  }
                  onClick={closeOnMobile}
                >
                  <FaUsers className={styles.icon} />
                  <span className={styles.linkText}>Secretárias</span>
                </NavLink>
              ) : null}
            </div>
            </div>
          ) : null}

          {podeVerGrupoFinanceiro ? (
            <div
              className={`${styles.navItemMed} ${isFinanceiroSubmenuOpen ? styles.open : ""}`}
            >
            <button
              className={`${styles.navLinkMed} ${isFinanceiroRoute ? styles.activeLink : ""}`}
              onClick={() => toggleDropdown("financeiro")}
              type="button"
              aria-expanded={isFinanceiroSubmenuOpen}
              aria-controls="submenu-financeiro"
            >
              <FinanceiroIcon className={styles.icon} />
              <span className={styles.linkText}>Financeiro</span>
              <FaChevronDown className={styles.submenuArrow} />
            </button>

            <div className={styles.submenu} id="submenu-financeiro">
              {podeVerMenu("contasReceber") ? (
                <NavLink
                  to="/financeiro/contas-a-receber"
                  className={({ isActive }) =>
                    `${styles.submenuLink} ${isActive ? styles.activeSubmenuLink : ""}`
                  }
                  onClick={closeOnMobile}
                >
                  <FaMoneyBillWave className={styles.icon} />
                  <span className={styles.linkText}>Contas a Receber</span>
                </NavLink>
              ) : null}

              {podeVerMenu("contasPagar") ? (
                <NavLink
                  to="/financeiro/contas-a-pagar"
                  className={({ isActive }) =>
                    `${styles.submenuLink} ${isActive ? styles.activeSubmenuLink : ""}`
                  }
                  onClick={closeOnMobile}
                >
                  <FaMoneyCheckAlt className={styles.icon} />
                  <span className={styles.linkText}>Contas a Pagar</span>
                </NavLink>
              ) : null}

              {podeVerMenu("fluxoCaixa") ? (
                <NavLink
                  to="/financeiro/fluxo-caixa"
                  className={({ isActive }) =>
                    `${styles.submenuLink} ${isActive ? styles.activeSubmenuLink : ""}`
                  }
                  onClick={closeOnMobile}
                >
                  <FaChartLine className={styles.icon} />
                  <span className={styles.linkText}>Fluxo de Caixa</span>
                </NavLink>
              ) : null}

              {podeVerMenu("formasPagamento") ? (
                <NavLink
                  to="/financeiro/formas-pagamento"
                  className={({ isActive }) =>
                    `${styles.submenuLink} ${isActive ? styles.activeSubmenuLink : ""}`
                  }
                  onClick={closeOnMobile}
                >
                  <FaCreditCard className={styles.icon} />
                  <span className={styles.linkText}>Formas de Pagamento</span>
                </NavLink>
              ) : null}

              {podeVerMenu("convenios") ? (
                <NavLink
                  to="/financeiro/convenios"
                  className={({ isActive }) =>
                    `${styles.submenuLink} ${isActive ? styles.activeSubmenuLink : ""}`
                  }
                  onClick={closeOnMobile}
                >
                  <ParceriaIcon className={styles.icon} />
                  <span className={styles.linkText}>{labels.parcerias}</span>
                </NavLink>
              ) : null}

              {podeVerMenu("servicos") ? (
                <NavLink
                  to="/financeiro/servicos"
                  className={({ isActive }) =>
                    `${styles.submenuLink} ${isActive ? styles.activeSubmenuLink : ""}`
                  }
                  onClick={closeOnMobile}
                >
                  <ServicoIcon className={styles.icon} />
                  <span className={styles.linkText}>{labels.servicos}</span>
                </NavLink>
              ) : null}
            </div>
            </div>
          ) : null}

          {podeVerGrupoConfiguracao ? (
            <div
              className={`${styles.navItemMed} ${isConfiguracaoSubmenuOpen ? styles.open : ""}`}
            >
            <button
              className={`${styles.navLinkMed} ${isConfiguracaoRoute ? styles.activeLink : ""}`}
              onClick={() => toggleDropdown("configuracao")}
              type="button"
              aria-expanded={isConfiguracaoSubmenuOpen}
              aria-controls="submenu-configuracao"
            >
              <ConfiguracaoIcon className={styles.icon} />
              <span className={styles.linkText}>Configuração</span>
              <FaChevronDown className={styles.submenuArrow} />
            </button>

            <div className={styles.submenu} id="submenu-configuracao">
              {podeVerMenu("configuracoes") ? (
              <NavLink
                to="/configuracoes"
                className={() =>
                  `${styles.submenuLink} ${isConfiguracoesSistemaRoute ? styles.activeSubmenuLink : ""}`
                }
                onClick={closeOnMobile}
              >
                <ConfiguracaoIcon className={styles.icon} />
                <span className={styles.linkText}>Configurações</span>
              </NavLink>
              ) : null}

              {podeVerMenu("minhaConta") ? (
              <NavLink
                to="/configuracoes/minha-conta"
                className={() =>
                  `${styles.submenuLink} ${isMinhaContaRoute ? styles.activeSubmenuLink : ""}`
                }
                onClick={closeOnMobile}
              >
                <FaUserCog className={styles.icon} />
                <span className={styles.linkText}>Minha Conta</span>
              </NavLink>
              ) : null}
            </div>
          </div>
          ) : null}
        </nav>

        <div className={styles.sidebarFooter}>
          <button
            className={styles.navLinkMed}
            type="button"
            aria-label="Encerrar sessão"
            onClick={() => {
              void handleLogout();
            }}
            disabled={isLoggingOut}
          >
            <FaPowerOff className={styles.icon} />
            <span className={styles.linkText}>
              {isLoggingOut ? "Saindo..." : "Sair"}
            </span>
          </button>
          <p className={styles.productVersion}>
            {APP_NAME} • {APP_DOMAIN} • v{APP_VERSION}
          </p>
        </div>
      </aside>
    </>
  );
}
