import styles from "./styles.module.css";

type MetricTone = "default" | "positive" | "negative";

export type SummaryMetricItem = {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: MetricTone;
  highlight?: boolean;
};

type SummaryMetricsProps = {
  items: SummaryMetricItem[];
  ariaLabel: string;
  columns?: 2 | 3 | 4;
};

function getToneClass(tone: MetricTone | undefined): string {
  if (tone === "positive") {
    return styles.valuePositive;
  }

  if (tone === "negative") {
    return styles.valueNegative;
  }

  return "";
}

export function SummaryMetrics({
  items,
  ariaLabel,
  columns = 4,
}: SummaryMetricsProps) {
  return (
    <section
      className={styles.grid}
      aria-label={ariaLabel}
      style={{ ["--summary-columns" as string]: String(columns) }}
    >
      {items.map((item) => (
        <article
          key={item.label}
          className={`${styles.card} ${item.highlight ? styles.cardHighlight : ""}`.trim()}
        >
          <span className={styles.label}>{item.label}</span>
          <strong className={`${styles.value} ${getToneClass(item.tone)}`.trim()}>
            {item.value}
          </strong>
          {item.hint && <span className={styles.hint}>{item.hint}</span>}
        </article>
      ))}
    </section>
  );
}
