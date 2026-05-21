import styles from "./styles.module.css";
import { FaBars } from "react-icons/fa";
import { BrandLogo } from "../brand-logo";

type Props = {
  onToggleSidebar: () => void;
};

export function Header({ onToggleSidebar }: Props) {
  return (
    <header className={styles.mobileHeader}>
      <BrandLogo className={styles.mobileLogoArea} size={28} />

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
