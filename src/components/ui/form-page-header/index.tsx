import { FaChevronLeft } from "react-icons/fa";
import styles from "./styles.module.css";

type FormPageHeaderProps = {
  title: string;
  subtitle?: string;
  onBack: () => void;
  backLabel: string;
};

export function FormPageHeader({
  title,
  subtitle,
  onBack,
  backLabel,
}: FormPageHeaderProps) {
  return (
    <div className={styles.titleWithBack}>
      <button
        type="button"
        className={styles.backBtn}
        onClick={onBack}
        aria-label={backLabel}
      >
        <FaChevronLeft />
      </button>
      <div>
        <h1 className={styles.pageTitle}>{title}</h1>
        {subtitle && <p className={styles.pageSubtitle}>{subtitle}</p>}
      </div>
    </div>
  );
}
