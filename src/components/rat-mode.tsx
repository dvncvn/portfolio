"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useReducedMotion } from "framer-motion";
import { RatAudio } from "./rat-audio";
import "./rat-mode.css";

const MAX_RATS = 24;
const REPORTS = ["There were only three when I left.", "One of them has a key.", "They have eaten the invoice.", "The large one is apparently in charge.", "They are listed as collaborators now."];

export function RatMode({ onExit }: { onExit: () => void }) {
  const [population, setPopulation] = useState(3);
  const [sound, setSound] = useState(false);
  const field = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 180, y: 240 });
  const crumb = useRef<HTMLSpanElement>(null);
  const positions = useRef<{ x: number; y: number }[]>([]);
  const audio = useRef<RatAudio | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    document.documentElement.classList.add("rat-infested");
    return () => {
      document.documentElement.classList.remove("rat-infested");
      audio.current?.dispose();
      audio.current = null;
    };
  }, []);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "touch") target.current = { x: event.clientX, y: event.clientY };
    };
    const feed = (event: PointerEvent) => {
      if (event.button !== 0 || (event.target as HTMLElement).closest("button, a, input, textarea, select, dialog, [role='dialog'], [contenteditable], .rat-controls")) return;
      target.current = { x: event.clientX, y: event.clientY };
      audio.current?.squeak(event.clientX / window.innerWidth * 1.4 - 0.7);
      setPopulation((count) => Math.min(MAX_RATS, count + 1));
      if (crumb.current) {
        crumb.current.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
        crumb.current.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 900, fill: "forwards" });
      }
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", feed);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", feed);
    };
  }, []);

  useEffect(() => {
    const rats = Array.from(field.current?.children ?? []) as HTMLElement[];
    rats.forEach((_, i) => {
      positions.current[i] ??= { x: i % 2 ? window.innerWidth : -80, y: 100 + i * 23 };
    });
    let frame = 0;
    let previous = 0;
    const tick = (time: number) => {
      const dt = Math.min((time - previous) / 1000, 0.04);
      previous = time;
      if (!document.hidden) rats.forEach((rat, i) => {
        const point = positions.current[i];
        const angle = i * 2.4 + time * 0.0003;
        const radius = 45 + i * 5;
        const x = Math.max(0, Math.min(window.innerWidth - 80, target.current.x + Math.cos(angle) * radius - 40));
        const y = Math.max(40, Math.min(window.innerHeight - 130, target.current.y + Math.sin(angle) * radius - 30));
        const dx = x - point.x;
        point.x += dx * Math.min(1, dt * (2 + i % 4));
        point.y += (y - point.y) * Math.min(1, dt * (2 + i % 4));
        const hop = Math.sin(time * 0.018 + i) * Math.min(5, Math.abs(dx) * 0.1);
        rat.style.transform = reduceMotion
          ? `translate(${12 + (i % 8) * 38}px, ${window.innerHeight - 160 - Math.floor(i / 8) * 40}px) scale(.65)`
          : `translate(${point.x}px, ${point.y + hop}px) rotate(${hop}deg) scaleX(${dx < 0 ? -1 : 1})`;
      });
      if (!reduceMotion) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [population, reduceMotion]);

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
      // Resume inside the gesture, including on browsers with strict autoplay rules.
      void audio.current.start().catch(() => setSound(false));
      setSound(true);
    } catch { setSound(false); }
  };

  return createPortal(
    <div className="rat-takeover">
      <div className="rat-notice">THIS WEBSITE IS NOW MOSTLY RATS <span>Property of the rats. Including the margins.</span></div>
      <div className="rat-stamp" aria-hidden="true">INSPECTED<br />BY A RAT<br /><small>no issues found</small></div>
      <div ref={field} className="rat-field" aria-hidden="true">
        {Array.from({ length: population }, (_, i) => (
          <div key={i} className={`rat-resident ${i === 7 ? "rat-boss" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/rat.png" alt="" draggable={false} />
            {i === 7 && <span>management</span>}
          </div>
        ))}
      </div>
      <span ref={crumb} className="rat-crumb" aria-hidden="true">✦ · ˙</span>
      <aside className="rat-controls" aria-label="Rat mode controls">
        <div className="rat-census"><strong>{String(population).padStart(2, "0")}</strong><span>rats on payroll<br /><small>{population === MAX_RATS ? "Hiring freeze. No room." : "Click empty space to drop crumbs."}</small></span></div>
        <p role="status">{REPORTS[Math.min(4, Math.floor((population - 3) / 4))]}</p>
        <div className="rat-actions">
          <button onClick={() => { audio.current?.squeak(); setPopulation((n) => Math.min(MAX_RATS, n + 3)); }} disabled={population === MAX_RATS}>More rats</button>
          <button aria-pressed={sound} onClick={toggleSound}>Sound {sound ? "on" : "off"}</button>
          <button onClick={onExit}>Evict all <kbd>ESC</kbd></button>
        </div>
      </aside>
    </div>, document.body,
  );
}
