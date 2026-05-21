import styles from "./styles.module.css";

type StatusBadgeVariant = "success" | "warning" | "danger" | "neutral" | "info";

type StatusBadgeProps = {
  label: string;
  variant: StatusBadgeVariant;
};

export function StatusBadge({ label, variant }: StatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]}`}>
      {label}
    </span>
  );
}
