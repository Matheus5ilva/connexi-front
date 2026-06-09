import { FaFileMedical, FaPlay } from "react-icons/fa";
import { StatusBadge } from "../../../../components/ui/status-badge";
import styles from "./item-historico.module.css";

type ItemHistoricoProps = {
  rotuloData: string;
  rotuloHora: string;
  profissional: string;
  tipoAtendimento: string;
  resumo: string;
  rotuloStatus: string;
  varianteStatus: "success" | "warning" | "danger" | "neutral" | "info";
  ativo: boolean;
  aoSelecionar: () => void;
  aoAbrirConsulta?: () => void;
};

export function ItemHistorico({
  rotuloData,
  rotuloHora,
  profissional,
  tipoAtendimento,
  resumo,
  rotuloStatus,
  varianteStatus,
  ativo,
  aoSelecionar,
  aoAbrirConsulta,
}: ItemHistoricoProps) {
  return (
    <article className={`${styles.card} ${ativo ? styles.active : ""}`.trim()}>
      <button
        type="button"
        className={styles.selectBtn}
        onClick={aoSelecionar}
        aria-pressed={ativo}
      >
        <div className={styles.topRow}>
          <div className={styles.dateBlock}>
            <strong>{rotuloData}</strong>
            <small>{rotuloHora}</small>
          </div>
          <StatusBadge label={rotuloStatus} variant={varianteStatus} />
        </div>

        <p className={styles.summary}>
          <FaFileMedical />
          <span>{resumo || "Sem resumo registrado."}</span>
        </p>

        <div className={styles.metaRow}>
          <span className={styles.metaChip}>{profissional}</span>
          <span className={styles.metaChip}>{tipoAtendimento}</span>
        </div>
      </button>

      {aoAbrirConsulta ? (
        <button
          type="button"
          className={styles.openBtn}
          onClick={aoAbrirConsulta}
        >
          <FaPlay />
          <span>Abrir atendimento</span>
        </button>
      ) : null}
    </article>
  );
}
