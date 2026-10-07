"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { flushSync } from "react-dom";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import styles from "./dnd-character.module.css";
import { characterRolls, rollCharacterDie, rollFormula } from "@/lib/character-rolls";

import { CharacterDieMenu } from "./character-die-menu";
import { CharacterRollPicker } from "./character-roll-picker";
import { CharacterDie, type CharacterDieHandle } from "./character-die";

const pixelPaths = {
  banner: "M3 1h2v14H3V1zm3 1h8v2h-2v2h-2v2h2v2h2v2H6V2z",
  lantern: "M6 1h4v2h2v2h1v9H3V5h1V3h2V1zm0 2v2h4V3H6zM5 7v5h6V7H5zm1 8h4v1H6z",
  shield: "M2 2h12v8h-2v2h-2v2H6v-2H4v-2H2V2zm2 2v5h2v2h4V9h2V4H4z",
  heart: "M2 3h4v2h4V3h4v2h2v5h-2v2h-2v2h-2v2H6v-2H4v-2H2v-2H0V5h2V3z",
};

export function CharacterIcon({ kind, glow = false }: { kind: keyof typeof pixelPaths; glow?: boolean }) {
  return <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" className={glow ? styles.lantern : styles.pixelIcon} shapeRendering="crispEdges">
    <path d={pixelPaths[kind]} fill="currentColor" />
  </svg>;
}

export type CharacterDetailsHandle = { rollAbility: (name: string) => void };

