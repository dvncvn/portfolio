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
  const [drops, setDrops] = useState<EmojiDrop[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDrops(generateDrops());
  }, []);

  if (!mounted) return null;

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

// Rainbow animated text component
function RainbowText({ children }: { children: string }) {
  return (
    <span
      className="font-mono bg-clip-text text-transparent animate-rainbow-shift"
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

// Parse inline backticks into rainbow text
function renderInlineCode(text: string, keyPrefix: string) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      const code = part.slice(1, -1);
      return <RainbowText key={`${keyPrefix}-${i}`}>{code}</RainbowText>;
    }
    return part;
  });
}

// Parse message and render backtick content as rainbow monospace, with paragraph support
function renderMessage(message: string) {
  const paragraphs = message.split(/\n\n+/);
  if (paragraphs.length === 1) {
    return renderInlineCode(message, "p0");
  }
  return paragraphs.map((para, i) => (
    <span key={i} className={i > 0 ? "block mt-4" : ""}>
      {renderInlineCode(para, `p${i}`)}
    </span>
  ));
}

type WelcomeModalProps = {
  visitor: VisitorConfig;
  onClose: () => void;
  onStartPresentation: () => void;
};

// Rat mode checkbox labels - index 4 is the troll checkbox that resets everything
const RAT_CHECKBOXES = [
  "I understand what I'm getting into",
  "I accept the consequences",
  "I am prepared for chaos",
  "I promise not to blame Simon",
  "Wait... I'm not actually a rat",  // TROLL - resets all
  "I have notified my next of kin",
  "I acknowledge this was my idea",
  "I am definitely a rat",
];
const TROLL_CHECKBOX_INDEX = 4;

// Index that triggers burst reveal of multiple checkboxes
const BURST_TRIGGER_INDEX = 2;
const BURST_REVEAL_COUNT = 3; // How many extra checkboxes appear at once

