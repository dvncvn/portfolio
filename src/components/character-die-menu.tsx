"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import styles from "./dnd-character.module.css";

export function CharacterDieMenu({ x, y, onChoose, onClose }: {
  x: number;
  y: number;
  onChoose: (face: 1 | 20) => void;
  onClose: (restoreFocus: boolean) => void;
}) {
  const menu = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    menu.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    const outside = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node)) onClose(false);
    };
    const dismiss = () => onClose(false);
    document.addEventListener('pointerdown', outside);
    window.addEventListener('scroll', dismiss, true);
    window.addEventListener('resize', dismiss);
    return () => {
      document.removeEventListener('pointerdown', outside);
      window.removeEventListener('scroll', dismiss, true);
      window.removeEventListener('resize', dismiss);
    };
  }, [onClose]);

  return createPortal(<motion.div ref={menu} role="menu" aria-label="Tempt fate" data-die-menu
    className={styles.dieMenu}
    style={{ left: Math.max(12, Math.min(x, window.innerWidth - 252)), top: Math.max(12, Math.min(y, window.innerHeight - 108)) }}
    initial={{ opacity: 0, y: reducedMotion ? 0 : 4 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: reducedMotion ? 0 : 0.16 }}
    onKeyDown={event => {
      const buttons = Array.from(menu.current?.querySelectorAll<HTMLButtonElement>('button') ?? []);
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(true); }
      if (event.key === 'Tab') { event.preventDefault(); onClose(true); }
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
          : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
        buttons[next]?.focus();
      }
    }}>
    <button type="button" role="menuitem" className={styles.rollOption} onClick={() => onChoose(20)}>Just give me a nat 20</button>
    <button type="button" role="menuitem" className={styles.rollOption} onClick={() => onChoose(1)}>Humble me</button>
  </motion.div>, document.body);
}
