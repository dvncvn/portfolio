"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { DndCharacterOverlay } from "./dnd-character-overlay";

type DndHoverCardProps = {
  children: React.ReactNode;
  zIndex?: number;
  position?: "above" | "below";
};

const POPOVER_HEIGHT = 300;
const POPOVER_WIDTH = 232; // 200px image + 32px padding
const GAP = 12;

export function DndHoverCard({ children, zIndex = 50, position = "above" }: DndHoverCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate position synchronously from trigger ref
  const getStyles = useCallback((): React.CSSProperties => {
    if (!triggerRef.current) return { position: "fixed", opacity: 0 };
    const rect = triggerRef.current.getBoundingClientRect();
    
    if (position === "above") {
      return {
        position: "fixed",
        top: rect.top - POPOVER_HEIGHT - GAP,
        left: rect.left + rect.width / 2 - POPOVER_WIDTH / 2,
        zIndex,
      };
    } else {
      return {
        position: "fixed",
        top: rect.bottom + GAP,
        left: rect.left + rect.width / 2 - POPOVER_WIDTH / 2,
        zIndex,
      };
    }
  }, [position, zIndex]);

  const handleMouseEnter = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsHovered(true);
  }, []);

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
    setIsHovered(false);
    setOverlayOpen(true);
  };

  return (
    <>
      <span
        ref={triggerRef}
        className="cursor-pointer border-b border-dashed border-muted-foreground/50 transition-colors hover:border-foreground hover:text-foreground"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </span>
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: position === "above" ? 8 : -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: position === "above" ? 8 : -8, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                style={getStyles()}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  onClick={handleClick}
                  className="group block cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-[#151413]/95 p-4 shadow-2xl backdrop-blur-xl transition-all duration-200 hover:border-white/30 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                >
                  {/* Character art */}
                  <div className="relative h-[200px] w-[200px] overflow-hidden rounded-lg bg-[#1a1918]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/dnd-character.png"
                      alt="Perrin Burrowfen"
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/40">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        View character info
                      </span>
                    </div>
                  </div>
                  {/* Character info */}
                  <div className="mt-3 text-center">
                    <span
                      className="block text-[22px] text-foreground"
                      style={{ fontFamily: "var(--font-jacquard-24)" }}
                    >
                      Perrin Burrowfen
                    </span>
                    <span className="mt-1 block font-mono text-[11px] text-muted-foreground">
                      Level 3 Twilight Cleric
                    </span>
                  </div>
                </button>
                {/* Arrow + invisible bridge for easier hover navigation */}
                {position === "above" ? (
                  <>
                    <div className="absolute left-1/2 top-full -translate-x-1/2">
                      <div className="h-0 w-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white/10" />
                    </div>
                    {/* Invisible bridge extending down toward trigger */}
                    <div className="absolute left-1/2 top-full h-[24px] w-[80px] -translate-x-1/2" />
                  </>
                ) : (
                  <>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2">
                      <div className="h-0 w-0 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-white/10" />
                    </div>
                    {/* Invisible bridge extending up toward trigger */}
                    <div className="absolute bottom-full left-1/2 h-[24px] w-[80px] -translate-x-1/2" />
                  </>
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
