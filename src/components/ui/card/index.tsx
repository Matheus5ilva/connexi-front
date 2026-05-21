import styles from "./styles.module.css";

type Props = {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  iconColor?: string;
  iconBg?: string;
  variant?: "default" | "highlight";
};

export function Card({
  title,
  value,
  subtitle,
  icon,
  iconColor,
  iconBg,
  variant = "default",
}: Props) {
  return (
    <div
      className={`${styles.card} ${variant === "highlight" ? styles.highlight : ""}`}
    >
      {variant === "highlight" ? (
        <>
          <span className={styles.highlightLabel}>{title}</span>
          <div className={styles.highlightContent}>
            <div className={styles.highlightIcon}>{icon}</div>
            <div>
              <strong className={styles.highlightValue}>{value}</strong>
              <small className={styles.highlightSubtitle}>{subtitle}</small>
            </div>
          </div>
        </>
      ) : (
        <div className={styles.cardInner}>
          <div>
            <span className={styles.cardLabel}>{title}</span>
            <h4 className={styles.cardValue}>{value}</h4>
            <span className={styles.cardSubtitle}>{subtitle}</span>
          </div>
          <div
            className={styles.iconWrapper}
            style={{ background: iconBg, color: iconColor }}
          >
            {icon}
          </div>
        </div>
      )}
    </div>
  );
}
