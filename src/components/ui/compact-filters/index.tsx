import { FaFilter } from "react-icons/fa";
import styles from "./styles.module.css";

type CompactFiltersProps = {
  fields: React.ReactNode;
  advancedFields?: React.ReactNode;
  advancedVisible?: boolean;
  advancedActive?: boolean;
  onToggleAdvanced?: () => void;
  toggleCollapsedLabel?: string;
  toggleExpandedLabel?: string;
  advancedId?: string;
  showClear?: boolean;
  onClear?: () => void;
};

type CompactFilterFieldProps = {
  label: string;
  children: React.ReactNode;
  grow?: boolean;
};

export function CompactFilters({
  fields,
  advancedFields,
  advancedVisible = false,
  advancedActive = false,
  onToggleAdvanced,
  toggleCollapsedLabel = "Filtrar período",
  toggleExpandedLabel = "Ocultar período",
  advancedId,
  showClear = false,
  onClear,
}: CompactFiltersProps) {
  const hasAdvancedFields = Boolean(advancedFields);
  const shouldShowAdvanced = hasAdvancedFields && (advancedVisible || advancedActive);

  return (
    <section className={styles.card} aria-label="Filtros">
      <div className={styles.row}>
        <div className={styles.fields}>{fields}</div>

        <div className={styles.actions}>
          {hasAdvancedFields && onToggleAdvanced && (
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={onToggleAdvanced}
              aria-expanded={shouldShowAdvanced}
              aria-controls={advancedId}
            >
              <FaFilter />
              <span>{shouldShowAdvanced ? toggleExpandedLabel : toggleCollapsedLabel}</span>
            </button>
          )}

          {showClear && onClear && (
            <button type="button" className={styles.clearBtn} onClick={onClear}>
              Limpar
            </button>
          )}
        </div>
      </div>

      {shouldShowAdvanced && (
        <div className={styles.advancedRow} id={advancedId}>
          {advancedFields}
        </div>
      )}
    </section>
  );
}

export function CompactFilterField({
  label,
  children,
  grow = false,
}: CompactFilterFieldProps) {
  return (
    <label className={`${styles.field} ${grow ? styles.fieldGrow : ""}`}>
      <span className={styles.label}>{label}</span>
      {children}
    </label>
  );
}