export function CharacterDetails({ onNaturalTwenty, onNaturalOne, rollRef, onRollingChange }: {
  onNaturalTwenty?: (origin: { x: number; y: number }) => void;
  onNaturalOne?: () => void;
  rollRef?: Ref<CharacterDetailsHandle>;
  onRollingChange?: (rolling: boolean) => void;
}) {
  const reducedMotion = useReducedMotion();
  const [rolling, setRolling] = useState(false);
  const numberOpacity = useMotionValue(0);
  const numberY = useTransform(numberOpacity, [0, 1], [3, 0]);
  const numberScale = useTransform(numberOpacity, [0, 1], [0.96, 1]);
  const numberAnimation = useRef<{ stop: () => void } | null>(null);
  const die = useRef<CharacterDieHandle>(null);
  const busy = useRef(false);
  const mounted = useRef(true);
  const [face, setFace] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState("d20");
  const selected = characterRolls.find(roll => roll.id === selectedId)!;
  const [result, setResult] = useState<ReturnType<typeof rollCharacterDie> | null>(null);
  const [rollId, setRollId] = useState(0);
  const natural = !rolling && result?.sides === 20
    ? result.face === 20 ? 'twenty' : result.face === 1 ? 'one' : undefined
    : undefined;
  const dieButton = useRef<HTMLButtonElement>(null);

  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const closeMenu = useCallback((restoreFocus: boolean) => {
    setMenu(null);
    if (restoreFocus) dieButton.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      numberAnimation.current?.stop();
    };
  }, []);

  const roll = async (definition = selected, forcedFace?: 1 | 20) => {
    if (busy.current) return;
    busy.current = true;
    setMenu(null);
    setRollId(id => id + 1);
    setSelectedId(definition.id);
    const nextResult = forcedFace !== undefined
      ? { ...definition, face: forcedFace, total: forcedFace + definition.modifier }
      : rollCharacterDie(definition);
    if (reducedMotion) {
      setFace(nextResult.face);
      setResult(nextResult);
      numberOpacity.set(1);
      busy.current = false;
      if (nextResult.sides === 20 && nextResult.face === 1) onNaturalOne?.();
      return;
    }
    setRolling(true);
    onRollingChange?.(true);
    const fadeOut = animate(numberOpacity, 0, { duration: 0.2, ease: [0.4, 0, 0.2, 1] });
    numberAnimation.current = fadeOut;
    await fadeOut;
    if (!mounted.current) return;
    numberOpacity.set(0);
    flushSync(() => setFace(null));
    await die.current?.roll();
    if (!mounted.current) return;
    // Commit the final face while fully transparent, before starting its reveal.
    flushSync(() => {
      setFace(nextResult.face);
      setResult(nextResult);
    });
    const fadeIn = animate(numberOpacity, 1, { duration: 0.48, ease: [0.22, 1, 0.36, 1] });
    numberAnimation.current = fadeIn;
    await fadeIn;
    if (!mounted.current) return;
    setRolling(false);
    onRollingChange?.(false);
    busy.current = false;
    if (nextResult.sides === 20 && nextResult.face === 1) onNaturalOne?.();
    if (nextResult.sides === 20 && nextResult.face === 20) {
      const rect = dieButton.current?.getBoundingClientRect();
      if (rect) onNaturalTwenty?.({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    }
  };

  useImperativeHandle(rollRef, () => ({
    rollAbility: name => {
      const definition = characterRolls.find(option => option.id === `check-${name}`);
      if (!definition || busy.current) return;
      dieButton.current?.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'instant' : 'smooth' });
      void roll(definition);
    },
  }));

  return <>
    <p className={styles.characterNote}>
      Speaks Birdfolk, Jerbeen, and Sylvan. Plays the lute.
    </p>
    <div className={styles.rollPanel}>
      <CharacterRollPicker selected={selected} disabled={rolling} onSelect={roll => {
        setSelectedId(roll.id);
        setResult(null);
        setFace(null);
        numberOpacity.set(0);
      }} />
      <div className={styles.diceRow}>
      <button ref={dieButton} type="button" className={styles.diceButton} onClick={() => roll()} disabled={rolling}
        aria-haspopup="menu" aria-expanded={menu !== null}
        onContextMenu={event => {
          event.preventDefault();
          if (!busy.current) setMenu({ x: event.clientX, y: event.clientY });
        }}
        onKeyDown={event => {
          if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
            event.preventDefault();
            const rect = event.currentTarget.getBoundingClientRect();
            setMenu({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
          }
        }} aria-label={`Roll ${selected.label.toLowerCase()}`} title={`Roll ${selected.label.toLowerCase()}`}>
        {natural && !reducedMotion ? <span key={`burst-${rollId}`} aria-hidden="true" className={styles.rollParticles}>
          {Array.from({ length: natural === 'twenty' ? 20 : 12 }, (_, index) => {
            const angle = index * Math.PI * 2 / 20;
            const radius = 68 + (index % 4) * 9;
            const x = natural === 'twenty' ? Math.cos(angle) * radius : ((index * 7) % 31) - 15;
            const y = natural === 'twenty' ? Math.sin(angle) * radius : -20 - (index % 5) * 6;
            return <motion.i key={index}
              className={natural === 'twenty' ? styles.burstPixel : styles.smokePixel}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.5 }}
              animate={{ x, y, opacity: [0, 0.8, 0], scale: natural === 'twenty' ? [0.5, 1, 0.3] : [0.5, 1.5, 0.5] }}
              transition={{ duration: natural === 'twenty' ? 0.9 : 1.2, delay: (index % 4) * 0.045, ease: 'easeOut' }}
            />;
          })}
        </span> : null}
        <span className={styles.die} data-natural={natural}>
          <CharacterDie ref={die} sides={selected.sides} />
          <motion.span aria-hidden="true" style={{ opacity: numberOpacity, y: reducedMotion ? 0 : numberY, scale: reducedMotion ? 1 : numberScale }}>{face !== null ? result?.total : null}</motion.span>
        </span>
      </button>
      <p className={styles.rollStatus} role="status" aria-live="polite" aria-atomic="true">
        {result !== null && face !== null ? <motion.span className={styles.rollCalculation}
          style={{ opacity: numberOpacity, y: reducedMotion ? 0 : numberY }}
        >{rollFormula(result)}</motion.span> : null}
        {rolling ? <span className="sr-only">Rolling</span>
          : result === null ? "Click the die to roll"
          : <span className="sr-only">{selected.label}: total {result.total}</span>}
        <span className={styles.naturalResult} data-natural={natural}>
          {natural === 'one' ? 'Natural 1' : null}
        </span>
      </p>
      </div>
    </div>
    {menu ? <CharacterDieMenu x={menu.x} y={menu.y} onClose={closeMenu}
      onChoose={face => {
        closeMenu(true);
        void roll(selected.sides === 20 ? selected : characterRolls[0], face);
      }} /> : null}
  </>;
}
