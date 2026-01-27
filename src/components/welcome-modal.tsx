"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { AsciiNoiseBackground } from "@/components/ascii-noise-background";
import type { VisitorConfig } from "@/content/visitors";

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
  for (let i = 0; i < 40; i++) {
    items.push({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4,
      size: 16 + Math.random() * 16,
    });
  }
  return items;
}

function EmojiRain({ emoji }: { emoji: string }) {
  const [drops] = useState<EmojiDrop[]>(generateDrops);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
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
          {emoji}
        </motion.div>
      ))}
    </div>
  );
}

type WelcomeModalProps = {
  visitor: VisitorConfig;
  onClose: () => void;
  onStartPresentation: () => void;
};

export function WelcomeModal({ visitor, onClose, onStartPresentation }: WelcomeModalProps) {
  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleBrowse = useCallback(() => {
    onClose();
  }, [onClose]);

  const handlePresentation = useCallback(() => {
    onClose();
    // Small delay to let the modal close animation start
    setTimeout(() => {
      onStartPresentation();
    }, 100);
  }, [onClose, onStartPresentation]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background"
      >
        {/* Background effects */}
        {visitor.emojiRain ? (
          <EmojiRain emoji={visitor.emojiRain} />
        ) : !visitor.hideAsciiNoise ? (
          <AsciiNoiseBackground
            className="pointer-events-none absolute inset-0"
            alpha={0.06}
            threshold={0.15}
            freq={0.04}
            speed={0.08}
          />
        ) : null}
        {/* Close button */}
        <button
          onClick={onClose}
          className="fixed right-6 top-6 z-10 cursor-pointer rounded-md p-2 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
          className={`mx-6 space-y-8 ${visitor.largeText ? "max-w-[640px]" : "max-w-[480px]"}`}
        >
          {/* Greeting */}
          <div className={visitor.largeText ? "space-y-6" : "space-y-4"}>
            <h1 className={`font-medium text-foreground ${visitor.largeText ? "text-[48px] leading-tight" : "text-[28px]"}`}>
              {visitor.greeting} 👋
            </h1>
            <p className={`leading-relaxed text-muted-foreground ${visitor.largeText ? "text-[20px]" : "text-[15px]"}`}>
              {visitor.message}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleBrowse}
              className="group/btn inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-white/[0.08] px-5 py-3 text-[14px] font-medium text-foreground transition-all duration-200 ease-out hover:bg-white/[0.12]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span>Browse Projects</span>
            </button>
            <button
              onClick={handlePresentation}
              className="group/btn inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-white/[0.1] px-5 py-3 text-[14px] text-muted-foreground transition-all duration-200 ease-out hover:border-white/[0.2] hover:text-foreground"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Presentation Mode</span>
            </button>
          </div>

          {/* Subtle hint */}
          <p className="text-[12px] text-muted-foreground/60">
            Press Escape to browse freely
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
