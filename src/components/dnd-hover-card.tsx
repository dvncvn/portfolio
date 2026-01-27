"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

type DndHoverCardProps = {
  children: React.ReactNode;
  zIndex?: number;
  position?: "above" | "below";
};

export function DndHoverCard({ children, zIndex = 50, position = "above" }: DndHoverCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [styles, setStyles] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (isHovered && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverHeight = 300;
      const popoverWidth = 232; // 200px image + 32px padding
      const gap = 12;
      
      if (position === "above") {
        setStyles({
          position: "fixed",
          top: rect.top - popoverHeight - gap,
          left: rect.left + rect.width / 2 - popoverWidth / 2,
          zIndex,
        });
      } else {
        setStyles({
          position: "fixed",
          top: rect.bottom + gap,
          left: rect.left + rect.width / 2 - popoverWidth / 2,
          zIndex,
        });
      }
    }
  }, [isHovered, zIndex, position]);

  return (
    <>
      <span
        ref={triggerRef}
        className="cursor-pointer border-b border-dashed border-muted-foreground/50 transition-colors hover:border-foreground hover:text-foreground"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
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
                style={styles}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <a
                  href="https://www.dndbeyond.com/characters/159073918"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-xl border border-white/10 bg-[#151413]/95 p-4 shadow-2xl backdrop-blur-xl transition-colors hover:border-white/20"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Character art */}
                  <div className="relative h-[200px] w-[200px] overflow-hidden rounded-lg bg-[#1a1918]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/dnd-character.png"
                      alt="Perrin Burrowfen"
                      className="h-full w-full object-cover"
                    />
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
                </a>
                {/* Arrow */}
                {position === "above" ? (
                  <div className="absolute left-1/2 top-full -translate-x-1/2">
                    <div className="h-0 w-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white/10" />
                  </div>
                ) : (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2">
                    <div className="h-0 w-0 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-white/10" />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
