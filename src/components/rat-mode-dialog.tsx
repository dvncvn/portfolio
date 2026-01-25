"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

type RatModeDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function RatModeDialog({ isOpen, onClose, onConfirm }: RatModeDialogProps) {
  const [selectedIndex, setSelectedIndex] = useState(1); // 0 = Cancel, 1 = Enter
  const cancelRef = useRef<HTMLButtonElement>(null);
  const enterRef = useRef<HTMLButtonElement>(null);

  // Reset selection when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(1); // Default to "Enter"
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(0); // Cancel
          break;
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex(1); // Enter
          break;
        case "Tab":
          e.preventDefault();
          setSelectedIndex((prev) => (prev === 0 ? 1 : 0));
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (selectedIndex === 0) {
            onClose();
          } else {
            onConfirm();
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onConfirm, selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed left-1/2 top-1/2 z-50 w-[360px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-white/10 bg-[#151413]/95 shadow-2xl backdrop-blur-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rat-mode-title"
          >
            {/* Content */}
            <div className="p-6">
              <h2
                id="rat-mode-title"
                className="font-mono text-[14px] font-medium uppercase tracking-wider text-foreground"
              >
                🐀 Enter Rat Mode?
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
                Proceed with caution.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-white/5 px-4 py-3">
              <button
                ref={cancelRef}
                onClick={onClose}
                onMouseEnter={() => setSelectedIndex(0)}
                className={`rounded-lg px-4 py-2 font-mono text-[12px] transition-colors ${
                  selectedIndex === 0
                    ? "bg-white/10 text-foreground ring-1 ring-white/20"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
              >
                Cancel
              </button>
              <button
                ref={enterRef}
                onClick={onConfirm}
                onMouseEnter={() => setSelectedIndex(1)}
                className={`rounded-lg px-4 py-2 font-mono text-[12px] transition-colors ${
                  selectedIndex === 1
                    ? "bg-white/20 text-foreground ring-1 ring-white/30"
                    : "bg-white/10 text-foreground hover:bg-white/20"
                }`}
              >
                Enter
              </button>
            </div>

            {/* Keyboard hints */}
            <div className="flex items-center gap-4 border-t border-white/5 px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <kbd className="rounded border border-white/10 bg-white/5 px-1 py-0.5 font-mono text-[10px] text-muted-foreground">
                  ←
                </kbd>
                <kbd className="rounded border border-white/10 bg-white/5 px-1 py-0.5 font-mono text-[10px] text-muted-foreground">
                  →
                </kbd>
                <span className="font-mono text-[10px] text-[#5a5a5a]">navigate</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  ↵
                </kbd>
                <span className="font-mono text-[10px] text-[#5a5a5a]">select</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  ESC
                </kbd>
                <span className="font-mono text-[10px] text-[#5a5a5a]">close</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