export function WelcomeModal({ visitor, onClose, onStartPresentation }: WelcomeModalProps) {
  const [ratChecks, setRatChecks] = useState<boolean[]>([false, false, false, false, false, false, false, false]);
  const [ratModeEnabled, setRatModeEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [burstTriggered, setBurstTriggered] = useState(false);
  
  const isRatPack = visitor.id === "ratpack";
  
  // Calculate visible checkboxes - with burst effect
  const baseVisible = ratChecks.filter((_, i) => i === 0 || ratChecks[i - 1]).length;
  const visibleCheckboxes = burstTriggered 
    ? Math.max(baseVisible, BURST_TRIGGER_INDEX + 1 + BURST_REVEAL_COUNT)
    : baseVisible;
  
  // All checked = all non-troll checkboxes are checked (troll checkbox is always skipped)
  const allChecked = ratChecks.every((checked, i) => i === TROLL_CHECKBOX_INDEX || checked);

  // Mount state for portal
  useEffect(() => {
    setMounted(true);
  }, []);

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


  const handleRatCheck = (index: number) => {
    // Troll checkbox - reset everything!
    if (index === TROLL_CHECKBOX_INDEX) {
      setRatChecks(new Array(RAT_CHECKBOXES.length).fill(false));
      setBurstTriggered(false);
      return;
    }
    
    const newChecks = [...ratChecks];
    newChecks[index] = !newChecks[index];
    
    // Trigger burst reveal when checking the trigger checkbox
    if (index === BURST_TRIGGER_INDEX && newChecks[index]) {
      setBurstTriggered(true);
    }
    
    // If unchecking, uncheck all after it too
    if (!newChecks[index]) {
      for (let i = index + 1; i < newChecks.length; i++) {
        newChecks[i] = false;
      }
      // Reset burst if unchecking at or before trigger
      if (index <= BURST_TRIGGER_INDEX) {
        setBurstTriggered(false);
      }
    }
    setRatChecks(newChecks);
  };

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

  if (!mounted) return null;

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
          className={`mx-6 space-y-8 ${visitor.largeText ? "max-w-[780px]" : "max-w-[480px]"}`}
        >
          {/* Greeting */}
          <div className={visitor.largeText ? "space-y-6" : "space-y-4"}>
            <h1 
              className={`font-medium text-foreground ${visitor.largeText ? "text-[52px] leading-tight" : "text-[28px]"}`}
              style={visitor.useJacquardFont ? { fontFamily: "var(--font-jacquard-24)" } : undefined}
            >
              {visitor.greeting} 👋
            </h1>
            <p className={`leading-relaxed text-muted-foreground ${visitor.largeText ? "text-[24px]" : "text-[15px]"}`}>
              {renderMessage(visitor.message)}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleBrowse}
              className={`group/btn inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-[#121212] text-muted-foreground transition-all duration-200 ease-out hover:bg-[#1a1a1a] hover:text-foreground ${visitor.largeText ? "px-6 py-4 text-[18px]" : "px-5 py-3 text-[14px]"}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={visitor.largeText ? "22" : "18"}
                height={visitor.largeText ? "22" : "18"}
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
              <span>View Projects</span>
            </button>
            <button
              onClick={handlePresentation}
              className={`group/btn inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-[#121212] text-muted-foreground transition-all duration-200 ease-out hover:bg-[#1a1a1a] hover:text-[#01F8A5] ${visitor.largeText ? "px-6 py-4 text-[18px]" : "px-5 py-3 text-[14px]"}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={visitor.largeText ? "22" : "18"}
                height={visitor.largeText ? "22" : "18"}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-200 group-hover/btn:stroke-[#01F8A5]"
              >
                <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/>
              </svg>
              <span>Open Presentation</span>
            </button>
          </div>

          {/* ESC hint */}
          <p className={`text-muted-foreground/50 ${visitor.largeText ? "text-[14px]" : "text-[12px]"}`}>
            Press <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px]">ESC</kbd> to browse freely
          </p>

          {/* Rat mode checkboxes / control panel - only for ratpack visitor */}
          {isRatPack && (
            <div className="space-y-3 rounded-lg border border-white/10 bg-white/[0.02] p-4">
              <AnimatePresence mode="wait">
                {allChecked ? (
                  ratModeEnabled ? (
                    /* Rat Mode Active - show disable button */
                    <motion.div
                      key="control-panel-active"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/assets/rat.png" alt="Rat" className="h-12 w-12" />
                        <div>
                          <p className="font-mono text-[14px] font-medium text-[#01F8A5]">
                            Rat Mode Active
                          </p>
                          <p className="font-mono text-[12px] text-muted-foreground">
                            A rat now follows your cursor everywhere
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setRatChecks(new Array(RAT_CHECKBOXES.length).fill(false));
                          setBurstTriggered(false);
                          setRatModeEnabled(false);
                          window.dispatchEvent(new CustomEvent("ratModeToggle", { detail: { active: false } }));
                        }}
                        className="w-full cursor-pointer rounded-lg bg-white/15 px-5 py-2.5 font-mono text-[13px] text-muted-foreground transition-all duration-200 hover:bg-white/10 hover:text-foreground"
                      >
                        Flee 🏃
                      </button>
                    </motion.div>
                  ) : (
                    /* All checked but not enabled yet - show enable button */
                    <motion.div
                      key="control-panel-ready"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <p className="font-mono text-[14px] text-muted-foreground">
                        Ready to unleash chaos?
                      </p>
                      <button
                        onClick={() => {
                          setRatModeEnabled(true);
                          window.dispatchEvent(new CustomEvent("ratModeToggle", { detail: { active: true } }));
                        }}
                        className="w-full cursor-pointer rounded-lg bg-white/15 px-5 py-2.5 font-mono text-[13px] text-foreground transition-all duration-200 hover:bg-white/25"
                      >
                        Enter 🐀
                      </button>
                    </motion.div>
                  )
                ) : (
                  /* Checkbox sequence */
                  <motion.div
                    key="checkboxes"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <p className="mb-3 font-mono text-[13px] text-muted-foreground">
                      Or... enable <RainbowText>Rat Mode</RainbowText> now:
                    </p>
                    <div className="space-y-2">
                      {RAT_CHECKBOXES.slice(0, Math.min(visibleCheckboxes + 1, RAT_CHECKBOXES.length)).map((label, i) => (
                        <motion.label
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: i === visibleCheckboxes ? 0.15 : 0 }}
                          className="flex cursor-pointer items-center gap-3 font-mono text-[14px]"
                        >
                          <input
                            type="checkbox"
                            checked={ratChecks[i]}
                            onChange={() => handleRatCheck(i)}
                            className="h-4 w-4 cursor-pointer rounded border-white/20 bg-white/5 accent-[#01F8A5]"
                          />
                          <span className={ratChecks[i] ? "text-foreground" : "text-muted-foreground"}>
                            {label}
                          </span>
                          {i === RAT_CHECKBOXES.length - 1 && ratChecks[i] && (
                            <span className="ml-2">🐀</span>
                          )}
                        </motion.label>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
