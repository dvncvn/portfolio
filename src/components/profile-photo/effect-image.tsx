"use client";

import { useEffect, useRef, useState } from "react";
import { AsciiLoading } from "./ascii-loading";
import { drawCover, renderPhotoEffect, type EffectSettings, type EffectColor, type ImageEffect } from "@/lib/photo-effects";
import type { PhotoLayer } from "@/lib/shared-photo";
import styles from "./effect-image.module.css";

export function EffectImage({ src, effect, settings, color, ready = true, renderWidth, layers }: {
  layers?: PhotoLayer[];
  src: string;
  effect: ImageEffect;
  settings: EffectSettings;
  color: EffectColor;
  ready?: boolean;
  renderWidth?: number;
}) {
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buffers = useRef<HTMLCanvasElement[]>([]);
  const cache = useRef<string[]>([]);
  const effectBuffer = useRef<HTMLCanvasElement | null>(null);
  const sampleRef = useRef<HTMLCanvasElement | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "error">("loading");

  useEffect(() => {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!image || !canvas || !container) return;
    let frame = 0;
    const reveal = () => {
      container.dataset.loaded = "true";
      container.setAttribute("aria-busy", "false");
      setLoadState("loaded");
    };
    const fail = () => {
      container.setAttribute("aria-busy", "false");
      setLoadState("error");
    };
    const render = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (image.complete && !image.naturalWidth) { fail(); return; }
        if (!ready) return;
        if (!image.complete || !image.naturalWidth || !container.clientWidth) return;
        const stack = layers?.filter((layer) => layer.enabled);
        if (stack ? stack.length === 0 : effect === "normal") {
          canvas.style.opacity = "0";
          image.style.visibility = "visible";
          reveal();
          return;
        }
        sampleRef.current ??= document.createElement("canvas");
        try {
          const width = renderWidth ?? container.clientWidth;
          const height = renderWidth ? renderWidth * container.clientHeight / container.clientWidth : container.clientHeight;
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          let rendered = false;
          if (stack) {
            let input: HTMLImageElement | HTMLCanvasElement = image;
            effectBuffer.current ??= document.createElement("canvas");
            let signature = `${src}:${width}:${height}:${dpr}`;
            for (let index = 0; index < stack.length; index++) {
              const layer = stack[index];
              signature += JSON.stringify(layer);
              const output = buffers.current[index] ??= document.createElement("canvas");
              if (cache.current[index] !== signature) {
                const opacity = (layer.opacity ?? 100) / 100;
                rendered = opacity === 0 || renderPhotoEffect(effectBuffer.current, sampleRef.current, input, layer.effect, layer.settings, layer.color, width, height, dpr);
                if (!rendered) break;
                output.width = Math.round(width * dpr);
                output.height = Math.round(height * dpr);
                const context = output.getContext("2d");
                if (!context) { rendered = false; break; }
                drawCover(context, input, output.width, output.height, width / height);
                if (opacity > 0) {
                  context.globalAlpha = opacity;
                  context.drawImage(effectBuffer.current, 0, 0);
                  context.globalAlpha = 1;
                }
                cache.current[index] = signature;
              }
              rendered = true;
              input = output;
            }
            if (rendered) {
              canvas.width = Math.round(width * dpr);
              canvas.height = Math.round(height * dpr);
              canvas.getContext("2d")?.drawImage(input, 0, 0, canvas.width, canvas.height);
            }
          } else if (effect !== "normal") {
            rendered = renderPhotoEffect(canvas, sampleRef.current, image, effect, settings, color, width, height, dpr);
          }
          canvas.style.opacity = rendered ? "1" : "0";
          image.style.visibility = rendered ? "hidden" : "visible";
        } catch {
          // Keep the original portrait visible if canvas is unavailable.
          canvas.style.opacity = "0";
          image.style.visibility = "visible";
        }
        // Reveal only after the first complete frame, never the source underneath it.
        reveal();
      });
    };
    image.addEventListener("load", render);
    image.addEventListener("error", fail);
    const observer = new ResizeObserver(render);
    observer.observe(container);
    window.addEventListener("resize", render);
    render();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      image.removeEventListener("load", render);
      image.removeEventListener("error", fail);
      window.removeEventListener("resize", render);
    };
  }, [src, effect, settings, color, ready, renderWidth, layers]);

  return (
    <div ref={containerRef} aria-busy="true" className={`relative aspect-[4/5] w-full ${styles.photo}`}>
      {loadState !== "loaded" && <span role="status" className={styles.loading}>
        {loadState === "error" ? "Photo unavailable" : <>
          <span className="sr-only">Loading photo</span>
          <AsciiLoading />
        </>}
      </span>}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={imageRef} src={src} alt="Simon Duncan" className="invisible absolute inset-0 h-full w-full object-cover" />
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full opacity-0" />
    </div>
  );
}
