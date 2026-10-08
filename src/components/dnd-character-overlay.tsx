"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { createPortal } from "react-dom";
import styles from "./dnd-character.module.css";
import { CharacterDetails, CharacterIcon, type CharacterDetailsHandle } from "./dnd-character-details";
import { CharacterCriticalFailure } from "./character-critical-failure";
import { CharacterConfetti } from "./character-confetti";
import { CharacterGridRipple } from "./character-grid-ripple";

type TransitionRect = { left: number; top: number; right: number; bottom: number; width: number; height: number };
export type CharacterOpenOrigin = { card: TransitionRect; portrait: TransitionRect };

type DndCharacterOverlayProps = {
  origin?: CharacterOpenOrigin;
  isOpen: boolean;
  onClose: () => void;
};

export function DndCharacterOverlay({ isOpen, onClose, origin }: DndCharacterOverlayProps) {
  if (!isOpen || typeof window === "undefined") return null;

  return createPortal(
    <CharacterTakeover onClose={onClose} origin={origin} />,
    document.body
  );
}

function CharacterTakeover({ onClose, origin }: Pick<DndCharacterOverlayProps, "onClose" | "origin">) {
  const reducedMotion = useReducedMotion();
  const portraitTarget = useRef<HTMLImageElement>(null);
  const takeover = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);
  const exitAnimations = useRef<Animation[]>([]);
  const [closing, setClosing] = useState(false);
  const [opening, setOpening] = useState(true);
  const [contentRevealing, setContentRevealing] = useState(false);
  const expanding = !!origin && !reducedMotion;
  useLayoutEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);
  // Measure after scroll locking; animate the final image itself.
  useLayoutEffect(() => {
    if (!origin || reducedMotion || !portraitTarget.current) return;
    const target = portraitTarget.current.getBoundingClientRect();
    const from = origin.portrait;
    let active = true;
    // Move the real portrait from the card bounds into its own layout position.
    // There is no duplicate image to swap out at the end of the animation.
    const animation = portraitTarget.current.animate([
      { transform: `translate(${from.left - target.left}px, ${from.top - target.top}px) scale(${from.width / target.width}, ${from.height / target.height})` },
      { transform: 'translate(0, 0) scale(1, 1)' },
    ], { duration: 620, easing: 'cubic-bezier(0.45, 0, 0.2, 1)', fill: 'none' });
    // Let the expanding card lead, then overlap only the portrait's final settle.
    const revealTimer = window.setTimeout(() => {
      if (!closingRef.current) setContentRevealing(true);
    }, 500);
    void animation.finished.then(() => { if (active) setOpening(false); }).catch(() => {});
    return () => { active = false; window.clearTimeout(revealTimer); animation.cancel(); };
  }, [origin, reducedMotion]);
  const revealed = !expanding || contentRevealing;
  const reveal = (order: number) => ({
    'data-character-reveal': true,
    initial: { opacity: 0, y: reducedMotion ? 0 : 10 },
    animate: { opacity: revealed ? 1 : 0, y: revealed || reducedMotion ? 0 : 10 },
    transition: { duration: reducedMotion ? 0 : 0.45, delay: reducedMotion || !revealed ? 0 : order * 0.075, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  });
  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    const surface = takeover.current;
    if (!surface) { onClose(); return; }
    const duration = reducedMotion ? 120 : 200;
    const animations = exitAnimations.current;
    // Clear the sheet copy before revealing the underlying page.
    surface.querySelectorAll<HTMLElement>('[data-character-reveal]').forEach(element => {
      animations.push(element.animate([
        { opacity: getComputedStyle(element).opacity }, { opacity: 0 },
      ], { duration: 80, easing: 'ease-out', fill: 'forwards' }));
    });
    const portrait = portraitTarget.current;
    if (portrait && !reducedMotion) {
      // Capture an interrupted entrance before cancelling it to avoid a snap.
      const transform = getComputedStyle(portrait).transform;
      portrait.getAnimations().forEach(animation => animation.cancel());
      animations.push(portrait.animate([
        { transform },
        { transform: `${transform === 'none' ? '' : transform} translateY(6px) scale(0.98)` },
      ], { duration, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' }));
    }
    const fade = surface.animate([{ opacity: 1 }, { opacity: 0 }], {
      delay: reducedMotion ? 0 : 60, duration: reducedMotion ? duration : 140,
      easing: 'ease-in-out', fill: 'forwards',
    });
    animations.push(fade);
    void fade.finished.then(onClose).catch(() => {});
  }, [onClose, reducedMotion]);
  useEffect(() => () => exitAnimations.current.forEach(animation => animation.cancel()), []);
  const characterRoll = useRef<CharacterDetailsHandle>(null);
  const [rolling, setRolling] = useState(false);
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null);
  const [failurePhase, setFailurePhase] = useState<'idle' | 'showing' | 'closing'>('idle');
  const finishFailure = useCallback(() => setFailurePhase('idle'), []);
  const failure = failurePhase !== 'idle';
  const dismissFailure = useCallback(() => {
    setFailurePhase(phase => phase === 'showing' ? 'closing' : phase);
  }, []);
  const sheet = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ripple || reducedMotion || !sheet.current) return;
    const animations: Animation[] = [];
    const surfaces = [sheet.current, ...sheet.current.querySelectorAll<HTMLElement>(
      `.${styles.fullPortrait}, .${styles.essentials} > div, .${styles.abilities} > div, .${styles.rollPanel}`
    )];
    const visible = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.bottom > 0 &&
        rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
    };
    const timing = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      const dx = rect.left + rect.width / 2 - ripple.x;
      const dy = rect.top + rect.height / 2 - ripple.y;
      return { delay: Math.hypot(dx, dy) * 1.25, dx, dy };
    };

    for (const element of surfaces.filter(visible)) {
      const { delay, dx, dy } = timing(element);
      // Begin on the edge facing the die, then carry the light around the frame.
      const angle = Math.atan2(-dx, dy) * 180 / Math.PI - 52;
      animations.push(element.animate([
        { '--dnd-edge-angle': `${angle}deg` },
        { '--dnd-edge-angle': `${angle + 360}deg` },
      ], { duration: 3600, delay, easing: 'cubic-bezier(0.2, 0, 0.3, 1)', pseudoElement: '::after' }));
      animations.push(element.animate([
        { opacity: '0', offset: 0 },
        { opacity: '0.8', offset: 0.2 },
        { opacity: '0.5', offset: 0.65 },
        { opacity: '0', offset: 1 },
      ], { duration: 3600, delay, easing: 'ease-in-out', pseudoElement: '::after' }));
    }

    // Only paint visible text blocks, without animating overlapping descendants.
    const textElements = sheet.current.querySelectorAll<HTMLElement>(
      'h1, h2, p, li, dt, dd'
    );
    for (const element of textElements) {
      if (!visible(element) || element.closest(`.${styles.rollPanel}`) || element.querySelector('button') ||
          element.classList.contains('sr-only') || !element.textContent?.trim()) continue;
      const { delay, dx, dy } = timing(element);
      const color = getComputedStyle(element).color;
      const angle = Math.atan2(dx, -dy) * 180 / Math.PI;
      const paint = {
        color: 'transparent',
        backgroundClip: 'text',
        backgroundImage: `linear-gradient(${angle}deg, ${color} 35%, #ecf5ff 50%, ${color} 65%)`,
        backgroundSize: '300% 300%',
      };
      animations.push(element.animate([
        { ...paint, backgroundPosition: '100% 100%' },
        { ...paint, backgroundPosition: '0% 0%' },
      ], { duration: 2200, delay, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }));
    }
    return () => animations.forEach(animation => animation.cancel());
  }, [ripple, reducedMotion]);



  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (failure) {
          e.preventDefault();
          e.stopImmediatePropagation();
          dismissFailure();
          return;
        }
        if (e.target instanceof Element && e.target.closest('[data-roll-picker][data-open="true"], [data-die-menu]')) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        requestClose();
      }
    };

    // Intercept Escape before the page or a parent presentation handles it.
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [requestClose, failure, dismissFailure]);

  return (
        <div ref={takeover} inert={closing} className={`fixed inset-0 z-[10000] ${styles.takeover}`}>
          {/* Keep an opaque, stationary backdrop throughout. Only this decorative
              surface expands; clipping the whole sheet exposed the info page. */}
          {expanding && opening ? <motion.div aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[#211827]"
            style={{ transformOrigin: 'top left' }}
            initial={{ x: origin.card.left, y: origin.card.top,
              scaleX: origin.card.width / window.innerWidth, scaleY: origin.card.height / window.innerHeight, opacity: 1 }}
            animate={{ x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: [1, 1, 0] }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1],
              opacity: { duration: 0.6, times: [0, 0.65, 1], ease: 'easeInOut' } }} /> : null}
          {ripple && !reducedMotion ? <CharacterGridRipple key={ripple.id} x={ripple.x} y={ripple.y} /> : null}
          {ripple && !reducedMotion ? <CharacterConfetti key={`confetti-${ripple.id}`} x={ripple.x} y={ripple.y} seed={ripple.id} /> : null}
          {failure ? <CharacterCriticalFailure closing={failurePhase === 'closing'}
            onDismiss={dismissFailure} onExited={finishFailure} /> : null}
          {/* Close button - fixed to top right */}
          <motion.button
            {...reveal(0)}
            onClick={requestClose}
            inert={failure}
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
          </motion.button>

          {/* Scrollable content */}
          <motion.div
            inert={failure || !revealed}
            className="relative z-0 isolate h-full overflow-y-auto px-6 pb-24 pt-12 scrollbar-none"
          >
            <div ref={sheet} className={styles.sheet}>
              <motion.div className={styles.sheetFrame} aria-hidden="true"
                initial={{ clipPath: 'inset(0 0 100% 0)', opacity: 0 }}
                animate={{ clipPath: revealed ? 'inset(0 0 0% 0)' : 'inset(0 0 100% 0)', opacity: revealed ? 1 : 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.7, ease: [0.4, 0, 0.2, 1] }} />
              {/* Two column layout */}
              <div className="grid gap-10 md:grid-cols-[1fr_320px]">
              {/* Left column - content */}
              <div className="space-y-8 font-sans text-[14px] leading-relaxed">
                {/* Header */}
                <motion.div {...reveal(0)}>
                  <h1
                    className="text-[48px] text-foreground"
                    style={{ fontFamily: "var(--font-jacquard-24)" }}
                  >
                    Perrin Burrowfen
                  </h1>
                  <div className={styles.characterMeta}>
                    <p className={`text-muted-foreground ${styles.classLine}`}><CharacterIcon kind="lantern" glow /> Jerbeen Twilight Cleric</p>
                    <p className={styles.campaign}><CharacterIcon kind="banner" /><span className="sr-only">Campaign: </span>Turn of Fortune’s Fate</p>
                  </div>
                </motion.div>

                <motion.section {...reveal(1)}>
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

                </motion.section>

                <motion.section {...reveal(2)}>
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

                </motion.section>

                <motion.section {...reveal(3)}>
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

                </motion.section>

                <motion.section {...reveal(4)}>
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

                </motion.section>

                <motion.section {...reveal(5)}>
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

                </motion.section>

                <motion.section {...reveal(6)}>
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

                </motion.section>
              </div>

              {/* Right column - image */}
              <div className="order-first md:order-last">
                <div className={styles.characterStats}>
                  <div className={styles.fullPortrait} data-opening={expanding && opening}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={portraitTarget}
                    src="/assets/dnd-character.png"
                    alt="Perrin Burrowfen"
                    className="relative z-20 block aspect-square w-full object-cover"
                    width={304} height={304}
                    style={{ imageRendering: "auto", transformOrigin: "top left" }}
                  />
                  </div>
                  <motion.div {...reveal(2)} className={styles.statGrid}>
                  <svg className={styles.statGridLines} viewBox="0 0 300 288" preserveAspectRatio="none" aria-hidden="true">
                    {[0, 1, 2, 3].map(row => <g key={`row-${row}`}>
                      {[0, 1, 2].map(column => <path key={column} d={`M${column * 100 + 13} ${row * 96}h74`} />)}
                    </g>)}
                    {[0, 1, 2, 3].map(column => <g key={`column-${column}`}>
                      {[0, 1, 2].map(row => <path key={row} d={`M${column * 100} ${row * 96 + 13}v70`} />)}
                      {[0, 1, 2, 3].map(row => <path key={`join-${row}`} d={`M${column * 100 - 5} ${row * 96}h10 M${column * 100} ${row * 96 - 5}v10`} />)}
                    </g>)}
                  </svg>
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
                          <button type="button" className={styles.abilityRoll} disabled={rolling}
                            aria-label={`Roll ${name} check (${Math.floor((score - 10) / 2) >= 0 ? '+' : ''}${Math.floor((score - 10) / 2)})`}
                            title={`Roll ${name.toLowerCase()} check`}
                            onClick={() => characterRoll.current?.rollAbility(name)} />
                          {score >= 10 ? '+' : '−'}{Math.abs(Math.floor((score - 10) / 2))}
                          <span className={styles.abilityScore}>{score}</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                  </motion.div>
                  <motion.div {...reveal(4)}>
                  <CharacterDetails onNaturalOne={() => { setRipple(null); setFailurePhase('showing'); }} rollRef={characterRoll} onRollingChange={setRolling} onNaturalTwenty={origin => setRipple(previous => ({ ...origin, id: (previous?.id ?? 0) + 1 }))} />
                  </motion.div>
                </div>
              </div>
            </div>
            </div>
          </motion.div>
        </div>
  );
}
