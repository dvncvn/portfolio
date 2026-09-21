"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useReducedMotion } from "framer-motion";
import { RatContextMenu } from "./rat-context-menu";
import { BAND_PARTS, RatBand, RatInstrument } from "./rat-band";
import { RatAudio, DEFAULT_RAT_MIX, type RatMix } from "./rat-audio";
import { createRatFood } from "./rat-food";
import { createRatImpact } from "./rat-impact";
import "./rat-mode.css";

const MAX_RATS = 24;

export function RatMode({ onExit }: { onExit: () => void }) {
  const [population, setPopulation] = useState(3);
  const [sound, setSound] = useState(false);
  const [mix, setMix] = useState<RatMix>({ ...DEFAULT_RAT_MIX });
  const field = useRef<HTMLDivElement>(null);
  const bandStage = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 180, y: 240 });
  const foodLayer = useRef<HTMLDivElement>(null);
  const food = useRef<ReturnType<typeof createRatFood> | null>(null);
  const feedingUntil = useRef(0);
  const positions = useRef<{ x: number; y: number }[]>([]);
  const audio = useRef<RatAudio | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    document.documentElement.classList.add("rat-infested");
    if (foodLayer.current) food.current = createRatFood(foodLayer.current);
    return () => {
      document.documentElement.classList.remove("rat-infested");
      food.current?.dispose();
      food.current = null;
      audio.current?.dispose();
      audio.current = null;
    };
  }, []);

  const feedAt = useCallback((x: number, y: number, count: number) => {
    target.current = { x, y };
    audio.current?.squeak(x / window.innerWidth * 1.4 - 0.7);
    setPopulation((current) => Math.min(MAX_RATS, current + count));
    feedingUntil.current = performance.now() + 2500;
    food.current?.drop(x, y, count, !!reduceMotion);
  }, [reduceMotion]);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "touch" && performance.now() > feedingUntil.current) target.current = { x: event.clientX, y: event.clientY };
    };
    const feed = (event: PointerEvent) => {
      if (event.button !== 0 || (event.target as HTMLElement).closest("button, a, input, textarea, select, dialog, [role='dialog'], [contenteditable], .rat-controls")) return;
      if (document.querySelector(".rat-context-menu:popover-open")) return;
      feedAt(event.clientX, event.clientY, 1);
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", feed);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", feed);
    };
  }, [feedAt]);

  useEffect(() => {
    const rats = Array.from(field.current?.children ?? []) as HTMLElement[];
    rats.forEach((_, i) => {
      positions.current[i] ??= { x: i % 2 ? window.innerWidth : -80, y: 100 + i * 23 };
    });
    const impact = createRatImpact((pan) => audio.current?.squeak(pan));
    let frame = 0;
    let previous = 0;
    const tick = (time: number) => {
      const dt = Math.min((time - previous) / 1000, 0.04);
      previous = time;
      const beat = sound ? audio.current?.getBeat() : null;
      const pulse = reduceMotion ? 0 : (beat?.strength ?? 0);
      if (!document.hidden && bandStage.current) {
        const transport = bandStage.current.querySelector<HTMLElement>(".rat-band-transport");
        if (transport && beat) {
          const label = `${beat.section} · ${String(beat.bar).padStart(2, "0")}/32${beat.queued ? ` · ${{ build: "TENSION", drop: "FULL", pattern: "PATTERN" }[beat.queued]} QUEUED` : ""}`;
          if (transport.textContent !== label) transport.textContent = label;
        }
        bandStage.current.querySelectorAll<HTMLElement>(".rat-band-meter i").forEach((bar, index) => {
          bar.style.transform = `scaleY(${0.2 + pulse * (0.35 + ((index + (beat?.step ?? 0)) % 4) * 0.15)})`;
        });
      }
      if (!document.hidden) rats.forEach((rat, i) => {
        const point = positions.current[i];
        const angle = i * 2.4 + time * 0.0003;
        const eating = time < feedingUntil.current;
        const radius = eating ? 12 + i * 2.5 : 45 + i * 5;
        const speed = eating ? 1.9 : 1;
        const x = Math.max(0, Math.min(window.innerWidth - 80, target.current.x + Math.cos(angle) * radius - 40));
        const y = Math.max(40, Math.min(window.innerHeight - 130, target.current.y + Math.sin(angle) * radius - 30));
        const dx = x - point.x;
        point.x += dx * Math.min(1, dt * speed * (2 + i % 4));
        point.y += (y - point.y) * Math.min(1, dt * speed * (2 + i % 4));
        const musician = sound && i < BAND_PARTS.length && population >= BAND_PARTS[i].rats;
        const hop = (musician ? -pulse * 10 : 0) + Math.sin(time * 0.018 + i) * Math.min(eating ? 9 : 5, Math.abs(dx) * 0.1);
        rat.style.transform = reduceMotion
          ? `translate(${12 + (i % 8) * 38}px, ${window.innerHeight - 160 - Math.floor(i / 8) * 40}px) scale(.65)`
          : `translate(${point.x}px, ${point.y + hop}px) rotate(${hop}deg) scaleX(${dx < 0 ? -1 : 1})`;
      });
      if (!document.hidden) {
        // Reduced motion keeps the accent feedback under the pointer, without shaking.
        impact.update(time, reduceMotion ? [{ x: target.current.x - 38, y: target.current.y - 34 }] : positions.current.slice(0, population), !!reduceMotion);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); impact.dispose(); };
  }, [population, reduceMotion, sound]);

  useEffect(() => { audio.current?.setPopulation(population); }, [population]);

  useEffect(() => {
    const sync = () => {
      if (sound && !document.hidden) {
        void audio.current?.start().catch(() => setSound(false));
      } else audio.current?.stop();
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      audio.current?.stop();
    };
  }, [sound]);

  const toggleSound = () => {
    if (sound) {
      audio.current?.stop();
      setSound(false);
      return;
    }
    try {
      audio.current ??= new RatAudio();
      audio.current.setPopulation(population);
      audio.current.setMix(mix);
      // Resume inside the gesture, including on browsers with strict autoplay rules.
      void audio.current.start().catch(() => setSound(false));
      setSound(true);
    } catch { setSound(false); }
  };

  return createPortal(
    <div className="rat-takeover">
      <div className="rat-notice">RAT_MODE==TRUE</div>
      <div className="rat-stamp" aria-hidden="true">RAT RAVE<br /><small>Stay clear</small></div>
      <div ref={foodLayer} className="rat-food-layer" aria-hidden="true" />
      <div ref={field} className="rat-field" aria-hidden="true">
        {Array.from({ length: population }, (_, i) => (
          <div key={i} className={`rat-resident ${i === 7 ? "rat-boss" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/rat.png" alt="" draggable={false} />
            {sound && i < BAND_PARTS.length && population >= BAND_PARTS[i].rats && <div className="rat-instrument"><RatInstrument part={i} /></div>}
            {i === 7 && <span>management</span>}
          </div>
        ))}
      </div>
      <RatContextMenu full={population === MAX_RATS} sound={sound} onFeed={feedAt} onSound={toggleSound} onExit={onExit} />
      <aside className="rat-controls" aria-label="Rat mode controls">
        {sound && <div ref={bandStage}><RatBand mix={mix} onMix={(next) => { setMix(next); audio.current?.setMix(next); }} onCue={(cue) => audio.current?.cue(cue)} /></div>}
        <div className="rat-census"><strong>{String(population).padStart(2, "0")}</strong><span>rats active<br /><small>Click to feed. Right-click for controls.</small></span></div>
        <div className="rat-actions">
          <button onClick={() => { audio.current?.squeak(); setPopulation((n) => Math.min(MAX_RATS, n + 3)); }} disabled={population === MAX_RATS}>More rats</button>
          <button aria-pressed={sound} onClick={toggleSound}>Band {sound ? "on" : "off"}</button>
          <button onClick={onExit}>Evict all <kbd>ESC</kbd></button>
        </div>
      </aside>
    </div>, document.body,
  );
}
