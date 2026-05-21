import styles from "./styles.module.css";

type TableActionButtonTone = "default" | "success" | "danger";

type TableActionButtonProps = {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  tone?: TableActionButtonTone;
  disabled?: boolean;
  title?: string;
};

export function TableActionButton({
  icon,
  label,
  onClick,
  tone = "default",
  disabled = false,
  title,
}: TableActionButtonProps) {
  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onClick?.();
  }

  return (
    <button
      type="button"
      className={`${styles.button} ${styles[tone]}`}
      aria-label={label}
      title={title}
      onClick={handleClick}
      disabled={disabled}
    >
      {icon}
    </button>
  );
}
