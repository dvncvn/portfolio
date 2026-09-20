"use client";

import { useEffect, useRef } from "react";
import { renderPhotoEffect, type EffectSettings, type EffectColor, type ImageEffect } from "@/lib/photo-effects";

export function EffectImage({ src, effect, settings, color }: {
  src: string;
  effect: ImageEffect;
  settings: EffectSettings;
  color: EffectColor;
}) {
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sampleRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!image || !canvas || !container) return;
    let frame = 0;
    const render = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (effect === "normal") {
          canvas.style.opacity = "0";
          return;
        }
        if (!image.complete || !image.naturalWidth || !container.clientWidth) return;
        sampleRef.current ??= document.createElement("canvas");
        try {
          const rendered = renderPhotoEffect(canvas, sampleRef.current, image, effect, settings, color,
            container.clientWidth, container.clientHeight, Math.min(window.devicePixelRatio || 1, 2));
          canvas.style.opacity = rendered ? "1" : "0";
        } catch {
          // Keep the original portrait visible if canvas is unavailable.
          canvas.style.opacity = "0";
        }
      });
    };
    image.addEventListener("load", render);
    const observer = new ResizeObserver(render);
    observer.observe(container);
    window.addEventListener("resize", render);
    render();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      image.removeEventListener("load", render);
      window.removeEventListener("resize", render);
    };
  }, [src, effect, settings, color]);

  return (
    <div ref={containerRef} className="relative aspect-[4/5] w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={imageRef} src={src} alt="Simon Duncan" className="absolute inset-0 h-full w-full object-cover" />
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full opacity-0 transition-opacity duration-150" />
    </div>
  );
}
