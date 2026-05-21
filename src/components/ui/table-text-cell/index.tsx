import styles from "./styles.module.css";

type Tone = "default" | "muted" | "danger" | "success" | "info";

type TableTextCellProps = {
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  primaryTone?: Tone;
  secondaryTone?: Tone;
  primaryTitle?: string;
  secondaryTitle?: string;
  align?: "left" | "center" | "right";
};

const toneClass: Record<Tone, string> = {
  default: styles.toneDefault,
  muted: styles.toneMuted,
  danger: styles.toneDanger,
  success: styles.toneSuccess,
  info: styles.toneInfo,
};

export function TableTextCell({
  primary,
  secondary,
  primaryTone = "default",
  secondaryTone = "muted",
  primaryTitle,
  secondaryTitle,
  align = "left",
}: TableTextCellProps) {
  const alignClass = align === "right"
    ? styles.alignRight
    : align === "center"
      ? styles.alignCenter
      : styles.alignLeft;

  return (
    <div className={`${styles.cell} ${alignClass}`.trim()}>
      <span
        className={`${styles.primary} ${toneClass[primaryTone]}`.trim()}
        title={primaryTitle}
      >
        {primary}
      </span>
      {secondary && (
        <span
          className={`${styles.secondary} ${toneClass[secondaryTone]}`.trim()}
          title={secondaryTitle}
        >
          {secondary}
        </span>
      )}
    </div>
  );
}
