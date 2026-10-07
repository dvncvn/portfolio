"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion, useIsPresent } from "framer-motion";
import { createPortal } from "react-dom";
import { DndCharacterOverlay } from "./dnd-character-overlay";
import styles from "./dnd-character.module.css";

type DndHoverCardProps = {
  children: React.ReactNode;
  zIndex?: number;
  position?: "above" | "below";
};
type Placement = { left: number; top: number; width: number; height: number; scale: number; trigger: DOMRect };
const WIDTH = 264;
const HEIGHT = 332;
const GAP = 12;
const contains = (rect: { left: number; top: number; width: number; height: number }, x: number, y: number) =>
  x >= rect.left && x <= rect.left + rect.width && y >= rect.top && y <= rect.top + rect.height;

function PreviewSurface({ children, placement, zIndex, surfaceRef }: {
  children: React.ReactNode;
  placement: Placement;
  zIndex: number;
  surfaceRef: React.Ref<HTMLDivElement>;
}) {
  const present = useIsPresent();
  const reducedMotion = useReducedMotion();
  return <motion.div ref={surfaceRef}
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    transition={{ duration: reducedMotion ? 0 : 0.16, ease: 'easeOut' }}
    style={{ position: 'fixed', left: placement.left, top: placement.top,
      width: placement.width, height: placement.height, zIndex,
      pointerEvents: present ? 'auto' : 'none' }} inert={!present}>
    <div style={{ transform: `scale(${placement.scale})`, transformOrigin: 'top left', width: WIDTH, height: HEIGHT }}>
      {children}
    </div>
  </motion.div>;
}

export function DndHoverCard({ children, zIndex = 50, position = "above" }: DndHoverCardProps) {
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef(false);
  const blocked = useRef(false);
  const current = useRef<Placement | null>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const opening = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closing = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimers = useCallback(() => {
    if (opening.current) clearTimeout(opening.current);
    if (closing.current) clearTimeout(closing.current);
    opening.current = closing.current = null;
  }, []);
  const dismiss = useCallback(() => {
    clearTimers();
    current.current = null;
    setPlacement(null);
  }, [clearTimers]);

  useEffect(() => {
    const invalidate = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      const point = pointer.current;
      blocked.current = !!(rect && point && contains(rect, point.x, point.y));
      dismiss();
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      pointer.current = { x: event.clientX, y: event.clientY };
      const trigger = triggerRef.current;
      if (!trigger || overlayRef.current) return;
      const overTrigger = trigger.contains(event.target as Node);
      // After scroll, dismissal, or a takeover, require leaving the text first.
      if (blocked.current) {
        if (!overTrigger) blocked.current = false;
        else return;
      }
      if (overTrigger) {
        if (closing.current) clearTimeout(closing.current);
        closing.current = null;
        if (current.current || opening.current) return;
        opening.current = setTimeout(() => {
          opening.current = null;
          const point = pointer.current;
          if (!point || overlayRef.current || blocked.current ||
            !trigger.contains(document.elementFromPoint(point.x, point.y))) return;
          const rect = trigger.getBoundingClientRect();
          const above = rect.top - GAP - 12;
          const below = window.innerHeight - rect.bottom - GAP - 12;
          const useAbove = position === 'above' ? above >= HEIGHT || above >= below : !(below >= HEIGHT || below >= above);
          const scale = Math.max(0.1, Math.min(1, (window.innerWidth - 24) / WIDTH, (useAbove ? above : below) / HEIGHT));
          const width = WIDTH * scale;
          const height = HEIGHT * scale;
          const next = {
            left: Math.max(12, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 12)),
            top: useAbove ? rect.top - GAP - height : rect.bottom + GAP,
            width, height, scale, trigger: rect,
          };
          current.current = next;
          setPlacement(next);
        }, 120);
        return;
      }
      if (opening.current) clearTimeout(opening.current);
      opening.current = null;
      const card = current.current;
      if (!card) return;
      const gapTop = card.top < card.trigger.top ? card.top + card.height : card.trigger.bottom;
      const bridge = {
        left: Math.min(card.left, card.trigger.left), top: gapTop,
        width: Math.max(card.left + card.width, card.trigger.right) - Math.min(card.left, card.trigger.left), height: GAP,
      };
      const overCard = surfaceRef.current?.contains(event.target as Node);
      if (overCard || contains(bridge, event.clientX, event.clientY)) {
        if (closing.current) clearTimeout(closing.current);
        closing.current = null;
      } else if (!closing.current) {
        closing.current = setTimeout(dismiss, 120);
      }
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && (current.current || opening.current)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        invalidate();
      }
    };
    const outside = (event: PointerEvent) => {
      if (!triggerRef.current?.contains(event.target as Node) && !surfaceRef.current?.contains(event.target as Node)) invalidate();
    };
    const leaveWindow = (event: PointerEvent) => { if (!event.relatedTarget) invalidate(); };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', outside);
    window.addEventListener('pointerout', leaveWindow);
    window.addEventListener('pointercancel', invalidate);
    window.addEventListener('scroll', invalidate, true);
    window.addEventListener('resize', invalidate);
    window.addEventListener('blur', invalidate);
    window.addEventListener('keydown', key, true);
    document.addEventListener('visibilitychange', invalidate);
    return () => {
      clearTimers();
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', outside);
      window.removeEventListener('pointerout', leaveWindow);
      window.removeEventListener('pointercancel', invalidate);
      window.removeEventListener('scroll', invalidate, true);
      window.removeEventListener('resize', invalidate);
      window.removeEventListener('blur', invalidate);
      window.removeEventListener('keydown', key, true);
      document.removeEventListener('visibilitychange', invalidate);
    };
  }, [position, clearTimers, dismiss]);

  const handleClick = () => {
    overlayRef.current = true;
    blocked.current = true;
    dismiss();
    setOverlayOpen(true);
  };
  return <>
    <button type="button" ref={triggerRef}
      className="cursor-pointer border-b border-dashed border-muted-foreground/50 bg-transparent p-0 text-inherit [font:inherit] transition-colors hover:border-foreground hover:text-foreground focus-visible:outline focus-visible:outline-offset-4"
      aria-label="D&D player: view Perrin Burrowfen" onClick={handleClick}>
      {children}
    </button>
    {typeof document !== 'undefined' && createPortal(<AnimatePresence>
      {placement && !overlayOpen ? <PreviewSurface key="preview" placement={placement} zIndex={zIndex} surfaceRef={surfaceRef}>
                <button
                  type="button"
                  onClick={handleClick}
                  className={styles.card}
                  aria-label="View Perrin Burrowfen"
                >
                  {/* Character art */}
                  <div className={styles.portrait}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/dnd-character.png"
                      alt="Perrin Burrowfen"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  {/* Character info */}
                  <div className={styles.caption}>
                    <span
                      className={styles.name}
                      style={{ fontFamily: "var(--font-jacquard-24)" }}
                    >
                      Perrin Burrowfen
                    </span>
                    <span className={styles.subtitle}>
                      Level 7 · Twilight Cleric
                    </span>
                  </div>
                </button>
      </PreviewSurface> : null}
    </AnimatePresence>, document.body)}
    <DndCharacterOverlay isOpen={overlayOpen} onClose={() => {
      overlayRef.current = false;
      const rect = triggerRef.current?.getBoundingClientRect();
      const point = pointer.current;
      blocked.current = !!(rect && point && contains(rect, point.x, point.y));
      setOverlayOpen(false);
    }} />
  </>;
}
