import styles from "./styles.module.css";

type Props = {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
};

export function PageHeader({ title, subtitle, left, right }: Props) {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.headerLeft}>
        {left ?? (
          <div>
            <h2 className={styles.pageTitle}>{title}</h2>
            {subtitle && <p className={styles.pageSubtitle}>{subtitle}</p>}
          </div>
        )}
      </div>
      {right && <div className={styles.headerRight}>{right}</div>}
    </div>
  );
}
