"use client";

import { useEffect, useRef, type ReactNode, type PointerEvent, type MouseEvent } from "react";
import { motion, useMotionTemplate, useSpring } from "framer-motion";

// visualDuration uses seconds and preserves velocity when the pointer changes direction.
// useSpring passes duration straight to the generator, where it is milliseconds.
const spring = { visualDuration: 0.5, bounce: 0.2 };

export function TiltPhoto({ children, onClick, expanded, onHoverChange, disabled = false }: {
  disabled?: boolean;
  children: ReactNode;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  expanded: boolean;
  onHoverChange: (hovered: boolean) => void;
}) {
  const surface = useRef<HTMLDivElement>(null);
  const enabled = useRef(false);
  const rx = useSpring(0, spring);
  const ry = useSpring(0, spring);
  const shineX = useSpring(0, spring);
  const shineY = useSpring(0, spring);
  const shineOpacity = useSpring(0, spring);
  const transform = useMotionTemplate`perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  const reflection = useMotionTemplate`translate3d(${shineX}%, ${shineY}%, 0)`;

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const update = () => {
      enabled.current = query.matches;
      if (!query.matches) {
        rx.jump(0); ry.jump(0); shineOpacity.jump(0);
      }
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [rx, ry, shineOpacity]);

  useEffect(() => {
    if (expanded) {
      rx.set(0); ry.set(0); shineOpacity.set(0);
    }
  }, [expanded, rx, ry, shineOpacity]);

  const reset = () => {
    rx.set(0); ry.set(0); shineX.set(0); shineY.set(0); shineOpacity.set(0);
    onHoverChange(false);
  };
  const track = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || expanded || !enabled.current || event.pointerType === "touch" || !surface.current) return;
    // Measure the stationary wrapper so the rotated photo cannot feed back into tracking.
    const bounds = surface.current.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
    const y = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
    rx.set(-y * 6); ry.set(x * 6);
    shineX.set(x * 20); shineY.set(y * 20); shineOpacity.set(0.13);
  };

  return (
    <div ref={surface} onPointerEnter={() => onHoverChange(true)} onPointerMove={track} onPointerLeave={reset} onPointerCancel={reset}>
      <button
        disabled={disabled}
        type="button"
        aria-label="Edit photo effects"
        aria-expanded={expanded}
        aria-controls="photo-effects"
        popoverTarget="photo-effects"
        onClick={onClick}
        onFocus={() => onHoverChange(true)}
        onBlur={reset}
        onKeyDown={reset}
        className="relative block w-full cursor-pointer rounded-[24px] text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--highlight)]"
      >
        {/* Only the visual surface moves; hit testing stays on the stationary button. */}
        <motion.div
          data-photo-surface="true"
          style={{ transform }}
          className="pointer-events-none relative overflow-hidden rounded-[24px] bg-[#121212] shadow-lg"
        >
        {children}
        <motion.span aria-hidden="true" style={{ transform: reflection, opacity: shineOpacity }}
          className="pointer-events-none absolute -inset-1/2 bg-[radial-gradient(ellipse_at_center,white,transparent_60%)]" />
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[24px] border border-white/10" />
        </motion.div>
      </button>
    </div>
  );
}
