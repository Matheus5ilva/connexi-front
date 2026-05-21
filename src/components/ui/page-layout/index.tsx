import styles from "./styles.module.css";

type Props = {
  children: React.ReactNode;
};

export function PageLayout({ children }: Props) {
  return <div className={styles.pageWrapper}>{children}</div>;
}
