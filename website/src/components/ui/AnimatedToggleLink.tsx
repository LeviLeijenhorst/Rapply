import React from "react";

import styles from "./AnimatedToggleLink.module.css";

type Variant = "filled" | "outlined";

type AnimatedToggleLinkProps = {
  label: string;
  href?: string;
  variant: Variant;
  withArrow?: boolean;
};

export function AnimatedToggleLink({ label, href, variant, withArrow }: AnimatedToggleLinkProps) {
  const className = `${styles.root} ${variant === "filled" ? styles.filled : styles.outlined}`;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!href) {
      return;
    }

    if (!href.startsWith("#")) {
      return;
    }

    event.preventDefault();

    const target = document.querySelector(href);
    if (!(target instanceof HTMLElement)) {
      return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const arrow = withArrow ? (
    <svg className={styles.arrowIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 6L19 12L13 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : null;

  const content = (
    <>
      <span className={styles.fill} aria-hidden />
      <span className={styles.measure} aria-hidden>
        <span>{label}</span>
        {arrow}
      </span>
      <span className={styles.labelBase} aria-hidden>
        <span className={styles.labelBaseText}>{label}</span>
        {arrow}
      </span>
      <span className={styles.labelFill} aria-hidden>
        <span className={styles.labelFillText}>{label}</span>
        {arrow}
      </span>
    </>
  );

  if (href) {
    return (
      <a className={className} href={href} onClick={handleClick}>
        {content}
      </a>
    );
  }

  return (
    <button className={className} type="button" onClick={handleClick}>
      {content}
    </button>
  );
}

