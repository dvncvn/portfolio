"use client";

import Link from "next/link";
import styles from "./not-found.module.css";
import { AsciiNoiseBackground } from "@/components/ascii-noise-background";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

function NotFoundContent() {
  const searchParams = useSearchParams();
  const showControls = useMemo(
    () => searchParams.get("debug") === "1",
    [searchParams]
  );

  const [alpha, setAlpha] = useState(0.08);
  const [threshold, setThreshold] = useState(0.19);
  const [exponent, setExponent] = useState(1.25);
  const [freq, setFreq] = useState(0.035);
  const [speed, setSpeed] = useState(0.115);
  const [cell, setCell] = useState(12);
  const [fps, setFps] = useState(30);

  return (
    <div className={styles.wrap}>
      <AsciiNoiseBackground
        className={styles.bg}
        alpha={alpha}
        threshold={threshold}
        exponent={exponent}
        freq={freq}
        speed={speed}
        cell={cell}
        fps={fps}
      />
      <div className="relative z-10 flex flex-col items-center gap-2 text-center font-mono text-[14px] text-foreground">
        <div className="font-medium">404</div>
        <div className="text-muted-foreground">Page not found</div>

        <Link
          href="/"
          className="mt-4 rounded-[8px] border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-[14px] text-foreground transition-colors hover:bg-white/[0.07]"
        >
          Home
        </Link>
      </div>

      {showControls ? (
        <div className="absolute bottom-4 left-4 z-20 w-[320px] rounded-[10px] border border-white/10 bg-black/40 p-3 font-mono text-[12px] text-foreground backdrop-blur">
          <div className="mb-2 text-muted-foreground">404 noise controls</div>

          <label className="flex items-center justify-between gap-3">
            <span>alpha</span>
            <input
              className="w-[180px]"
              type="range"
              min={0}
              max={0.6}
              step={0.01}
              value={alpha}
              onChange={(e) => setAlpha(Number(e.target.value))}
            />
            <span className="w-[44px] text-right">{alpha.toFixed(2)}</span>
          </label>

          <label className="mt-2 flex items-center justify-between gap-3">
            <span>threshold</span>
            <input
              className="w-[180px]"
              type="range"
              min={0}
              max={0.6}
              step={0.01}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
            />
            <span className="w-[44px] text-right">{threshold.toFixed(2)}</span>
          </label>

          <label className="mt-2 flex items-center justify-between gap-3">
            <span>exponent</span>
            <input
              className="w-[180px]"
              type="range"
              min={0.8}
              max={2.8}
              step={0.05}
              value={exponent}
              onChange={(e) => setExponent(Number(e.target.value))}
            />
            <span className="w-[44px] text-right">{exponent.toFixed(2)}</span>
          </label>

          <label className="mt-2 flex items-center justify-between gap-3">
            <span>freq</span>
            <input
              className="w-[180px]"
              type="range"
              min={0.02}
              max={0.14}
              step={0.005}
              value={freq}
              onChange={(e) => setFreq(Number(e.target.value))}
            />
            <span className="w-[44px] text-right">{freq.toFixed(3)}</span>
          </label>

          <label className="mt-2 flex items-center justify-between gap-3">
            <span>speed</span>
            <input
              className="w-[180px]"
              type="range"
              min={0.005}
              max={0.15}
              step={0.005}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            />
            <span className="w-[44px] text-right">{speed.toFixed(3)}</span>
          </label>

          <label className="mt-2 flex items-center justify-between gap-3">
            <span>cell</span>
            <input
              className="w-[180px]"
              type="range"
              min={8}
              max={22}
              step={1}
              value={cell}
              onChange={(e) => setCell(Number(e.target.value))}
            />
            <span className="w-[44px] text-right">{cell}</span>
          </label>

          <label className="mt-2 flex items-center justify-between gap-3">
            <span>fps</span>
            <input
              className="w-[180px]"
              type="range"
              min={6}
              max={30}
              step={1}
              value={fps}
              onChange={(e) => setFps(Number(e.target.value))}
            />
            <span className="w-[44px] text-right">{fps}</span>
          </label>

          <pre className="mt-3 whitespace-pre-wrap text-[11px] text-muted-foreground">
            {JSON.stringify(
              { alpha, threshold, exponent, freq, speed, cell, fps },
              null,
              2
            )}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense fallback={null}>
      <NotFoundContent />
    </Suspense>
  );
}

