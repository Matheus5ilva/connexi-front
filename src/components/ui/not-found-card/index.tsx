import { FaArrowLeft, FaExclamationCircle } from "react-icons/fa";
import styles from "./styles.module.css";

type NotFoundCardProps = {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
};

export function NotFoundCard({
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: NotFoundCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.iconWrapper} aria-hidden="true">
        <FaExclamationCircle />
      </div>
      <div className={styles.content}>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className={styles.actions}>
        <button className={styles.primaryButton} type="button" onClick={onAction}>
          <FaArrowLeft />
          <span>{actionLabel}</span>
        </button>
        {secondaryActionLabel && onSecondaryAction ? (
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={onSecondaryAction}
          >
            {secondaryActionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
