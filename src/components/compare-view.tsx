"use client";

import { useMemo, useState } from "react";

type CompareViewProps = {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt?: string;
  afterAlt?: string;
  width?: number;
  height?: number;
};

export function CompareView({
  beforeSrc,
  afterSrc,
  beforeAlt = "Before",
  afterAlt = "After",
  width = 1600,
  height = 900,
}: CompareViewProps) {
  const [value, setValue] = useState(0.5);
  const clip = useMemo(() => `${Math.round(value * 100)}%`, [value]);

  return (
    <div className="relative overflow-hidden rounded-[8px] border border-white/10 bg-[#121212]">
      <div className="relative w-full" style={{ aspectRatio: `${width}/${height}` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beforeSrc}
          alt={beforeAlt}
          className="absolute inset-0 h-full w-full object-cover"
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
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
        </div>

        <div
          className="pointer-events-none absolute inset-y-0"
          style={{ left: clip }}
        >
          <div className="h-full w-px bg-white/30" />
          <div className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-sm">
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-white/40" />
              <span className="h-2 w-2 rounded-full bg-white/40" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 px-4 py-3 text-[12px] text-muted-foreground">
        <span>Before</span>
        <input
          aria-label="Compare slider"
          type="range"
          min={0}
          max={100}
          value={Math.round(value * 100)}
          onChange={(e) => setValue(Number(e.target.value) / 100)}
          className="h-1 w-full cursor-pointer accent-[var(--accent)]"
        />
        <span>After</span>
      </div>
    </div>
  );
}

