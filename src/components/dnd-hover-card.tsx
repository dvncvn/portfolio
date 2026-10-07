"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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

export function DndHoverCard({ children, zIndex = 50, position = "above" }: DndHoverCardProps) {
  const reducedMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [popoverStyles, setPopoverStyles] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLSpanElement>(null);
  const suppressHoverRef = useRef(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleMouseEnter = useCallback(() => {
    if (suppressHoverRef.current) return;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setPopoverStyles(getStyles());
    setIsHovered(true);
  }, [getStyles]);

  const handleMouseLeave = useCallback(() => {
    // Generous delay to allow moving between trigger and popover
    closeTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 150);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    suppressHoverRef.current = true;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsHovered(false);
    setOverlayOpen(true);
  };

  return (
    <>
      <span
        ref={triggerRef}
        className="cursor-pointer border-b border-dashed border-muted-foreground/50 transition-colors hover:border-foreground hover:text-foreground"
        onMouseEnter={() => {
          if (!overlayOpen) {
            suppressHoverRef.current = false;
            handleMouseEnter();
          }
        }}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </span>
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isHovered && !overlayOpen && (
              <motion.div
                initial={{ opacity: 0, y: reducedMotion ? 0 : position === "above" ? 6 : -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                style={popoverStyles}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
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
                {/* Invisible bridge for easier hover navigation */}
                {position === "above" ? (
                  <div className="absolute left-1/2 top-full h-[24px] w-[80px] -translate-x-1/2" />
                ) : (
                  <div className="absolute bottom-full left-1/2 h-[24px] w-[80px] -translate-x-1/2" />
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      
      {/* Character overlay */}
      <DndCharacterOverlay isOpen={overlayOpen} onClose={() => setOverlayOpen(false)} />
    </>
  );
}
