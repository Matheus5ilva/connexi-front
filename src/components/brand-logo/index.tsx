import type { CSSProperties } from "react";
import logo from "../../assets/logo.png";
import styles from "./styles.module.css";

type BrandLogoProps = {
  className?: string;
  showText?: boolean;
  size?: number;
};

export function BrandLogo({
  className = "",
  showText = true,
  size = 28,
}: BrandLogoProps) {
  const style = {
    "--brand-logo-size": `${size}px`,
  } as CSSProperties;

  return (
    <span
      className={`${styles.brandLogo} ${className}`}
      style={style}
      data-brand-logo
    >
      <img
        className={styles.symbol}
        src={logo}
        alt={showText ? "" : "CONNEXI"}
        aria-hidden={showText}
        width={size}
        height={size}
        decoding="async"
        data-logo-symbol
      />
      {showText ? (
        <span className={styles.text} data-logo-text>
          CONNEXI
        </span>
      ) : null}
    </span>
  );
}
