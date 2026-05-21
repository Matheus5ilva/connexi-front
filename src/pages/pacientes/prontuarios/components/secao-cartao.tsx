import type { ReactNode } from "react";
import styles from "./secao-cartao.module.css";

type SecaoCartaoProps = {
  titulo: string;
  acao?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function SecaoCartao({
  titulo,
  acao,
  className,
  children,
}: SecaoCartaoProps) {
  return (
    <section className={`${styles.card} ${className || ""}`.trim()}>
      <header className={styles.header}>
        <h3>{titulo}</h3>
        {acao ? <div className={styles.action}>{acao}</div> : null}
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
