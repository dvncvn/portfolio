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

const POPOVER_HEIGHT = 332;
const POPOVER_WIDTH = 264;
const GAP = 12;

// An exiting preview must stop hit-testing immediately, even while it fades.
function PreviewSurface({ children, style, position, onEnter, onLeave }: {
  children: React.ReactNode;
  style: React.CSSProperties;
  position: "above" | "below";
  onEnter: () => void;
  onLeave: () => void;
}) {
  const present = useIsPresent();
  const reducedMotion = useReducedMotion();
  return <motion.div
    initial={{ opacity: 0, y: reducedMotion ? 0 : position === "above" ? 6 : -6 }}
    animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
    transition={{ duration: reducedMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
    style={{ ...style, pointerEvents: present ? 'auto' : 'none' }}
    inert={!present}
    onPointerEnter={onEnter} onPointerLeave={onLeave}>
    {children}
  </motion.div>;
}

export function DndHoverCard({ children, zIndex = 50, position = "above" }: DndHoverCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [popoverStyles, setPopoverStyles] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const suppressHoverRef = useRef(false);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewOpen = useRef(false);
  const clearTimers = useCallback(() => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
    closeTimeoutRef.current = null;
    openTimeoutRef.current = null;
  }, []);
  const closePreview = useCallback(() => {
    clearTimers();
    previewOpen.current = false;
    setIsHovered(false);
  }, [clearTimers]);

  // Measure on hover, before displaying the preview.
  const getStyles = useCallback((): React.CSSProperties => {
    if (!triggerRef.current) return { position: "fixed", opacity: 0 };
    const rect = triggerRef.current.getBoundingClientRect();

    const above = rect.top - POPOVER_HEIGHT - GAP;
    const below = rect.bottom + GAP;
    const preferredTop = position === "above"
      ? (above >= 12 ? above : below)
      : (below + POPOVER_HEIGHT <= window.innerHeight - 12 ? below : above);
    return {
      position: "fixed",
      top: Math.max(12, Math.min(preferredTop, window.innerHeight - POPOVER_HEIGHT - 12)),
      left: Math.max(12, Math.min(rect.left + rect.width / 2 - POPOVER_WIDTH / 2, window.innerWidth - POPOVER_WIDTH - 12)),
      zIndex,
    };
  }, [position, zIndex]);

  const enterTrigger = () => {
    if (overlayOpen || suppressHoverRef.current) return;
    clearTimers();
    openTimeoutRef.current = setTimeout(() => {
      openTimeoutRef.current = null;
      setPopoverStyles(getStyles());
      previewOpen.current = true;
      setIsHovered(true);
    }, 100);
  };

  const enterPreview = () => {
    // Keeping an open preview alive must never resurrect an exiting one.
    if (previewOpen.current && !suppressHoverRef.current) clearTimers();
  };
  const leavePreview = () => {
    clearTimers();
    closeTimeoutRef.current = setTimeout(closePreview, 200);
  };

  useEffect(() => {
    const dismiss = () => closePreview();
    const trackPointer = (event: PointerEvent) => {
      pointerRef.current = { x: event.clientX, y: event.clientY };
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && previewOpen.current) {
        event.preventDefault();
        event.stopImmediatePropagation();
        suppressHoverRef.current = true;
        closePreview();
      }
    };
    window.addEventListener('scroll', dismiss, true);
    window.addEventListener('pointermove', trackPointer, { passive: true });
    window.addEventListener('resize', dismiss);
    window.addEventListener('blur', dismiss);
    window.addEventListener('keydown', escape, true);
    document.addEventListener('visibilitychange', dismiss);
    return () => {
      clearTimers();
      window.removeEventListener('scroll', dismiss, true);
      window.removeEventListener('pointermove', trackPointer);
      window.removeEventListener('resize', dismiss);
      window.removeEventListener('blur', dismiss);
      window.removeEventListener('keydown', escape, true);
      document.removeEventListener('visibilitychange', dismiss);
    };
  }, [clearTimers, closePreview]);

  const handleClick = () => {
    suppressHoverRef.current = true;
    closePreview();
    setOverlayOpen(true);
  };

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className="cursor-pointer border-b border-dashed border-muted-foreground/50 bg-transparent p-0 text-inherit [font:inherit] transition-colors hover:border-foreground hover:text-foreground focus-visible:outline focus-visible:outline-offset-4"
        aria-label="D&D player: view Perrin Burrowfen"
        onClick={handleClick}
        onPointerEnter={event => { if (event.pointerType !== 'touch') enterTrigger(); }}
        onPointerLeave={() => {
          if (!overlayOpen) suppressHoverRef.current = false;
          leavePreview();
        }}
        onPointerCancel={closePreview}
      >
        {children}
      </button>
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isHovered && !overlayOpen && (
              <PreviewSurface style={popoverStyles} position={position}
                onEnter={enterPreview} onLeave={leavePreview}>
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
              </PreviewSurface>
            )}
          </AnimatePresence>,
          document.body
        )}
      
      {/* Character overlay */}
      <DndCharacterOverlay isOpen={overlayOpen} onClose={() => {
        const rect = triggerRef.current?.getBoundingClientRect();
        const pointer = pointerRef.current;
        // Closing a layer beneath a stationary pointer isn't a fresh hover.
        suppressHoverRef.current = !!(rect && pointer && pointer.x >= rect.left &&
          pointer.x <= rect.right && pointer.y >= rect.top && pointer.y <= rect.bottom);
        setOverlayOpen(false);
      }} />
    </>
  );
}
