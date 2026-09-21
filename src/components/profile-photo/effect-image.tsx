"use client";

import { useEffect, useRef, useState } from "react";
import { AsciiLoading } from "./ascii-loading";
import { renderPhotoEffect, type EffectSettings, type EffectColor, type ImageEffect } from "@/lib/photo-effects";
import styles from "./effect-image.module.css";

export function EffectImage({ src, effect, settings, color, ready = true }: {
  src: string;
  effect: ImageEffect;
  settings: EffectSettings;
  color: EffectColor;
  ready?: boolean;
}) {
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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
        if (effect === "normal") {
          canvas.style.opacity = "0";
          image.style.visibility = "visible";
          reveal();
          return;
        }
        sampleRef.current ??= document.createElement("canvas");
        try {
          const rendered = renderPhotoEffect(canvas, sampleRef.current, image, effect, settings, color,
            container.clientWidth, container.clientHeight, Math.min(window.devicePixelRatio || 1, 2));
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
  }, [src, effect, settings, color, ready]);

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
