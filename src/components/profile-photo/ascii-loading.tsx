"use client";

import { useEffect, useRef } from "react";
import styles from "./effect-image.module.css";

const RAMP = "   .,:;+=*#";
const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

// Seeded gradient noise keeps neighboring characters flowing together.
function gradient(x: number, y: number, dx: number, dy: number) {
  let seed = Math.imul(x, 374761393) ^ Math.imul(y, 668265263);
  seed = Math.imul(seed ^ (seed >>> 13), 1274126177);
  const angle = ((seed ^ (seed >>> 16)) >>> 0) / 4294967296 * Math.PI * 2;
  return Math.cos(angle) * dx + Math.sin(angle) * dy;
}

function perlin(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const dx = x - ix, dy = y - iy;
  return mix(
    mix(gradient(ix, iy, dx, dy), gradient(ix + 1, iy, dx - 1, dy), fade(dx)),
    mix(gradient(ix, iy + 1, dx, dy - 1), gradient(ix + 1, iy + 1, dx - 1, dy - 1), fade(dx)),
    fade(dy),
  );
}

function noiseFrame(time: number) {
  return Array.from({ length: 30 }, (_, y) =>
    Array.from({ length: 48 }, (_, x) => {
      const noise = perlin(x * 0.095 + time * 0.16, y * 0.13 - time * 0.1);
      const detail = perlin(x * 0.19 - time * 0.08, y * 0.26 + time * 0.12);
      const value = Math.max(0, Math.min(0.999, 0.48 + noise * 0.65 + detail * 0.2));
      return RAMP[Math.floor(value * RAMP.length)];
    }).join(""),
  ).join("\n");
}

const INITIAL_FRAME = noiseFrame(0);

export function AsciiLoading() {
  const ref = useRef<HTMLPreElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let time = 0;
    let interval: ReturnType<typeof setInterval> | undefined;
    const sync = () => {
      clearInterval(interval);
      if (reduced.matches || document.hidden || !visible) return;
      // Ten small text updates per second; no React renders or layout changes.
      interval = setInterval(() => {
        time += 0.1;
        element.textContent = noiseFrame(time);
      }, 100);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(element);
    reduced.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      clearInterval(interval);
      observer.disconnect();
      reduced.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return <pre ref={ref} aria-hidden="true" className={styles.noise}>{INITIAL_FRAME}</pre>;
}
