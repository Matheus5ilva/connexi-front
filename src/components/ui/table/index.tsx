import styles from "./styles.module.css";

type Column<T> = {
  key: keyof T | string;
  label: string;
  align?: "left" | "center" | "right";
  render?: (row: T) => React.ReactNode;
};

type Props<T> = {
  columns: Column<T>[];
  data: T[];
  caption?: string;
  emptyMessage?: string;
  getRowClassName?: (row: T) => string | undefined;
  onRowClick?: (row: T) => void;
  isRowClickable?: (row: T) => boolean;
  getRowAriaLabel?: (row: T) => string | undefined;
};

export function Table<T extends { id?: number | string }>({
  columns,
  data,
  caption,
  emptyMessage = "Nenhum registro encontrado.",
  getRowClassName,
  onRowClick,
  isRowClickable,
  getRowAriaLabel,
}: Props<T>) {
  return (
    <div className={styles.tableCard}>
      <div className={styles.tableResponsive}>
        <table className={styles.table}>
          {caption && <caption className={styles.caption}>{caption}</caption>}
          <thead className={styles.thead}>
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  scope="col"
                  className={styles[`align${col.align ?? "left"}`]}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr className={styles.tr}>
                <td className={styles.emptyCell} colSpan={columns.length}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const rowKey =
                  row.id !== undefined ? String(row.id) : `row-${index}`;
                const customRowClassName = getRowClassName?.(row);
                const rowIsClickable = Boolean(onRowClick) &&
                  (isRowClickable ? isRowClickable(row) : true);

                function handleRowKeyDown(event: React.KeyboardEvent<HTMLTableRowElement>) {
                  if (!rowIsClickable) {
                    return;
                  }

                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onRowClick?.(row);
                  }
                }

                return (
                  <tr
                    key={rowKey}
                    className={`${styles.tr} ${rowIsClickable ? styles.clickableRow : ""} ${customRowClassName || ""}`.trim()}
                    onClick={rowIsClickable ? () => onRowClick?.(row) : undefined}
                    onKeyDown={handleRowKeyDown}
                    role={rowIsClickable ? "button" : undefined}
                    tabIndex={rowIsClickable ? 0 : undefined}
                    aria-label={rowIsClickable ? getRowAriaLabel?.(row) : undefined}
                  >
                    {columns.map((col) => (
                      <td
                        key={String(col.key)}
                        className={styles[`align${col.align ?? "left"}`]}
                      >
                        {col.render
                          ? col.render(row)
                          : String((row as Record<string, unknown>)[String(col.key)] ?? "")}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
