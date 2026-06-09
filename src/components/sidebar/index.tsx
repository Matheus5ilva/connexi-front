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
} from "react-icons/fa";
import { encerrarSessaoAutenticada } from "../../auth/session";
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
    financeiro: false,
    configuracao: false,
  });
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isProfissionaisRoute =
    location.pathname.startsWith("/profissional") ||
    location.pathname.startsWith("/profissionais");
  const isConsultorioRoute =
    location.pathname.startsWith("/consultorio") ||
    location.pathname.startsWith("/consultorios");

  const isFinanceiroRoute = location.pathname.startsWith("/financeiro");
  const isConfiguracaoRoute = location.pathname.startsWith("/configuracoes");
  const isMinhaContaRoute = location.pathname === "/configuracoes/minha-conta";
  const isConfiguracoesSistemaRoute = isConfiguracaoRoute && !isMinhaContaRoute;

  const isProfissionalSubmenuOpen = dropdownOpen.profissional;
  const isFinanceiroSubmenuOpen = dropdownOpen.financeiro;
  const isConfiguracaoSubmenuOpen =
    dropdownOpen.configuracao || isConfiguracaoRoute;

  function closeAllDropdowns() {
    setDropdownOpen({
      pacientes: false,
      profissional: false,
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
    key: "pacientes" | "profissional" | "financeiro" | "configuracao",
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
            </div>
          </div>

          <NavLink
            to="/consultorio"
            className={({ isActive }) =>
              `${styles.navLinkMed} ${isActive || isConsultorioRoute ? styles.activeLink : ""}`
            }
            onClick={closeOnMobile}
          >
            <NegocioIcon className={styles.icon} />
            <span className={styles.linkText}>{labels.negocio}</span>
          </NavLink>

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
            </div>
          </div>

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
            </div>
          </div>
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
