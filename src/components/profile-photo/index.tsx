"use client";

import { useCallback, useEffect, useId, useRef, useState, type MouseEvent, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { PhotoHistory } from "./photo-history";
import { EffectImage } from "./effect-image";
import styles from "./controls.module.css";
import { NormalState } from "./normal-state";
import { DitherPicker } from "./dither-picker";
import { InkPicker } from "./ink-picker";
import { TiltPhoto, usePhotoTilt } from "./tilt-photo";
import { useSharedPhoto } from "./use-shared-photo";
import type { PhotoRecipe } from "@/lib/shared-photo";
import { PIXEL_MAX_SIZE, ASCII_MAX_SIZE, ASCII_SETS, BLAZE_ORANGE, DEFAULT_SETTINGS, type AsciiSet, type EffectSettings, type ImageEffect } from "@/lib/photo-effects";

function EffectButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors duration-200 ${
        isActive
          ? "bg-white/[0.12] text-foreground"
          : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

export function ProfilePhoto() {
  const tilt = usePhotoTilt();
  const photoRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const photoRippleRef = useRef<HTMLSpanElement>(null);
  const previewRippleRef = useRef<HTMLSpanElement>(null);
  const rippleAnimation = useRef<Animation | null>(null);
  const rippleFrame = useRef(0);
  useEffect(() => () => {
    cancelAnimationFrame(rippleFrame.current);
    rippleAnimation.current?.cancel();
  }, []);
  const shared = useSharedPhoto();
  const { effect: imageEffect, settings, colors } = shared.recipe;
  const setImageEffect = (effect: ImageEffect) => shared.changeRecipe((current) => ({ ...current, effect }));
  const setSettings = (update: (current: PhotoRecipe["settings"]) => PhotoRecipe["settings"]) =>
    shared.changeRecipe((current) => ({ ...current, settings: update(current.settings) }));
  const setColors = (update: (current: PhotoRecipe["colors"]) => PhotoRecipe["colors"]) =>
    shared.changeRecipe((current) => ({ ...current, colors: update(current.colors) }));
  const [showControls, setShowControls] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const positionPanel = useCallback(() => {
    const photo = photoRef.current;
    const panel = panelRef.current;
    if (!photo || !panel) return;
    const rect = photo.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    // The site's stable scrollbar gutters offset the fixed top-layer origin.
    const viewportLeft = document.documentElement.getBoundingClientRect().left + window.scrollX;
    const viewportHeight = window.innerHeight;
    const controlsWidth = Math.min(360, viewportWidth - 32);
    const beside = rect.left >= controlsWidth + 32;
    const padding = 8;
    const gap = 16;
    const width = beside ? controlsWidth + gap + rect.width + padding * 2 : controlsWidth;
    const availableHeight = viewportHeight - 32;
    // On small screens the portrait is too short to be a useful control panel.
    // Give the editor enough room to scroll comfortably while keeping it inside
    // the visual viewport, and keep it aligned with the photo when possible.
    const stackedHeight = Math.min(Math.max(rect.height, 560), availableHeight);
    const top = beside
      ? rect.top - padding
      : Math.max(16, Math.min(rect.top, viewportHeight - stackedHeight - 16));
    const left = beside
      ? rect.left - controlsWidth - gap - padding
      : Math.max(16, Math.min(rect.left + (rect.width - width) / 2, viewportWidth - width - 16));
    panel.dataset.beside = String(beside);
    panel.style.left = `${left - viewportLeft}px`;
    panel.style.top = `${top}px`;
    panel.style.width = `${width}px`;
    panel.style.height = `${beside ? rect.height + padding * 2 : stackedHeight}px`;
    panel.style.setProperty("--photo-width", `${rect.width}px`);
    panel.style.setProperty("--closed-inset", beside
      ? `8px 8px 8px ${controlsWidth + gap + padding}px round 24px`
      : `${Math.max(0, rect.top - top)}px ${Math.max(0, left + width - rect.right)}px ${Math.max(0, top + stackedHeight - rect.bottom)}px ${Math.max(0, rect.left - left)}px round 24px`);
  }, []);
  useEffect(() => {
    positionPanel();
    let frame = 0;
    const reposition = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(positionPanel);
    };
    const observer = new ResizeObserver(reposition);
    if (photoRef.current) observer.observe(photoRef.current);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [positionPanel]);
  const openFromPhoto = (event: MouseEvent<HTMLButtonElement>) => {
    positionPanel();
    if (panelRef.current) panelRef.current.dataset.keyboard = String(event.detail === 0);
    cancelAnimationFrame(rippleFrame.current);
    rippleAnimation.current?.cancel();
    // Keyboard activation opens the editor without a decorative pointer response.
    if (!event.detail || panelRef.current?.matches(":popover-open")) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(bounds.width, event.clientX - bounds.left));
    const y = Math.max(0, Math.min(bounds.height, event.clientY - bounds.top));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const diameter = reduced ? 100 : Math.hypot(Math.max(x, bounds.width - x), Math.max(y, bounds.height - y)) * 2;
    // Wait for the native popover to open, then draw on the visible copy of the photo.
    rippleFrame.current = requestAnimationFrame(() => {
      if (!panelRef.current?.matches(":popover-open")) return;
      const ripple = panelRef.current.dataset.beside === "true" ? previewRippleRef.current : photoRippleRef.current;
      if (!ripple) return;
      Object.assign(ripple.style, {
        width: `${diameter}px`, height: `${diameter}px`,
        left: `${x - diameter / 2}px`, top: `${y - diameter / 2}px`,
      });
      rippleAnimation.current = ripple.animate([
        { transform: reduced ? "scale(1)" : "scale(0.02)", opacity: 0, offset: 0 },
        { opacity: 0.18, offset: 0.2 },
        { opacity: 0.18, offset: 0.5 },
        { transform: "scale(1)", opacity: 0, offset: 1 },
      ], { duration: reduced ? 150 : 700, easing: "ease-in-out" });
    });
  };
  const closePanel = () => {
    panelRef.current?.hidePopover();
    photoRef.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
  };
  const activeEffect = imageEffect === "normal" ? "dither" : imageEffect;
  const active = settings[activeEffect];
  const update = (patch: Partial<EffectSettings>) => setSettings((current) => ({
    ...current, [activeEffect]: { ...current[activeEffect], ...patch },
  }));
  const reset = () => {
    setSettings((current) => ({ ...current, [activeEffect]: DEFAULT_SETTINGS[activeEffect] }));
    setColors((current) => ({ ...current, [activeEffect]: null }));
  };

  return (
          <div>
          <div ref={photoRef} className={styles.photoRoot}>
            <TiltPhoto
              tilt={tilt}
              disabled={shared.status === "loading"}
              onClick={openFromPhoto}
              expanded={showControls}
              onHoverChange={setIsHovered}
            >
              <EffectImage
                ready={shared.status !== "loading"}
                src="/assets/profile.png"
                effect={imageEffect}
                settings={active}
                color={colors[activeEffect]}
              />
              <span ref={photoRippleRef} className={styles.ripple} aria-hidden="true" />
              <span className={styles.editGrid} data-active={showControls} aria-hidden="true" />
              {/* Edit icon - appears on hover */}
              {/* Edit icon indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: shared.status !== "loading" && (isHovered || showControls) ? 1 : 0 }}
                transition={{ duration: 0.2 }}
                className="[@media(hover:none)]:!opacity-100 pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/50 p-2 text-white/70 backdrop-blur-sm"
                aria-hidden="true"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M13 7 8.7 2.7a2.41 2.41 0 0 0-3.4 0L2.7 5.3a2.41 2.41 0 0 0 0 3.4L7 13" />
                  <path d="m8 6 2-2" />
                  <path d="m18 16 2-2" />
                  <path d="m17 11 4.3 4.3c.94.94.94 2.46 0 3.4l-2.6 2.6c-.94.94-2.46.94-3.4 0L11 17" />
                  <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                  <path d="m15 5 4 4" />
                </svg>
              </motion.div>
            </TiltPhoto>
            {/* Native popover stays above the page without changing its layout. */}
            <div
              ref={panelRef}
              id="photo-effects"
              popover="auto"
              role="region"
              aria-label="Photo effects"
              onToggle={(event) => {
                setShowControls(event.newState === "open");
                if (event.newState === "closed") void shared.saveOnClose();
              }}
              className={styles.panel}
            >
              <div className={styles.controls} data-empty={imageEffect === "normal"}>
                {/* Effect selector row */}
                <div className={styles.panelHeader} data-has-controls={imageEffect !== "normal"}>
                  <div className={styles.effectTabs}>
                    <EffectButton
                      label="Normal"
                      isActive={imageEffect === "normal"}
                      onClick={() => setImageEffect("normal")}
                    />
                    <EffectButton
                      label="Dither"
                      isActive={imageEffect === "dither"}
                      onClick={() => setImageEffect("dither")}
                    />
                    <EffectButton
                      label="Pixelate"
                      isActive={imageEffect === "pixelate"}
                      onClick={() => setImageEffect("pixelate")}
                    />
                    <EffectButton
                      label="ASCII"
                      isActive={imageEffect === "ascii"}
                      onClick={() => setImageEffect("ascii")}
                    />
                  </div>
                  <button
                    onClick={closePanel}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                    aria-label="Close controls"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                {imageEffect === "normal" && <NormalState />}
                {imageEffect !== "normal" && (
                  <div className={styles.parameters}>
                    {imageEffect === "dither" && <DitherPicker value={active.ditherType ?? "bayer"} onChange={(ditherType) => update({ ditherType })} />}
                    <EffectSlider label={imageEffect === "dither" ? "Dot size" : imageEffect === "pixelate" ? "Pixel size" : "Type size"}
                      defaultValue={DEFAULT_SETTINGS[activeEffect].size} value={active.size} min={imageEffect === "dither" ? 1 : 4} max={imageEffect === "dither" ? 8 : imageEffect === "ascii" ? ASCII_MAX_SIZE : PIXEL_MAX_SIZE} unit="px" onChange={(size) => update({ size })} />
                    <EffectSlider defaultValue={0} label="Brightness" value={active.brightness} min={-50} max={50} unit="%" onChange={(brightness) => update({ brightness })} />
                    <EffectSlider defaultValue={100} label="Contrast" value={active.contrast} min={25} max={200} unit="%" onChange={(contrast) => update({ contrast })} />
                    {imageEffect === "dither" && <EffectSlider defaultValue={50} label="Threshold" value={active.threshold} min={0} max={100} unit="%" onChange={(threshold) => update({ threshold })} />}
                    {imageEffect === "pixelate" && <EffectSlider defaultValue={256} label="Tone levels" value={active.levels} min={2} max={256} onChange={(levels) => update({ levels })} />}
                    {imageEffect === "ascii" && <>
                      <fieldset className={styles.glyphPicker}>
                        <legend>Character set</legend>
                        <div className={styles.glyphOptions}>
                          {(Object.keys(ASCII_SETS) as AsciiSet[]).map((glyphs) => (
                            <button key={glyphs} type="button" aria-label={ASCII_SETS[glyphs].label} aria-pressed={active.glyphs === glyphs} onClick={() => update({ glyphs })}>
                              <span aria-hidden="true">{ASCII_SETS[glyphs].sample}</span>
                            </button>
                          ))}
                        </div>
                      </fieldset>
                      <EffectSlider defaultValue={0} label="Letter spacing" value={active.gap} min={0} max={3} step={0.5} unit="px" onChange={(gap) => update({ gap })} />
                    </>}
                    <InkPicker
                        value={colors[imageEffect] ?? (imageEffect === "ascii" ? BLAZE_ORANGE : { r: 255, g: 255, b: 255 })}
                        onChange={(color) => setColors((current) => ({ ...current, [imageEffect]: color }))}
                    />
                    <div className={styles.footer}>
                      <label className="flex cursor-pointer items-center gap-2">
                        <input type="checkbox" checked={active.invert} onChange={(event) => update({ invert: event.target.checked })} className={styles.toggle} />
                        Invert tones
                      </label>
                      <button type="button" onClick={reset} className="rounded px-2 py-1 hover:bg-white/5 hover:text-foreground">Reset effect</button>
                    </div>
                  </div>
                )}
                {shared.location && (
                  <div className={styles.saveOptions}>
                    <label title="Approximate location, based on your internet connection">
                      <input type="checkbox" checked={shared.shareLocation} onChange={(event) => shared.setShareLocation(event.target.checked)} />
                      Include {shared.location}
                    </label>
                  </div>
                )}
              </div>
              <motion.div className={styles.panelPreview} style={{ transform: tilt.transform }} aria-hidden="true">
                <EffectImage
                  ready={shared.status !== "loading"}
                  src="/assets/profile.png"
                  effect={imageEffect}
                  settings={active}
                  color={colors[activeEffect]}
                />
                <span ref={previewRippleRef} className={styles.ripple} aria-hidden="true" />
                <span className={styles.editGrid} data-active={showControls} aria-hidden="true" />
                <motion.span aria-hidden="true" style={{ transform: tilt.reflection, opacity: tilt.shineOpacity }}
                  className="pointer-events-none absolute -inset-1/2 bg-[radial-gradient(ellipse_at_center,white,transparent_60%)]" />
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[24px] border border-white/10" />
              </motion.div>
            </div>
          </div>
          <p className={styles.attribution} role="status" aria-live="polite">
            {shared.message ? shared.message
              : shared.savedEdit?.location ? `Last edit from ${shared.savedEdit.location.replace(/, /g, " ")}`
              : null}
          </p>
          <PhotoHistory edits={shared.previous} />
          </div>
  );
}

function EffectSlider({ label, value, min, max, step = 1, unit = "", defaultValue, onChange }: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string;
  defaultValue: number; onChange: (value: number) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const percentage = (value - min) / (max - min) * 100;
  const neutral = (defaultValue - min) / (max - min) * 100;
  const commit = (raw: number) => {
    if (!Number.isFinite(raw)) return;
    onChange(Number(Math.max(min, Math.min(max, min + Math.round((raw - min) / step) * step)).toFixed(2)));
  };
  return (
    <div className={styles.slider} style={{ "--fill": `${percentage}%`, "--neutral": `${neutral}%` } as CSSProperties}>
      <div className={styles.sliderHeading}>
        <label htmlFor={id}>{label}</label>
        <span className={styles.readout}>
          <input type="number" aria-label={`${label} value`} min={min} max={max} step={step} value={draft ?? value}
            onFocus={() => setDraft(String(value))}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => {
              if (draft !== null && draft.trim() !== "") commit(Number(draft));
              setDraft(null);
            }}
            onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} />
          {unit && <span>{unit}</span>}
        </span>
      </div>
      <div className={styles.rail}>
        <span className={styles.track} aria-hidden="true"><span /></span>
        <span className={styles.ticks} aria-hidden="true" />
        <span className={styles.defaultMark} aria-hidden="true" title={`Default: ${defaultValue}${unit}`} />
        <input id={id} type="range" min={min} max={max} step={step} value={value} aria-valuetext={`${value}${unit}`}
          onChange={(event) => onChange(Number(event.target.value))} className={styles.range} />
      </div>
    </div>
  );
}
