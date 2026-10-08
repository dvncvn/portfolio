"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import styles from "./dnd-character.module.css";

export function CharacterCriticalFailure({ closing, onDismiss, onExited }: {
  closing: boolean;
  onDismiss: () => void;
  onExited: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const dismiss = useRef<HTMLButtonElement>(null);
  const title = useRef<HTMLSpanElement>(null);
  const entrance = useRef<Animation[]>([]);

  useEffect(() => {
    const previous = document.activeElement;
    dismiss.current?.focus({ preventScroll: true });
    const timeout = window.setTimeout(onDismiss, 4200);
    return () => {
      window.clearTimeout(timeout);
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true });
    };
  }, [onDismiss]);

  useLayoutEffect(() => {
    const surface = dismiss.current;
    const heading = title.current;
    if (!surface || !heading) return;
    entrance.current = [
      surface.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: reducedMotion ? 150 : 850, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards',
      }),
      heading.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: reducedMotion ? 150 : 1200, delay: reducedMotion ? 0 : 400, fill: 'both', easing: 'ease-out',
      }),
      heading.animate([{ transform: reducedMotion ? 'none' : 'scale(0.94)' }, { transform: reducedMotion ? 'none' : 'scale(1.025)' }], {
        duration: reducedMotion ? 0 : 4200, fill: 'forwards', easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }),
    ];
    return () => entrance.current.forEach(animation => animation.cancel());
  }, [reducedMotion]);

  useLayoutEffect(() => {
    if (!closing || !dismiss.current || !title.current) return;
    const surface = dismiss.current;
    const heading = title.current;
    // Freeze the exact rendered entrance state before canceling it. Only the
    // containing surface fades out, so no child animation can restart or flash.
    const opacity = getComputedStyle(surface).opacity;
    const headingStyle = getComputedStyle(heading);
    heading.style.opacity = headingStyle.opacity;
    heading.style.transform = headingStyle.transform;
    surface.style.opacity = opacity;
    entrance.current.forEach(animation => animation.cancel());
    const exit = surface.animate([{ opacity }, { opacity: 0 }], {
      duration: reducedMotion ? 150 : 650, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards',
    });
    let active = true;
    void exit.finished.then(() => { if (active) onExited(); }).catch(() => {});
    return () => { active = false; exit.cancel(); };
  }, [closing, reducedMotion, onExited]);

  return <button ref={dismiss} type="button" className={styles.criticalFailure}
    aria-label="Critical failure. Dismiss" onClick={onDismiss}>
    <span ref={title} className={styles.criticalFailureTitle} aria-hidden="true">CRITICAL FAILURE</span>
  </button>;
}
