"use client";

import { useEffect, useRef } from "react";

type AsciiNoiseBackgroundProps = {
  className?: string;
  alpha?: number;
  threshold?: number;
  exponent?: number;
  freq?: number;
  speed?: number;
  cell?: number;
  fontSize?: number;
  fps?: number;
};

const CHARS = [" ", ".", "·", ":", "-", "=", "+", "*", "#", "%", "@"] as const;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function fade(t: number) {
  // Smoothstep-ish fade for "perlin-like" interpolation.
  return t * t * (3 - 2 * t);
}

function hash3(ix: number, iy: number, iz: number) {
  // Deterministic pseudo-random in [0, 1)
  let n = ix * 374761393 + iy * 668265263 + iz * 2147483647;
  n = (n ^ (n >> 13)) * 1274126177;
  n = n ^ (n >> 16);
  return ((n >>> 0) & 0xffffffff) / 4294967296;
}

function valueNoise3(x: number, y: number, z: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const z0 = Math.floor(z);
  const xf = x - x0;
  const yf = y - y0;
  const zf = z - z0;

  const u = fade(xf);
  const v = fade(yf);
  const w = fade(zf);

  const n000 = hash3(x0, y0, z0);
  const n100 = hash3(x0 + 1, y0, z0);
  const n010 = hash3(x0, y0 + 1, z0);
  const n110 = hash3(x0 + 1, y0 + 1, z0);
  const n001 = hash3(x0, y0, z0 + 1);
  const n101 = hash3(x0 + 1, y0, z0 + 1);
  const n011 = hash3(x0, y0 + 1, z0 + 1);
  const n111 = hash3(x0 + 1, y0 + 1, z0 + 1);

  const x00 = lerp(n000, n100, u);
  const x10 = lerp(n010, n110, u);
  const x01 = lerp(n001, n101, u);
  const x11 = lerp(n011, n111, u);

  const y0l = lerp(x00, x10, v);
  const y1l = lerp(x01, x11, v);

  return lerp(y0l, y1l, w);
}

export function AsciiNoiseBackground({
  className,
  alpha = 0.08,
  threshold = 0.19,
  exponent = 1.25,
  freq = 0.035,
  speed = 0.115,
  cell = 12,
  fontSize = 12,
  fps = 30,
}: AsciiNoiseBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    let raf = 0;
    let lastFrame = 0;
    let currentWidth = 0;
    let currentHeight = 0;

    const setFont = () => {
      ctx.textBaseline = "top";
      ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const { width, height } = rect;
      
      // Guard against zero dimensions
      if (width <= 0 || height <= 0) return;
      
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      
      // Store current dimensions for draw function
      currentWidth = width;
      currentHeight = height;
      
      // Re-set font after resize (canvas resize resets context state)
      setFont();
    };

    // Initial resize + observe container for size changes (handles animations, etc.)
    resize();
    const resizeObserver = new ResizeObserver(() => {
      resize();
    });
    resizeObserver.observe(canvas);
    window.addEventListener("resize", resize);

    const draw = (tMs: number) => {
      // Use stored dimensions to avoid getBoundingClientRect during draw
      if (currentWidth <= 0 || currentHeight <= 0) return;
      
      const t = tMs / 1000;

      ctx.clearRect(0, 0, currentWidth, currentHeight);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;

      const cols = Math.ceil(currentWidth / cell) + 1;
      const rows = Math.ceil(currentHeight / cell) + 1;

      const z = t * speed;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const n = valueNoise3(x * freq, y * freq, z);

          // Bias toward "empty" for subtlety; only occasional denser chars.
          const biased = Math.pow(n, exponent);
          const idx = Math.min(
            CHARS.length - 1,
            Math.floor(biased * CHARS.length)
          );
          const ch = CHARS[idx];
          if (ch === " ") continue;

          // Render more characters so the field is obviously present.
          if (biased < threshold) continue;

          ctx.fillText(ch, x * cell, y * cell);
        }
      }
    };

    const loop = (tMs: number) => {
      if (prefersReducedMotion) {
        draw(0);
        return;
      }

      if (tMs - lastFrame >= 1000 / fps) {
        lastFrame = tMs;
        draw(tMs);
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, [alpha, threshold, exponent, freq, speed, cell, fontSize, fps]);

  return <canvas ref={canvasRef} className={`h-full w-full ${className ?? ""}`} aria-hidden="true" />;
}

