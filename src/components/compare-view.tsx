"use client";

import { useMemo, useRef, useState, useCallback, useLayoutEffect, useEffect } from "react";
import { BlurFade } from "@/components/ui/blur-fade";
import { animate, cubicBezier, motion, useReducedMotion } from "framer-motion";

const compareDuration = 0.7;
const compareEase = cubicBezier(0.65, 0, 0.25, 1);

const trailPixels = Array.from({ length: 384 }, (_, index) => ({
  // Sixteen particles per cluster, with a little irregularity along the divider.
  y: 2 + (Math.floor(index / 16) / 23) * 96 + ((index * 7) % 5 - 2) * 0.3,
  size: index % 3 === 0 ? 2 : 1,
  spread: (4 + ((index * 7) % 9)) * (index % 5 === 0 ? -0.5 : 1),
  lift: 2 + ((index * 11) % 6),
  fall: 2 + ((index * 3) % 5),
  shade: 180 + ((index * 13) % 76),
  delay: (index === 383 ? 0.5 : 0.05 + (index % 16) * (0.33 / 15) + ((index * 5) % 7) * 0.016) * (compareDuration / 0.55),
}));

type CompareViewProps = {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt?: string;
  afterAlt?: string;
  width?: number;
  height?: number;
  description?: string;
};

