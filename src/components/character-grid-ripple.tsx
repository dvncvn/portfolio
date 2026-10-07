"use client";

import { useEffect, useRef } from "react";
import styles from "./dnd-character.module.css";

export function CharacterGridRipple({ x, y }: { x: number; y: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const node = canvas.current;
    const context = node?.getContext('2d');
    if (!node || !context) return;
    const { width, height } = node.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    node.width = Math.round(width * dpr);
    node.height = Math.round(height * dpr);
    context.scale(dpr, dpr);
    const reach = Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
    const points: { px: number; py: number; nx: number; ny: number; arrival: number; lifetime: number; seed: number }[] = [];
    let duration = 0;
    // Each dot wakes and settles independently, leaving a diffuse afterglow.
    for (let py = 2; py < height; py += 4) {
      for (let px = 2; px < width; px += 4) {
        const noise = Math.sin(px * 12.9898 + py * 78.233) * 43758.5453;
        const seed = noise - Math.floor(noise);
        if (seed < 0.2) continue;
        const dx = px - x;
        const dy = py - y;
        const distance = Math.hypot(dx, dy);
        const arrival = (1 - Math.sqrt(1 - Math.min(distance / reach, 1))) * 1600 + seed * 380;
        const lifetime = 1700 + seed * 1100;
        duration = Math.max(duration, arrival + lifetime);
        points.push({ px, py, nx: dx / (distance || 1), ny: dy / (distance || 1), arrival, lifetime, seed });
      }
    }
    const start = performance.now();
    let frame = 0;
    const smooth = (value: number) => value * value * (3 - 2 * value);

    const draw = (now: number) => {
      const elapsed = now - start;
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#b9d9f0';
      for (const point of points) {
        const age = elapsed - point.arrival;
        if (age <= 0 || age >= point.lifetime) continue;
        const attack = 260 + point.seed * 260;
        const envelope = age < attack
          ? smooth(age / attack)
          : 1 - smooth((age - attack) / (point.lifetime - attack));
        const displacement = Math.sin(age / point.lifetime * Math.PI * 2) * envelope * 3;
        const size = 1 + envelope * 0.25;
        context.globalAlpha = envelope * (0.08 + point.seed * 0.12);
        context.fillRect(point.px + point.nx * displacement - size / 2,
          point.py + point.ny * displacement - size / 2, size, size);
      }
      if (elapsed < duration) frame = requestAnimationFrame(draw);
      else context.clearRect(0, 0, width, height);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [x, y]);

  return <canvas ref={canvas} className={styles.gridRipple} aria-hidden="true" />;
}
