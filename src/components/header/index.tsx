import styles from "./styles.module.css";
import logo from "../../assets/logo.png";
import { FaBars } from "react-icons/fa";

type Props = {
  onToggleSidebar: () => void;
};

export function Header({ onToggleSidebar }: Props) {
  return (
    <header className={styles.mobileHeader}>
      <div className={styles.mobileLogoArea}>
        <img className={styles.brandSymbol} src={logo} alt="CONNEXI" />
        <span className={styles.mobileLogoName}>ONNEXI</span>
      </div>

      <button
        className={styles.mobileMenuBtn}
        onClick={onToggleSidebar}
        type="button"
        aria-label="Abrir menu de navegação"
      >
        <FaBars />
      </button>
    </header>
  );
}
