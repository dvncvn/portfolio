"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import styles from "./dnd-character.module.css";

export function CharacterCriticalFailure({ closing, onDismiss, onExited }: {
  closing: boolean;
  onDismiss: () => void;
  onExited: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const dismiss = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement;
    dismiss.current?.focus({ preventScroll: true });
    const timeout = window.setTimeout(onDismiss, 4200);
    return () => {
      window.clearTimeout(timeout);
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true });
    };
  }, [onDismiss]);

  return <motion.button ref={dismiss} type="button" className={styles.criticalFailure}
    aria-label="Critical failure. Dismiss" onClick={onDismiss}
    initial={{ opacity: 0 }} animate={{ opacity: closing ? 0 : 1 }}
    onAnimationComplete={target => {
      if (closing && typeof target === 'object' && !Array.isArray(target) && target.opacity === 0) onExited();
    }}
    transition={{ duration: reducedMotion ? 0.15 : closing ? 0.65 : 0.85, ease: [0.4, 0, 0.2, 1] }}>
    <motion.span className={styles.criticalFailureTitle} aria-hidden="true"
      initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.94 }}
      animate={{ opacity: closing ? 0 : 1, scale: reducedMotion ? 1 : 1.025 }}
      transition={{ opacity: { duration: reducedMotion ? 0.15 : closing ? 0.4 : 1.2, delay: reducedMotion || closing ? 0 : 0.4 },
        scale: { duration: 4.2, ease: [0.16, 1, 0.3, 1] } }}>
      CRITICAL FAILURE
    </motion.span>
  </motion.button>;
}
