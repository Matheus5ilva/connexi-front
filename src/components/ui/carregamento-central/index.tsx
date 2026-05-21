import styles from "./styles.module.css";

type CarregamentoCentralProps = {
  ocuparTelaInteira?: boolean;
};

export function CarregamentoCentral({
  ocuparTelaInteira = false,
}: CarregamentoCentralProps) {
  return (
    <div
      className={`${styles.container} ${
        ocuparTelaInteira ? styles.ocuparTelaInteira : ""
      }`}
      role="status"
      aria-live="polite"
      aria-label="Carregando"
    >
      <div className={styles.indicador} aria-hidden="true">
        <span className={styles.anelExterno} />
        <span className={styles.anelInterno} />
        <span className={styles.nucleo} />
      </div>
    </div>
  );
}
