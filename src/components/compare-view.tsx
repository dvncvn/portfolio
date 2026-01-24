"use client";

import { useMemo, useRef, useState, useCallback } from "react";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const clip = useMemo(() => `${Math.round(value * 100)}%`, [value]);

  const updateFromClientX = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const next = (clientX - rect.left) / rect.width;
    const clamped = Math.min(1, Math.max(0, next));
    setValue(clamped);
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

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-[20px] font-medium text-foreground">Before / After</h3>
      </div>
      <div className="relative overflow-hidden rounded-[8px] border border-white/10 bg-[#121212]">
        <div
          ref={containerRef}
          className="relative w-full cursor-ew-resize"
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
            style={{ clipPath: `inset(0 ${100 - value * 100}% 0 0)` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={afterSrc}
              alt={afterAlt}
              className="absolute inset-0 h-full w-full select-none object-cover"
              draggable={false}
            />
          </div>

          <div className="absolute inset-y-0" style={{ left: clip }}>
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
              <span className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-white/35" />
              <span className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-sm">
                <span className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-white/40" />
                  <span className="h-2 w-2 rounded-full bg-white/40" />
                </span>
              </span>
            </button>
          </div>
        </div>
        <div className="space-y-3 px-4 py-4">
          {description ? (
            <p className="text-[14px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

