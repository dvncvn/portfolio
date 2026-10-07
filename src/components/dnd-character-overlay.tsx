"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { createPortal } from "react-dom";
import styles from "./dnd-character.module.css";
import { CharacterDetails, CharacterIcon } from "./dnd-character-details";
import { CharacterGridRipple } from "./character-grid-ripple";

type DndCharacterOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function DndCharacterOverlay({ isOpen, onClose }: DndCharacterOverlayProps) {
  if (!isOpen || typeof window === "undefined") return null;

  return createPortal(
    <CharacterTakeover onClose={onClose} />,
    document.body
  );
}

function CharacterTakeover({ onClose }: Pick<DndCharacterOverlayProps, "onClose">) {
  const reducedMotion = useReducedMotion();
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null);
  // Restore the page scroll state when the takeover is dismissed.
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (e.target instanceof Element && e.target.closest('[data-roll-picker][data-open="true"]')) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        onClose();
      }
    };

    // Intercept Escape before the page or a parent presentation handles it.
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [onClose]);

  // Dismiss immediately: fading this opaque surface crossfades two pages of text.
  return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reducedMotion ? 0 : 0.3 }}
          className={`fixed inset-0 z-[10000] ${styles.takeover}`}
        >
          {ripple && !reducedMotion ? <CharacterGridRipple key={ripple.id} x={ripple.x} y={ripple.y} /> : null}
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
            initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.45, delay: reducedMotion ? 0 : 0.08 }}
            className="relative h-full overflow-y-auto px-6 pb-24 pt-12 scrollbar-none"
          >
            <div className={styles.sheet}>
              {/* Two column layout */}
              <div className="grid gap-10 md:grid-cols-[1fr_320px]">
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
                  <p className={`mt-1 text-muted-foreground ${styles.classLine}`}><CharacterIcon kind="lantern" glow /> Jerbeen Twilight Cleric</p>
                  <p className={styles.campaign}>Turn of Fortune’s Fate</p>
                </div>

                <section>
                  <h2
                    className="mb-3 text-[18px] text-foreground"
                    style={{ fontFamily: "var(--font-jacquard-24)" }}
                  >
                    About
                  </h2>

                  <p className="text-muted-foreground">
                    Perrin Burrowfen is a Jerbeen cleric who spent much of his life looking after the Duskwalks, a network of paths used by Jerbeen communities after dark.
                  </p>

                  <p className="mt-4 text-muted-foreground">
                    He’s used to traveling at night, keeping watch, and helping nervous travelers get where they’re going safely. He doesn’t see darkness as something inherently threatening. Usually, the fear of what might be out there is worse than what actually is.
                  </p>

                  <p className="mt-4 text-muted-foreground">
                    Perrin is quiet, patient, and not much of a leader in the traditional sense. He tends to help by being reliable and staying calm when other people aren’t.
                  </p>

                </section>

                <section>
                  <h2
                    className="mb-3 text-[18px] text-foreground"
                    style={{ fontFamily: "var(--font-jacquard-24)" }}
                  >
                    Description
                  </h2>

                  <p className="text-muted-foreground">
                    Perrin is a small Jerbeen with enormous, expressive ears. He wears layered, well-used traveling robes over old but carefully maintained armor.
                  </p>

                  <p className="mt-4 text-muted-foreground">
                    A lantern hangs at his side, burning with a steady blue flame. It isn’t especially bright, but Perrin takes very good care of it and rarely goes anywhere without it.
                  </p>

                  <p className="mt-4 text-muted-foreground">
                    He tends to move slowly and deliberately, and would usually rather stand beside someone than put himself at the front of the group.
                  </p>

                </section>

                <section>
                  <h2
                    className="mb-3 text-[18px] text-foreground"
                    style={{ fontFamily: "var(--font-jacquard-24)" }}
                  >
                    The Duskwalks
                  </h2>

                  <p className="text-muted-foreground">
                    The Duskwalks are a loose network of Jerbeen tunnels, paths, and surface roads traditionally traveled around dusk and at night.
                  </p>

                  <p className="mt-4 text-muted-foreground">
                    They aren’t protected by walls or guards. Instead, Jerbeen keep them safe by regularly walking the routes, maintaining their markers, checking the lanterns, and noticing when something has changed.
                  </p>

                  <p className="mt-4 text-muted-foreground">
                    Perrin’s work involved:
                  </p>

                  <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">

                    <li>Walking the routes and checking that they were still safe</li>

                    <li>Escorting travelers between settlements</li>

                    <li>Maintaining and relighting lanterns along the way</li>

                    <li>Investigating anything unusual he found on the road</li>

                  </ul>

                  <p className="mt-4 text-muted-foreground">
                    A neglected route can quickly become an unsafe one, so simply being there was a large part of the job.
                  </p>

                </section>

                <section>
                  <h2
                    className="mb-3 text-[18px] text-foreground"
                    style={{ fontFamily: "var(--font-jacquard-24)" }}
                  >
                    Faith
                  </h2>

                  <p className="text-muted-foreground">
                    Perrin’s religion is fairly personal. He isn’t interested in converting anyone, and he rarely talks about his beliefs unless someone asks.
                  </p>

                  <p className="mt-4 text-muted-foreground">
                    At the heart of them are a few simple ideas:
                  </p>

                  <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">

                    <li>Darkness isn’t evil. It just makes things harder to understand.</li>

                    <li>People frightened by uncertainty can be more dangerous than the thing they’re frightened of.</li>

                    <li>A small, dependable light is often more useful than a brilliant one that doesn’t last.</li>

                  </ul>

                  <p className="mt-4 text-muted-foreground">
                    For Perrin, his lantern is partly religious and partly practical. Keeping it lit is an act of care, not a declaration that everything is going to be alright.
                  </p>

                </section>

                <section>
                  <h2
                    className="mb-3 text-[18px] text-foreground"
                    style={{ fontFamily: "var(--font-jacquard-24)" }}
                  >
                    Roleplay
                  </h2>

                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Voice:</strong> Quiet, steady, conversational. He rarely raises his voice.
                  </p>

                  <p className="mt-4 text-muted-foreground">
                    <strong className="text-foreground">Mannerisms:</strong> Tends to crouch or kneel when speaking to someone smaller or frightened. Fiddles with his lantern when thinking. Usually takes up a position beside someone rather than at the head of the group.
                  </p>

                  <p className="mt-4 text-muted-foreground">
                    <strong className="text-foreground">Things he might say:</strong>
                  </p>

                  <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">

                    <li>“It’s alright. We’ve got time.”</li>

                    <li>“I’ll keep watch.”</li>

                    <li>“Something’s different here.”</li>

                    <li>“Give your eyes a moment.”</li>

                    <li>“We can stay here until you’re ready.”</li>

                  </ul>

                </section>

                <section>
                  <h2
                    className="mb-3 text-[18px] text-foreground"
                    style={{ fontFamily: "var(--font-jacquard-24)" }}
                  >
                    Backstory Hooks
                  </h2>

                  <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">

                    <li>Some of the lanterns along his old routes have started going out.</li>

                    <li>A Duskwalk that Perrin remembers as safe has become dangerous.</li>

                    <li>He occasionally dreams about seeing his lantern burning by itself in heavy rain.</li>

                    <li>He doesn’t know whether the dreams mean anything, and so far he hasn’t gone looking for an answer.</li>

                  </ul>

                </section>
              </div>

              {/* Right column - image */}
              <div className="order-first md:order-last">
                <div className={styles.characterStats}>
                  <div className={styles.fullPortrait}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/dnd-character.png"
                    alt="Perrin Burrowfen"
                    className="w-full"
                    style={{ imageRendering: "auto" }}
                  />
                  </div>
                  <dl className={styles.essentials} aria-label="Character essentials">
                    {[['Level', 7], ['AC', 17], ['Max HP', 52]].map(([label, score]) => (
                      <div key={label}>
                        <dt>{label === 'AC' ? <CharacterIcon kind="shield" /> : label === 'Max HP' ? <CharacterIcon kind="heart" /> : null}{label}</dt>
                        <dd>{score}</dd>
                      </div>
                    ))}
                  </dl>
                  <dl className={styles.abilities} aria-label="Ability scores">
                    {[
                      { label: 'STR', name: 'Strength', score: 10 },
                      { label: 'DEX', name: 'Dexterity', score: 15 },
                      { label: 'CON', name: 'Constitution', score: 14 },
                      { label: 'INT', name: 'Intelligence', score: 8 },
                      { label: 'WIS', name: 'Wisdom', score: 17 },
                      { label: 'CHA', name: 'Charisma', score: 13 },
                    ].map(({ label, name, score }) => (
                      <div key={label}>
                        <dt><abbr title={name}>{label}</abbr></dt>
                        <dd aria-label={`${name} modifier ${Math.floor((score - 10) / 2)}, score ${score}`}>
                          {score >= 10 ? '+' : '−'}{Math.abs(Math.floor((score - 10) / 2))}
                          <span className={styles.abilityScore}>{score}</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <CharacterDetails onNaturalTwenty={origin => setRipple(previous => ({ ...origin, id: (previous?.id ?? 0) + 1 }))} />
                </div>
              </div>
            </div>
            </div>
          </motion.div>
        </motion.div>
  );
}
