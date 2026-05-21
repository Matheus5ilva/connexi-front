import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useId,
} from "react";
import styles from "./styles.module.css";

type Props = {
  label: string;
  id?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  colSpan?: "full" | "wide" | "normal";
};

export function FormField({
  label,
  id,
  required,
  error,
  hint,
  children,
  colSpan = "normal",
}: Props) {
  const autoId = useId();
  const fallbackId = `field-${autoId.replace(/:/g, "")}`;
  const fieldId = id ?? fallbackId;
  const errorId = error ? `${fieldId}-error` : undefined;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const childElement = isValidElement(children) ? children : null;
  const isNativeControl =
    !!childElement &&
    typeof childElement.type === "string" &&
    ["input", "select", "textarea"].includes(childElement.type);

  const controlId = isNativeControl
    ? ((childElement.props as { id?: string }).id ?? fieldId)
    : undefined;

  const enhancedChild =
    childElement && isNativeControl
      ? cloneElement(childElement as ReactElement<Record<string, unknown>>, {
          id: controlId,
          required:
            required ??
            (childElement.props as { required?: boolean }).required ??
            false,
          "aria-invalid": error ? true : undefined,
          "aria-describedby": describedBy,
        })
      : children;

  return (
    <div
      className={`${styles.field} ${colSpan === "full" ? styles.colFull : colSpan === "wide" ? styles.colWide : ""}`}
    >
      <label className={styles.label} htmlFor={controlId}>
        {label} {required && <span className={styles.required}>*</span>}
      </label>
      {enhancedChild}
      {hint && (
        <span className={styles.hint} id={hintId}>
          {hint}
        </span>
      )}
      {error && (
        <span className={styles.error} id={errorId} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
