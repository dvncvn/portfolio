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
    // Rasterize the irregular dot field once. Each frame composites this texture
    // through a broad traveling light mask instead of redrawing ~50,000 dots.
    const texture = document.createElement('canvas');
    texture.width = node.width;
    texture.height = node.height;
    const ink = texture.getContext('2d');
    if (!ink) return;
    ink.scale(dpr, dpr);
    ink.fillStyle = '#b9d9f0';
    for (let py = 2; py < height; py += 4) {
      for (let px = 2; px < width; px += 4) {
        const noise = Math.sin(px * 12.9898 + py * 78.233) * 43758.5453;
        const seed = noise - Math.floor(noise);
        if (seed < 0.2) continue;
        ink.globalAlpha = 0.08 + seed * 0.12;
        ink.fillRect(px - 0.6, py - 0.6, 1.2, 1.2);
      }
    }
    const start = performance.now();
    const duration = 4400;
    let frame = 0;
    const draw = (now: number) => {
      const elapsed = now - start;
      context.clearRect(0, 0, width, height);
      if (elapsed >= duration) return;
      const progress = elapsed / duration;
      const radius = Math.max(1, reach * (1 - (1 - progress) ** 2) * 1.5);
      const fade = Math.min(elapsed / 450, 1) * (1 - progress) ** 0.7;
      const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(0.22, `rgba(255,255,255,${fade * 0.12})`);
      gradient.addColorStop(0.55, `rgba(255,255,255,${fade * 0.7})`);
      gradient.addColorStop(0.78, `rgba(255,255,255,${fade})`);
      gradient.addColorStop(1, 'transparent');
      context.globalCompositeOperation = 'source-over';
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
      context.globalCompositeOperation = 'source-in';
      context.drawImage(texture, 0, 0, width, height);
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [x, y]);

  return <canvas ref={canvas} className={styles.gridRipple} aria-hidden="true" />;
}
