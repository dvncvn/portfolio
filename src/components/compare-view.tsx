"use client";

import { useMemo, useRef, useState, useCallback, useLayoutEffect, useEffect } from "react";

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
  const [containerWidth, setContainerWidth] = useState(0);
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

  const updateFromClientX = useCallback((clientX: number) => {
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
      <div className="text-center">
        <h3 className="text-[20px] font-medium text-foreground">Before / After</h3>
      </div>
      {/* Desktop/large: interactive slider */}
      <div className="relative hidden overflow-hidden rounded-[8px] sm:block">
        <div
          ref={containerRef}
          className="relative w-full"
          style={{ aspectRatio: `${width}/${height}` }}
          onPointerDown={handlePointerDown}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={beforeSrc}
            alt={beforeAlt}
            className="absolute inset-0 h-full w-full select-none object-cover"
            draggable={false}
          />

          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${clip} 0 0)` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={afterSrc}
              alt={afterAlt}
              className="absolute inset-0 h-full w-full select-none object-cover"
              draggable={false}
            />
          </div>

          <div className="absolute inset-y-0" style={{ left: lineLeft }}>
            <div className="pointer-events-none absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-white/35" />
            <button
              type="button"
              aria-label="Compare slider handle"
              role="slider"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(value * 100)}
              className="pointer-events-auto absolute left-1/2 top-0 h-full w-10 -translate-x-1/2 cursor-pointer"
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
      {/* Mobile/small: static before/after frames */}
      <div className="space-y-4 sm:hidden">
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
      {description ? (
        <div className="text-center">
          <p className="text-[14px] leading-relaxed text-muted-foreground">{description}</p>
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

