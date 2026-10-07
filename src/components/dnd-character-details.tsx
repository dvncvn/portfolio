"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import styles from "./dnd-character.module.css";
import { characterRolls, rollCharacterDie, rollFormula } from "@/lib/character-rolls";

import { CharacterRollPicker } from "./character-roll-picker";

const pixelPaths = {
  lantern: "M6 1h4v2h2v2h1v9H3V5h1V3h2V1zm0 2v2h4V3H6zM5 7v5h6V7H5zm1 8h4v1H6z",
  shield: "M2 2h12v8h-2v2h-2v2H6v-2H4v-2H2V2zm2 2v5h2v2h4V9h2V4H4z",
  heart: "M2 3h4v2h4V3h4v2h2v5h-2v2h-2v2h-2v2H6v-2H4v-2H2v-2H0V5h2V3z",
  lute: "M11 0h4v4h-2v2h-2v3h1v4h-2v2H5v-1H3v-2H2V8h2V6h4V4h2V2h1V0zM5 8v4h4V8H5z",
};

export function CharacterIcon({ kind, glow = false }: { kind: keyof typeof pixelPaths; glow?: boolean }) {
  return <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" className={glow ? styles.lantern : styles.pixelIcon} shapeRendering="crispEdges">
    <path d={pixelPaths[kind]} fill="currentColor" />
  </svg>;
}

export function CharacterDetails({ onNaturalTwenty }: { onNaturalTwenty?: (origin: { x: number; y: number }) => void }) {
  const reducedMotion = useReducedMotion();
  const [rolling, setRolling] = useState(false);
  const [dieMoving, setDieMoving] = useState(false);
  const [face, setFace] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState("d20");
  const selected = characterRolls.find(roll => roll.id === selectedId)!;
  const [result, setResult] = useState<ReturnType<typeof rollCharacterDie> | null>(null);
  const [rollId, setRollId] = useState(0);
  const natural = !rolling && result?.sides === 20
    ? result.face === 20 ? 'twenty' : result.face === 1 ? 'one' : undefined
    : undefined;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dieButton = useRef<HTMLButtonElement>(null);

  useEffect(() => () => {
    if (timer.current !== null) clearTimeout(timer.current);
  }, []);

  const roll = () => {
    if (timer.current !== null) return;
    setRollId(id => id + 1);
    const nextResult = rollCharacterDie(selected);
    if (reducedMotion) {
      setFace(nextResult.face);
      setResult(nextResult);
      return;
    }
    setRolling(true);
    // Fade the old face away before moving the die. Swap it only while hidden.
    timer.current = setTimeout(() => {
      setDieMoving(true);
      timer.current = setTimeout(() => {
        setDieMoving(false);
        setFace(nextResult.face);
        setResult(nextResult);
        timer.current = setTimeout(() => {
          setRolling(false);
          timer.current = null;
          if (nextResult.sides === 20 && nextResult.face === 20) {
            const rect = dieButton.current?.getBoundingClientRect();
            if (rect) onNaturalTwenty?.({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
          }
        }, 100);
      }, 660);
    }, 200);
  };

  return <>
    <div className={styles.routeDetails}>
      <svg aria-hidden="true" viewBox="0 0 36 132" className={styles.route}>
        <path d="M18 6v25l-8 12v28l16 16v22l-8 17" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="1 5" strokeLinecap="square" />
        {[{ x: 18, y: 12 }, { x: 10, y: 62 }, { x: 26, y: 104 }].map(({ x, y }) => (
          <g key={y} transform={`translate(${x - 5} ${y - 5})`}>
            <path d={pixelPaths.lantern} transform="scale(.625)" className={styles.lantern} fill="currentColor" />
          </g>
        ))}
      </svg>
      <div>
        <p className={styles.detailLabel}>Languages</p>
        <p>Birdfolk · Jerbeen · Sylvan</p>
        <p className={styles.detailLabel}>Instrument</p>
        <p className={styles.instrument}><CharacterIcon kind="lute" /> Lute</p>
      </div>
    </div>
    <div className={styles.rollPanel}>
      <CharacterRollPicker selected={selected} disabled={rolling} onSelect={roll => {
        setSelectedId(roll.id);
        setResult(null);
        setFace(null);
      }} />
      <div className={styles.diceRow}>
      <button ref={dieButton} type="button" className={styles.diceButton} onClick={() => roll()} disabled={rolling} aria-label={`Roll ${selected.label.toLowerCase()}`} title={`Roll ${selected.label.toLowerCase()}`}>
        {natural && !reducedMotion ? <span key={`burst-${rollId}`} aria-hidden="true" className={styles.rollParticles}>
          {Array.from({ length: natural === 'twenty' ? 20 : 12 }, (_, index) => {
            const angle = index * Math.PI * 2 / 20;
            const radius = 44 + (index % 4) * 9;
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
        <span className={styles.die} data-rolling={dieMoving} data-natural={natural}>
          <svg aria-hidden="true" viewBox="0 0 48 52" width="112" height="122">
            {selected.sides === 6
              ? <rect x="6" y="8" width="36" height="36" rx="3" fill="none" stroke="currentColor" />
              : <path d="M24 2 45 14v24L24 50 3 38V14L24 2ZM24 2 12 17 3 14m42 0-9 3L24 2M3 38l9-21h24l9 21M3 38h42M12 17l12 21 12-21M24 38v12" fill="none" stroke="currentColor" strokeWidth="1" />}
          </svg>
          <motion.span aria-hidden="true" initial={false}
            animate={{ opacity: rolling ? 0 : 1 }}
            transition={{ duration: reducedMotion ? 0 : rolling ? 0.18 : 0.32, ease: [0.4, 0, 0.2, 1] }}
          >{face}</motion.span>
        </span>
      </button>
      <div>
        <p className={styles.detailLabel}>{selected.label} · {rollFormula(selected)}</p>
        <p className={styles.rollStatus} role="status" aria-live="polite" aria-atomic="true">
          <span className={styles.rollResultLine}>
          {rolling ? "Rolling…" : result === null ? "Click the die to roll" : <>
            <span className="sr-only">Total </span>
            <span className={styles.rollTotal}>{result.total}</span>{' '}
            <span className={styles.rollBreakdown}>
              {result.face} on d{result.sides}{result.modifier === 0 ? '' : ` ${result.modifier > 0 ? '+' : '−'} ${Math.abs(result.modifier)}`}
            </span>
          </>}
          </span>
          <span className={styles.naturalResult} data-natural={natural}>
            {natural ? `Natural ${natural === 'twenty' ? '20' : '1'}` : null}
          </span>
        </p>
      </div>
      </div>
    </div>
  </>;
}
