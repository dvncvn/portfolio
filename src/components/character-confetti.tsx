"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./dnd-character.module.css";

const tokens = ['⚔️', '🛡️', '🐉', '✨', '🎲', '💎', '🧙', '🪄'];
const count = 24;

export function CharacterConfetti({ x, y, seed }: { x: number; y: number; seed: number }) {
  const root = useRef<HTMLDivElement>(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!root.current) return;
    let active = true;
    const animations: Animation[] = [];
    const random = (index: number) => {
      const value = Math.sin(index * 127.1 + seed * 311.7) * 43758.5453;
      return value - Math.floor(value);
    };
    Array.from(root.current.children).forEach((element, index) => {
      const spread = (random(index + 1) - 0.5) * Math.min(window.innerWidth, 760)
        + (window.innerWidth / 2 - x) * 0.45;
      const lift = 560 + random(index + 30) * 380;
      const fall = window.innerHeight - y + 80;
      const spin = (random(index + 60) - 0.5) * 420;
      const frames = Array.from({ length: 25 }, (_, step) => {
        const t = step / 24;
        const dx = spread * t + Math.sin(t * Math.PI * 2 + index) * 12 * t;
        const dy = -lift * t + (lift + fall) * t * t;
        return {
          offset: t,
          transform: `translate3d(${dx}px, ${dy}px, 0) rotate(${spin * t}deg) scale(${0.55 + Math.min(t * 5, 0.45)})`,
          opacity: Math.min(t * 12, 1) * Math.min((1 - t) * 4, 1),
        };
      });
      animations.push(element.animate(frames, {
        duration: 2900 + random(index + 90) * 1000,
        delay: random(index + 120) * 180,
        easing: 'linear',
        fill: 'both',
      }));
    });
    void Promise.all(animations.map(animation => animation.finished)).then(() => {
      if (active) setFinished(true);
    }).catch(() => { /* Cancellation on dismissal or another roll is expected. */ });
    return () => {
      active = false;
      animations.forEach(animation => animation.cancel());
    };
  }, [x, y, seed]);

  if (finished) return null;
  return <div ref={root} className={styles.confetti} aria-hidden="true">
    {Array.from({ length: count }, (_, index) => <span key={index}
      style={{ left: x - 14, top: y - 14, fontSize: 20 + (index % 3) * 3 }}>
      {tokens[(index + seed) % tokens.length]}
    </span>)}
  </div>;
}
