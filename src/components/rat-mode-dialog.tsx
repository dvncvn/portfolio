"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

type RatModeDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

type EmojiDrop = {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
};

// Generate drops outside component to avoid Math.random during render
function generateDrops(): EmojiDrop[] {
  const items: EmojiDrop[] = [];
  for (let i = 0; i < 30; i++) {
    items.push({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 3,
      size: 14 + Math.random() * 14,
    });
  }
  return items;
}

function EmojiRain() {
  const [drops] = useState<EmojiDrop[]>(generateDrops);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {drops.map((drop) => (
        <motion.div
          key={drop.id}
          className="absolute"
          style={{
            left: `${drop.x}%`,
            fontSize: drop.size,
            top: -40,
          }}
          animate={{
            y: ["0vh", "110vh"],
          }}
          transition={{
            duration: drop.duration,
            delay: drop.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          🐀
        </motion.div>
      ))}
    </div>
  );
}

// Rainbow animated text component
function RainbowText({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="bg-clip-text text-transparent"
      style={{
        backgroundImage: "linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000)",
        backgroundSize: "200% 100%",
        animation: "rainbow-shift 3s linear infinite",
      }}
    >
      {children}
    </span>
  );
}

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
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Emoji rain across the whole screen */}
          <EmojiRain />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed left-1/2 top-1/2 z-[51] w-[400px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-white/10 bg-background shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rat-mode-title"
          >

            {/* Content */}
            <div className="relative z-10 p-8">
              <div className="flex gap-6">
                {/* Rat image */}
                <div className="flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/rat.png"
                    alt="Rat"
                    className="h-[100px] w-[100px] object-contain"
                    style={{ imageRendering: "pixelated" }}
                  />
                </div>
                <div className="space-y-3">
                  <h2
                    id="rat-mode-title"
                    className="text-[28px] text-foreground"
                    style={{ fontFamily: "var(--font-jacquard-24)" }}
                  >
                    Enter <RainbowText>Rat Mode</RainbowText>?
                  </h2>
                  <p className="text-[15px] leading-relaxed text-muted-foreground">
                    Proceed with <span className="text-foreground">caution</span>.
                  </p>
                  <p className="text-[12px] text-muted-foreground/60">
                    (Press ESC to exit anytime.)
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="relative z-10 flex items-center justify-end gap-3 border-t border-white/10 bg-black/20 px-6 py-4">
              <button
                ref={cancelRef}
                onClick={onClose}
                onMouseEnter={() => setSelectedIndex(0)}
                className={`rounded-lg px-5 py-2.5 text-[14px] font-medium transition-all ${
                  selectedIndex === 0
                    ? "bg-white/15 text-foreground ring-1 ring-white/30"
                    : "text-muted-foreground hover:bg-white/10 hover:text-foreground"
                }`}
              >
                Flee 🏃
              </button>
              <button
                ref={enterRef}
                onClick={onConfirm}
                onMouseEnter={() => setSelectedIndex(1)}
                className={`rounded-lg px-5 py-2.5 text-[14px] font-medium transition-all ${
                  selectedIndex === 1
                    ? "bg-white/25 text-foreground ring-1 ring-white/40"
                    : "bg-white/15 text-foreground hover:bg-white/25"
                }`}
              >
                Enter 🐀
              </button>
            </div>

            {/* Keyboard hints */}
            <div className="relative z-10 flex items-center gap-4 border-t border-white/5 bg-black/30 px-6 py-3">
              <div className="flex items-center gap-1.5">
                <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  ←
                </kbd>
                <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  →
                </kbd>
                <span className="font-mono text-[10px] text-muted-foreground/60">navigate</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  ↵
                </kbd>
                <span className="font-mono text-[10px] text-muted-foreground/60">select</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
