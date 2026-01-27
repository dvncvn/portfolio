"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

type DndCharacterOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function DndCharacterOverlay({ isOpen, onClose }: DndCharacterOverlayProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] bg-background"
        >
          {/* Close button - fixed to top right */}
          <button
            onClick={onClose}
            className="fixed right-6 top-6 z-10 rounded-md p-2 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
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

          {/* Scrollable content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="h-full overflow-y-auto px-6 pb-24 pt-12 scrollbar-none"
          >
            <div className="mx-auto max-w-[900px]">
              {/* Two column layout */}
              <div className="grid gap-8 md:grid-cols-[1fr_280px]">
              {/* Left column - content */}
              <div className="space-y-8 font-mono text-[14px] leading-relaxed">
                {/* Header */}
                <div>
                  <h1
                    className="text-[42px] text-foreground"
                    style={{ fontFamily: "var(--font-jacquard-24)" }}
                  >
                    Perrin Burrowfen
                  </h1>
                  <p className="mt-1 text-muted-foreground">Jerbeen Twilight Cleric</p>
                </div>

                {/* About */}
                <section>
                  <h2
                    className="mb-3 text-[18px] text-foreground"
                    style={{ fontFamily: "var(--font-jacquard-24)" }}
                  >
                    About
                  </h2>
                  <p className="text-muted-foreground">
                    Perrin Burrowfen is a Jerbeen cleric who walks the spaces between places. He is a guardian of liminal moments — dusk, night roads, quiet crossings — where fear spreads faster than danger. He does not banish darkness. He makes it survivable.
                  </p>
                  <p className="mt-4 text-muted-foreground">
                    He leads by presence, not command.
                  </p>
                </section>

                {/* Description */}
                <section>
                  <h2
                    className="mb-3 text-[18px] text-foreground"
                    style={{ fontFamily: "var(--font-jacquard-24)" }}
                  >
                    Description
                  </h2>
                  <p className="text-muted-foreground">
                    A small Jerbeen wrapped in layered, travel-worn robes, with heavy, well cared for but aged armor peeking beneath cloth. His ears are enormous and expressive, his movements unhurried. He carries a lantern at his side, holding a <span className="text-foreground">steady blue flame</span> that casts comfort more than light.
                  </p>
                  <p className="mt-4 text-muted-foreground">
                    He stands beside others rather than ahead of them.
                  </p>
                </section>

                {/* Duskwalks */}
                <section>
                  <h2
                    className="mb-3 text-[18px] text-foreground"
                    style={{ fontFamily: "var(--font-jacquard-24)" }}
                  >
                    Duskwalks
                  </h2>
                  <p className="text-muted-foreground">
                    The <span className="text-foreground">Duskwalks</span> are a network of Jerbeen paths, tunnels, and surface roads safest at dusk and in low light. They are maintained through habit rather than fortification.
                  </p>
                  <p className="mt-4 text-muted-foreground">Perrin&apos;s role was to:</p>
                  <ul className="mt-2 space-y-1 text-muted-foreground">
                    <li>• Walk and verify Duskwalk routes</li>
                    <li>• Escort travelers between dwellings</li>
                    <li>• Relight or reinforce lantern-flames</li>
                    <li>• Notice when a path felt <span className="text-foreground">wrong</span></li>
                  </ul>
                  <p className="mt-4 text-muted-foreground">
                    The Duskwalks are safe because they are walked. When neglected, they grow dangerous.
                  </p>
                </section>

                {/* Faith */}
                <section>
                  <h2
                    className="mb-3 text-[18px] text-foreground"
                    style={{ fontFamily: "var(--font-jacquard-24)" }}
                  >
                    Faith
                  </h2>
                  <p className="text-muted-foreground">
                    Perrin&apos;s faith is personal and practical.
                  </p>
                  <p className="mt-4 text-muted-foreground">He believes:</p>
                  <ul className="mt-2 space-y-1 text-muted-foreground">
                    <li>• Darkness is not evil, only uncertain</li>
                    <li>• Fear spreads faster than danger</li>
                    <li>• Light matters most when it is steady</li>
                  </ul>
                  <p className="mt-4 text-muted-foreground">
                    He does not preach. If asked, he answers briefly and honestly.
                  </p>
                  <p className="mt-4 text-muted-foreground">
                    Light is not approval. It is witness.
                  </p>
                </section>

                {/* Roleplay */}
                <section>
                  <h2
                    className="mb-3 text-[18px] text-foreground"
                    style={{ fontFamily: "var(--font-jacquard-24)" }}
                  >
                    Roleplay
                  </h2>
                  <p className="text-muted-foreground">
                    <span className="text-foreground">Voice:</span> soft, steady, conversational
                  </p>
                  <p className="text-muted-foreground">
                    <span className="text-foreground">Body Language:</span> kneels, adjusts lantern, stands beside others
                  </p>
                  <p className="mt-4 text-muted-foreground">Common phrases:</p>
                  <ul className="mt-2 space-y-1 text-muted-foreground">
                    <li>• &quot;It&apos;s alright. We&apos;ve time.&quot;</li>
                    <li>• &quot;I&apos;ll keep watch.&quot;</li>
                    <li>• &quot;Let&apos;s stand here a moment.&quot;</li>
                  </ul>
                  <p className="mt-6 text-muted-foreground">Backstory Hooks:</p>
                  <ul className="mt-2 space-y-1 text-muted-foreground">
                    <li>• Lanterns he once lit may have gone dark</li>
                    <li>• Paths once safe may no longer be</li>
                    <li>• Dreams of his flame alone in heavy rain</li>
                  </ul>
                  <p className="mt-4 text-muted-foreground">
                    He hasn&apos;t asked what they mean — yet.
                  </p>
                </section>
              </div>

              {/* Right column - image */}
              <div className="hidden md:block">
                <div className="sticky top-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/dnd-character.png"
                    alt="Perrin Burrowfen"
                    className="w-full rounded-lg"
                    style={{ imageRendering: "auto" }}
                  />
                </div>
              </div>
            </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