export function CompareView({
  beforeSrc,
  afterSrc,
  beforeAlt = "Before",
  afterAlt = "After",
  width = 1600,
  height = 900,
  description,
}: CompareViewProps) {
  const [value, setValue] = useState(0.5);
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxAlt, setLightboxAlt] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const slideRef = useRef<{ stop: () => void } | null>(null);
  const trailIdRef = useRef(0);
  const [trail, setTrail] = useState<{ id: number; from: number; to: number } | null>(null);
  const reduceMotion = useReducedMotion();
  const [containerWidth, setContainerWidth] = useState(0);
  const [actualAspectRatio, setActualAspectRatio] = useState<string | null>(null);
  const isComparisonCaption = /^before\s*\/\s*after$/i.test(description?.trim() ?? "");

  const showImage = useCallback((target: number) => {
    slideRef.current?.stop();
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    setTrail(!reduceMotion && Math.abs(target - value) > 0.01
      ? { id: ++trailIdRef.current, from: value, to: target }
      : null);
    slideRef.current = animate(value, target, {
      duration: reduceMotion ? 0 : compareDuration,
      ease: compareEase,
      onUpdate: setValue,
    });
  }, [value, reduceMotion]);

  useEffect(() => () => {
    slideRef.current?.stop();
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  }, []);
  
  const clip = useMemo(() => {
    if (!containerWidth) return "50%";
    const rightPx = Math.max(0, containerWidth * (1 - value));
    return `${rightPx}px`;
  }, [containerWidth, value]);
  const lineLeft = useMemo(() => {
    if (!containerWidth) return "50%";
    return `${containerWidth * value}px`;
  }, [containerWidth, value]);

  useLayoutEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setContainerWidth(entry.contentRect.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    // Use the image's natural aspect ratio for the container
    setActualAspectRatio(`${img.naturalWidth}/${img.naturalHeight}`);
  }, []);

  const updateFromClientX = useCallback((clientX: number) => {
    slideRef.current?.stop();
    setTrail(null);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const next = (clientX - rect.left) / rect.width;
    const clamped = Math.min(1, Math.max(0, next));
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setValue(clamped);
    });
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      updateFromClientX(event.clientX);
    },
    [updateFromClientX]
  );

  const handleHandlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      setIsDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
      updateFromClientX(event.clientX);
    },
    [updateFromClientX]
  );

  const handleHandlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (!isDragging) return;
      updateFromClientX(event.clientX);
    },
    [isDragging, updateFromClientX]
  );

  const handleHandlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (!isDragging) return;
      setIsDragging(false);
      event.currentTarget.releasePointerCapture(event.pointerId);
    },
    [isDragging]
  );

  useEffect(() => {
    if (!lightboxSrc) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightboxSrc(null);
        setLightboxAlt(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxSrc]);

  return (
    <div className="space-y-4">
      {/* Desktop/large: interactive slider */}
      <BlurFade delay={0.1} inView inViewMargin="-100px" className="hidden sm:block">
        <div className="relative overflow-hidden rounded-[8px]">
          <div
            ref={containerRef}
            className="relative w-full"
            style={{ aspectRatio: actualAspectRatio || `${width}/${height}` }}
            onPointerDown={handlePointerDown}
          >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={afterSrc}
            alt={afterAlt}
            className="absolute inset-0 h-full w-full select-none object-cover"
            draggable={false}
            onLoad={handleImageLoad}
          />

          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${clip} 0 0)` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={beforeSrc}
              alt={beforeAlt}
              className="absolute inset-0 h-full w-full select-none object-cover"
              draggable={false}
            />
          </div>

          {trail && !reduceMotion ? (
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
              {trailPixels.map(({ y, size, spread, lift, fall, shade, delay }, index) => (
                <motion.span
                  key={`${trail.id}-${index}`}
                  className="absolute"
                  // Emit at the divider's position at this delay, then leave the pixel behind.
                  style={{ left: `${(trail.from + (trail.to - trail.from) * compareEase(delay / compareDuration)) * 100}%`, top: `${y}%`, width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, backgroundColor: `rgb(${shade}, ${shade}, ${shade})` }}
                  initial={{ x: 0, y: 0, scale: 0.4, opacity: 0 }}
                  animate={{
                    x: [0, 0.25, 0.65, 1].map(distance => -Math.sign(trail.to - trail.from) * spread * distance),
                    y: [0, -lift * 0.4, -lift, fall],
                    scale: [0.4, 1, 1, 0.25],
                    opacity: [0, 0.45, 0.3, 0],
                  }}
                  transition={{ duration: 0.85, delay, times: [0, 0.18, 0.48, 1], ease: "easeOut" }}
                  onAnimationComplete={index === trailPixels.length - 1 ? () => {
                    setTrail(current => current?.id === trail.id ? null : current);
                  } : undefined}
                />
              ))}
            </div>
          ) : null}

          <div className="absolute inset-y-0" style={{ left: lineLeft }}>
            <div className="pointer-events-none absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-white/35" />
            <button
              type="button"
              aria-label="Compare slider handle"
              role="slider"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(value * 100)}
              aria-valuetext={`${Math.round(value * 100)}% before, ${Math.round((1 - value) * 100)}% after`}
              className={`pointer-events-auto absolute left-1/2 top-0 h-full w-10 -translate-x-1/2 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
              onPointerDown={handleHandlePointerDown}
              onPointerMove={handleHandlePointerMove}
              onPointerUp={handleHandlePointerUp}
              onPointerCancel={handleHandlePointerUp}
              style={{ touchAction: "none" }}
            >
              <span className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 text-white/80">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </span>
            </button>
            </div>
          </div>
        </div>
      </BlurFade>
      {/* Mobile/small: static before/after frames */}
      <BlurFade delay={0.1} inView inViewMargin="-100px" className="sm:hidden">
        <div className="space-y-4">
        {[{ src: beforeSrc, alt: beforeAlt }, { src: afterSrc, alt: afterAlt }].map(
          (image) => (
            <button
              key={image.src}
              type="button"
              className="overflow-hidden rounded-[8px] bg-[#121212]"
              style={{ aspectRatio: "4/3" }}
              onClick={() => {
                setLightboxSrc(image.src);
                setLightboxAlt(image.alt);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.src}
                alt={image.alt}
                className="h-full w-full object-cover"
                draggable={false}
              />
            </button>
          )
        )}
        </div>
      </BlurFade>
      {description ? (
        <div className="text-center">
          {isComparisonCaption ? (
            <>
              <p className="hidden items-center justify-center gap-2 text-[14px] leading-relaxed text-muted-foreground sm:flex">
                {[{ label: "Before", share: value }, { label: "After", share: 1 - value }].map(({ label, share }, index) => (
                  <span key={label} className="contents">
                    {index > 0 ? <span className="opacity-40">/</span> : null}
                    <button
                      type="button"
                      className="relative cursor-pointer rounded-sm pb-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-highlight"
                      onClick={() => showImage(index === 0 ? 1 : 0)}
                      aria-label={`Show all of ${label.toLowerCase()}`}
                      aria-pressed={share === 1}
                    >
                      {label}
                      <span aria-hidden="true" className="absolute inset-x-0 top-0 text-foreground" style={{ clipPath: index === 0 ? `inset(0 ${(1 - share) * 100}% 0 0)` : `inset(0 0 0 ${(1 - share) * 100}%)` }}>{label}</span>
                      <span className="absolute inset-x-0 bottom-0 h-px overflow-hidden rounded-full bg-foreground/10">
                      <span className="absolute inset-0 bg-foreground/60" style={{ transform: `scaleX(${share})`, transformOrigin: index === 0 ? "left" : "right" }} />
                      </span>
                    </button>
                  </span>
                ))}
              </p>
              <p className="text-[14px] leading-relaxed text-muted-foreground sm:hidden">{description}</p>
            </>
          ) : (
            <p className="text-[14px] leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
      ) : null}

      {lightboxSrc ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => {
            setLightboxSrc(null);
            setLightboxAlt(null);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxSrc}
            alt={lightboxAlt ?? ""}
            className="max-h-[90vh] w-auto max-w-[90vw]"
            onClick={(event) => event.stopPropagation()}
            draggable={false}
          />
        </div>
      ) : null}
    </div>
  );
}
