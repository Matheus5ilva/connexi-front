import { useEffect, useId, useRef } from "react";
import styles from "./styles.module.css";
import { FaTimes } from "react-icons/fa";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
};

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "520px",
}: Props) {
  const titleId = useId();
  const subtitleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const aoFecharRef = useRef(onClose);

  useEffect(() => {
    aoFecharRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        aoFecharRef.current();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!open) return null;

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div
        className={styles.modal}
        style={{ maxWidth }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
      >
        <div className={styles.modalHeader}>
          <div>
            <h5 className={styles.modalTitle} id={titleId}>
              {title}
            </h5>
            {subtitle && (
              <p className={styles.modalSubtitle} id={subtitleId}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            type="button"
            aria-label="Fechar modal"
            ref={closeButtonRef}
          >
            <FaTimes />
          </button>
        </div>

        <div className={styles.modalBody}>{children}</div>
      </div>
    </div>
  );
}
