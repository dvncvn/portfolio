"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import { useStudioTransition } from "./studio-transition";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Dices, Plus, RotateCcw, X } from "lucide-react";
import { LayerList } from "./layer-list";
import { PhotoHistory } from "./photo-history";
import { EffectImage } from "./effect-image";
import { EffectChooser } from "./effect-chooser";
import styles from "./controls.module.css";
import { DitherPicker } from "./dither-picker";
import { InkPicker } from "./ink-picker";
import { GradientPicker } from "./gradient-picker";
import { TiltPhoto, usePhotoTilt } from "./tilt-photo";
import { useSharedPhoto } from "./use-shared-photo";
import { photoLayers, PHOTO_LAYER_LIMIT, type PhotoLayer, type PhotoRecipe } from "@/lib/shared-photo";
import { randomPhotoEffect, randomPhotoLayers } from "@/lib/photo-randomize";
import { createPhotoEditId } from "@/lib/photo-edit-id";
import { GRADIENT_PRESETS, EFFECT_LABELS, PIXEL_MAX_SIZE, ASCII_MAX_SIZE, ASCII_SETS, BLAZE_ORANGE, DEFAULT_SETTINGS, type AsciiSet, type EffectSettings } from "@/lib/photo-effects";

export function ProfilePhoto() {
  const tilt = usePhotoTilt();
  const reducedMotion = useReducedMotion();
  const guideMaskId = useId();
  const addLayerTooltipId = useId();
  const [addTooltipPosition, setAddTooltipPosition] = useState<{ left: number; top: number } | null>(null);
  const showAddTooltip = (element: HTMLElement) => {
    const anchor = element.getBoundingClientRect();
    const panel = panelRef.current?.getBoundingClientRect();
    if (panel) {
      const fitsRight = anchor.right + 140 <= panel.right;
      setAddTooltipPosition({
        left: fitsRight ? anchor.right - panel.left + 8 : Math.max(16, panel.width - 132),
        top: fitsRight ? anchor.top - panel.top + anchor.height / 2 : anchor.bottom - panel.top + 24,
      });
    }
  };
  const [guidesReady, setGuidesReady] = useState(false);
  const photoRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDialogElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const transitionStudio = useStudioTransition();
  const closingRef = useRef(false);
  const openedWithPointer = useRef(false);
  const shared = useSharedPhoto();
  const [effectPicker, setEffectPicker] = useState<"add" | "replace" | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const layers = photoLayers(shared.recipe);
  const selectedLayer = layers.find((layer) => layer.id === selectedLayerId) ?? layers.at(0);
  const imageEffect = selectedLayer?.effect ?? "normal";
  const choosingEffect = effectPicker !== null || imageEffect === "normal" || imageEffect === "sticker" || imageEffect === "grain";
  const settings = selectedLayer ? { ...shared.recipe.settings, [selectedLayer.effect]: selectedLayer.settings } : shared.recipe.settings;
  const colors = selectedLayer ? { ...shared.recipe.colors, [selectedLayer.effect]: selectedLayer.color } : shared.recipe.colors;
  const changeLayers = (update: (current: PhotoLayer[]) => PhotoLayer[]) => shared.changeRecipe((current) => {
    const next = update(photoLayers(current));
    return { ...current, layers: next, effect: next.filter((layer) => layer.enabled).at(-1)?.effect ?? "normal" };
  });
  const setSettings = (update: (current: PhotoRecipe["settings"]) => PhotoRecipe["settings"]) => {
    if (!selectedLayer) return;
    const next = update(settings)[selectedLayer.effect];
    changeLayers((current) => current.map((layer) => layer.id === selectedLayer.id ? { ...layer, settings: next } : layer));
  };
  const setColors = (update: (current: PhotoRecipe["colors"]) => PhotoRecipe["colors"]) => {
    if (!selectedLayer) return;
    const next = update(colors)[selectedLayer.effect];
    changeLayers((current) => current.map((layer) => layer.id === selectedLayer.id ? { ...layer, color: next } : layer));
  };
  const addLayer = (effect: PhotoLayer["effect"]) => {
    if (layers.length >= PHOTO_LAYER_LIMIT) return;
    const id = createPhotoEditId();
    changeLayers((current) => [...current, { id, effect, enabled: true, settings: { ...DEFAULT_SETTINGS[effect] }, color: null }]);
    setSelectedLayerId(id);
  };
  const selectEffect = (effect: PhotoLayer["effect"] | "normal") => {
    if (!selectedLayer) {
      if (effect !== "normal") addLayer(effect);
      return;
    }
    changeLayers((current) => current.map((layer) => {
      if (layer.id !== selectedLayer.id) return layer;
      if (effect === "normal") return { ...layer, enabled: false };
      return effect === layer.effect ? { ...layer, enabled: true } : {
        ...layer, effect, enabled: true, settings: { ...DEFAULT_SETTINGS[effect] },
      };
    }));
  };
  const moveLayer = (id: string, direction: number) => changeLayers((current) => {
    const index = current.findIndex((layer) => layer.id === id);
    const next = [...current];
    if (index + direction < 0 || index + direction >= next.length) return current;
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    return next;
  });
  const entryRecipe = useRef<PhotoRecipe | null>(null);
  const entryLocation = useRef(true);
  const [previewWidth, setPreviewWidth] = useState<number>();
  const isSaving = shared.status === "saving";
  const [showControls, setShowControls] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  useEffect(() => {
    if (!showControls) return;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [showControls]);
  const focusPanel = (selector: string) => {
    requestAnimationFrame(() => {
      if (panelRef.current?.open && !closingRef.current) {
        panelRef.current.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true });
      }
    });
  };
  const cancelEffectPicker = () => {
    setEffectPicker(null);
    focusPanel(imageEffect === "normal" ? '[aria-label="Add layer"]' : "[data-effect-selector]");
  };
  const browseEffects = (mode: "add" | "replace") => {
    setEffectPicker(mode);
    focusPanel("[data-effect-chooser] button");
  };
  const newDesign = () => {
    if (closingRef.current) return;
    changeLayers(() => []);
    setSelectedLayerId(null);
    setAddTooltipPosition(null);
    browseEffects("add");
  };
  const openFromPhoto = (event: MouseEvent<HTMLButtonElement>) => {
    openedWithPointer.current = event.detail > 0;
    setAddTooltipPosition(null);
    setGuidesReady(false);
    setEffectPicker(layers.length === 0 ? "add" : null);
    entryRecipe.current = shared.recipe;
    entryLocation.current = shared.shareLocation;
    const panel = panelRef.current;
    const source = photoRef.current?.querySelector<HTMLElement>("[data-photo-surface]");
    if (!panel || !source) return;
    closingRef.current = false;
    delete panel.dataset.exiting;
    delete panel.dataset.actionsRetracted;
    panel.dataset.phase = "entering";
    panel.showModal();
    flushSync(() => { setPreviewWidth(source.clientWidth); setShowControls(true); });
    panel.focus({ preventScroll: true });
    setAddTooltipPosition(null);
    if (previewRef.current) void transitionStudio(panel, source, previewRef.current, true, () => {
      if (!closingRef.current) setGuidesReady(true);
    });
  };
  const closeStudio = async () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setAddTooltipPosition(null);
    const panel = panelRef.current;
    const target = photoRef.current?.querySelector<HTMLElement>("[data-photo-surface]");
    const actions = panel?.querySelector<HTMLElement>(`.${styles.saveActions}`);
    let retract: Animation | undefined;
    if (panel) panel.dataset.exiting = "true";
    if (actions) {
      // Tuck the tray behind the stationary portrait before its return flight.
      const current = getComputedStyle(actions);
      retract = actions.animate([
        { transform: current.transform, opacity: current.opacity },
        { transform: "translateY(-64px)", opacity: 1 },
      ], { duration: reducedMotion ? 0 : 240, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" });
      try { await retract.finished; } catch { /* The editor may unmount mid-transition. */ }
    }
    if (panel) panel.dataset.actionsRetracted = "true";
    retract?.cancel();
    if (panel?.isConnected && target && previewRef.current) await transitionStudio(panel, previewRef.current, target, false);
    // Escape changes the browser’s focus modality; retain the way editing began.
    const trigger = photoRef.current?.querySelector<HTMLButtonElement>("button");
    if (openedWithPointer.current) trigger?.setAttribute("data-restored-pointer-focus", "true");
    panel?.close();
  };
  const cancelEditing = () => {
    if (closingRef.current) return;
    if (entryRecipe.current) {
      const original = entryRecipe.current;
      shared.changeRecipe(() => original);
      shared.setShareLocation(entryLocation.current);
    }
    void closeStudio();
  };
  const saveEditing = () => {
    if (closingRef.current) return;
    // The hook snapshots and queues the recipe independently of the editor.
    void shared.saveChanges();
    void closeStudio();
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
  const randomize = () => {
    if (!selectedLayer) return;
    const next = randomPhotoEffect(selectedLayer.effect);
    changeLayers((current) => current.map((layer) => layer.id === selectedLayer.id ? { ...layer, ...next } : layer));
  };
  const randomizeDesign = () => {
    if (closingRef.current) return;
    const next = randomPhotoLayers();
    changeLayers(() => next);
    setSelectedLayerId(next[0].id);
    setEffectPicker(null);
    setAddTooltipPosition(null);
  };

  return (
          <div>
          <div ref={photoRef} className={styles.photoRoot}>
            <TiltPhoto
              tilt={tilt}
              saving={isSaving}
              disabled={shared.status === "loading"}
              onClick={openFromPhoto}
              expanded={showControls}
              onHoverChange={setIsHovered}
            >
              <EffectImage
                layers={shared.recipe.layers}
                ready={shared.status !== "loading"}
                src="/assets/profile.png"
                effect={shared.recipe.effect}
                settings={active}
                color={colors[activeEffect]}
              />
              {/* Edit label for the photo button - appears on hover or focus */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: shared.status !== "loading" && (isHovered || showControls) ? 1 : 0 }}
                transition={{ duration: 0.2 }}
                className="[@media(hover:none)]:!opacity-100 pointer-events-none absolute bottom-3 right-3 rounded-md bg-black/50 px-3 py-1.5 text-[14px] font-normal leading-5 text-white backdrop-blur-sm"
                aria-hidden="true"
              >
                Edit
              </motion.div>
            </TiltPhoto>
            <dialog
              ref={panelRef}
              id="photo-effects"
              aria-label="Edit photo"
              tabIndex={-1}
              autoFocus
              onScrollCapture={() => setAddTooltipPosition(null)}
              onKeyDown={(event) => {
                if (event.defaultPrevented || event.repeat || !event.shiftKey || event.ctrlKey || event.metaKey || event.altKey || event.key.toLowerCase() !== "n") return;
                if ((event.target as HTMLElement).closest('textarea, select, input:not([type="range"]):not([type="checkbox"]):not([type="radio"]):not([type="button"]), [contenteditable]:not([contenteditable="false"])')) return;
                if (!showControls || closingRef.current || layers.length >= PHOTO_LAYER_LIMIT) return;
                event.preventDefault();
                event.stopPropagation();
                browseEffects("add");
              }}
              onCancel={(event) => { event.preventDefault(); cancelEditing(); }}
              onClose={() => {
                setShowControls(false);
                photoRef.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
              }}
              className={styles.panel}
            >
              <div className={styles.studioBody}>
                <motion.aside layoutScroll className={styles.layersPanel} aria-label="Effect layers">
                  <div className={styles.layersHeading}>
                    <h2>Layers</h2>
                    <div className={styles.layerHeaderActions}>
                    <button type="button" className={styles.layerAdd} aria-label="Randomize design" title="Randomize design · 6 layers" onClick={randomizeDesign}><Dices size={14} aria-hidden="true" /></button>
                    <button type="button" className={styles.layerAdd} aria-label="New design" title="New design" disabled={layers.length === 0} onClick={newDesign}><RotateCcw size={14} aria-hidden="true" /></button>
                    <span className={styles.layerAddWrap}
                      onPointerEnter={(event) => { if (event.pointerType !== "touch") showAddTooltip(event.currentTarget); }}
                      onPointerLeave={() => setAddTooltipPosition(null)}
                      onFocus={(event) => { if (event.target.matches(":focus-visible")) showAddTooltip(event.currentTarget); }}
                      onBlur={() => setAddTooltipPosition(null)}>
                      <button type="button" className={styles.layerAdd} aria-label="Add layer" aria-describedby={addLayerTooltipId} aria-keyshortcuts="Shift+N" disabled={layers.length >= PHOTO_LAYER_LIMIT || effectPicker === "add"} onClick={() => browseEffects("add")}><Plus size={16} aria-hidden="true" /></button>

                    </span>
                    </div>
                  </div>
                  <LayerList key={showControls ? "editing" : "closed"} layers={layers} selectedId={effectPicker === "add" ? undefined : selectedLayer?.id}
                    onSelect={(id) => { setSelectedLayerId(id); setEffectPicker(null); }}
                    onToggle={(id) => changeLayers((current) => current.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item))}
                    onReorder={(ids) => {
                      if (closingRef.current) return;
                      changeLayers((current) => {
                        if (ids.length !== current.length || !ids.every((id) => current.some((item) => item.id === id))) return current;
                        return ids.map((id) => current.find((item) => item.id === id)!);
                      });
                    }}
                    onRemove={(id) => {
                      const index = layers.findIndex((layer) => layer.id === id);
                      const next = layers[index + 1] ?? layers[index - 1];
                      changeLayers((current) => current.filter((item) => item.id !== id));
                      if (selectedLayer?.id === id) setSelectedLayerId(next?.id ?? null);
                      focusPanel(next ? `[data-layer-id="${next.id}"]` : '[aria-label="Add layer"]');
                    }}
                    onMove={moveLayer} />
                  {effectPicker === "add" && <div className={styles.pendingLayer}>
                    <Plus size={14} aria-hidden="true" />
                    <button type="button" className={styles.pendingLayerLabel} onClick={() => focusPanel("[data-effect-chooser] button")}>Choose effect</button>
                    <button type="button" className={styles.layerRemove} aria-label="Cancel new layer" onClick={cancelEffectPicker}><X size={14} aria-hidden="true" /></button>
                  </div>}
                </motion.aside>
                <section className={styles.stage} aria-label="Photo preview">
                  <div className={styles.canvasArea}>
                    <div className={styles.photoFrame}>
                      <svg className={styles.photoGuides} viewBox="0 0 1200 1500" preserveAspectRatio="none" aria-hidden="true">
                        <defs>
                          <mask id={guideMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width="1200" height="1500">
                            <motion.rect fill="white"
                              initial={{ x: 400, y: 500, width: 400, height: 500 }}
                              animate={guidesReady ? { x: 0, y: 0, width: 1200, height: 1500 } : { x: 400, y: 500, width: 400, height: 500 }}
                              transition={{ duration: guidesReady && !reducedMotion ? 2.4 : 0, ease: [0.2, 0.65, 0.25, 1] }} />
                          </mask>
                        </defs>
                        <g mask={`url(#${guideMaskId})`} fill="none" stroke="currentColor" strokeWidth="1">
                          <g><path d="M400 0V1500 M800 0V1500 M0 500H1200 M0 1000H1200" vectorEffect="non-scaling-stroke" /></g>
                          <g><path d="M533.333 0V1500 M666.667 0V1500 M0 666.667H1200 M0 833.333H1200" strokeDasharray="3 5" vectorEffect="non-scaling-stroke" /></g>
                          <g><path d="M0 0L1200 1500 M1200 0L0 1500" opacity=".6" vectorEffect="non-scaling-stroke" /></g>
                        </g>
                      </svg>
                    <div ref={previewRef} className={styles.panelPreview}>
                      {showControls && <EffectImage
                        layers={shared.recipe.layers}
                        renderWidth={previewWidth}
                        ready={shared.status !== "loading"}
                        src="/assets/profile.png"
                        effect={shared.recipe.effect}
                        settings={active}
                        color={colors[activeEffect]}
                      />}
                    </div>
                  <footer className={styles.saveActions}>
                    <button type="button" onClick={cancelEditing} className={styles.editorButton}>Discard</button>
                    <button type="button" onClick={saveEditing} className={`${styles.editorButton} ${styles.primaryButton}`}>Save</button>
                  </footer>
                    </div>
                  </div>
                </section>
                <aside className={styles.inspector} aria-label="Photo controls">
              <div className={styles.controls}>
                <div className={`${styles.panelHeader} ${styles.effectNavigation}`}>
                  {effectPicker === "add" ? <>
                    <h3>Add effect</h3>
                    <button type="button" className={`${styles.editorButton} ${styles.effectPickerCancel}`} aria-label="Cancel choosing an effect" onClick={cancelEffectPicker}><X size={14} aria-hidden="true" /></button>
                  </> : imageEffect !== "normal" && imageEffect !== "sticker" && imageEffect !== "grain" ? (
                    <button type="button" className={`${styles.editorButton} ${styles.effectSelector}`} aria-label={`Change effect: ${EFFECT_LABELS[imageEffect]}`} aria-expanded={choosingEffect}
                      data-effect-selector onClick={() => choosingEffect ? cancelEffectPicker() : browseEffects("replace")}>
                      <span>{EFFECT_LABELS[imageEffect]}</span>
                      <ChevronDown size={16} aria-hidden="true" />
                    </button>
                  ) : <h3>Effects</h3>}
                </div>
                {choosingEffect && showControls && <EffectChooser onChoose={(effect) => {
                  if (effectPicker === "add" || !selectedLayer) addLayer(effect);
                  else selectEffect(effect);
                  setEffectPicker(null);
                  focusPanel("[data-effect-selector]");
                }} />}
                {!choosingEffect && (
                  <div className={styles.parameters}>
                    <EffectSlider label="Opacity" value={selectedLayer?.opacity ?? 100} min={0} max={100} defaultValue={100} unit="%"
                      onChange={(opacity) => changeLayers((current) => current.map((layer) => layer.id === selectedLayer?.id ? { ...layer, opacity } : layer))} />
                    {imageEffect === "chromatic" && <>
                      <EffectSlider label="Amount" value={active.amount ?? 2} min={0} max={10} defaultValue={2} unit="%" onChange={(amount) => update({ amount })} />
                      <EffectSlider label="Angle" value={active.rotation ?? 0} min={-180} max={180} defaultValue={0} unit="°" onChange={(rotation) => update({ rotation })} />
                      <EffectSlider label="Edge bias" value={active.edgeBias ?? 70} min={0} max={100} defaultValue={70} unit="%" onChange={(edgeBias) => update({ edgeBias })} />
                    </>}
                    {imageEffect === "vhs" && <>
                      <EffectSlider label="Color bleed" value={active.bleed ?? 45} min={0} max={100} defaultValue={45} unit="%" onChange={(bleed) => update({ bleed })} />
                      <EffectSlider label="Tracking" value={active.tracking ?? 25} min={0} max={100} defaultValue={25} unit="%" onChange={(tracking) => update({ tracking })} />
                      <EffectSlider label="Wear" value={active.wear ?? 30} min={0} max={100} defaultValue={30} unit="%" onChange={(wear) => update({ wear })} />
                    </>}
                    {imageEffect === "decay" && <>
                      <EffectSlider label="Corruption" value={active.amount ?? 35} min={0} max={100} defaultValue={35} unit="%" onChange={(amount) => update({ amount })} />
                      <EffectSlider label="Artifact scale" value={active.size} min={4} max={64} defaultValue={16} unit="px" onChange={(size) => update({ size })} />
                      <EffectSlider label="Repetition" value={active.repetition ?? 50} min={0} max={100} defaultValue={50} unit="%" onChange={(repetition) => update({ repetition })} />
                    </>}
                    {imageEffect === "gradient" && <GradientPicker
                      shadows={active.shadows ?? GRADIENT_PRESETS[0].shadows} highlights={active.highlights ?? GRADIENT_PRESETS[0].highlights} onChange={update} />}
                    {imageEffect === "slice" && <>
                      <EffectSlider label="Slices" value={active.bands ?? 12} min={2} max={40} defaultValue={12} onChange={(bands) => update({ bands })} />
                      <EffectSlider label="Angle" value={active.rotation ?? 0} min={-180} max={180} defaultValue={0} unit="°" onChange={(rotation) => update({ rotation })} />
                      <EffectSlider label="Displacement" value={active.amount ?? 12} min={0} max={35} defaultValue={12} unit="%" onChange={(amount) => update({ amount })} />
                    </>}
                    {imageEffect === "scanlines" && <>
                      <EffectSlider label="Spacing" value={active.size} min={2} max={40} defaultValue={6} unit="px" onChange={(size) => update({ size })} />
                      <EffectSlider label="Thickness" value={active.coverage ?? 25} min={5} max={75} defaultValue={25} unit="%" onChange={(coverage) => update({ coverage })} />
                      <EffectSlider label="Strength" value={active.amount ?? 55} min={0} max={100} defaultValue={55} unit="%" onChange={(amount) => update({ amount })} />
                    </>}
                    {imageEffect === "offset" && <>
                      <EffectSlider label="Horizontal offset" value={active.x ?? 4} min={-25} max={25} defaultValue={4} unit="%" onChange={(x) => update({ x })} />
                      <EffectSlider label="Vertical offset" value={active.y ?? 1} min={-25} max={25} defaultValue={1} unit="%" onChange={(y) => update({ y })} />
                      <InkPicker value={colors.offset ?? BLAZE_ORANGE} onChange={(color) => setColors((current) => ({ ...current, offset: color }))} />
                    </>}
                    {(["dither", "pixelate", "ascii"].includes(imageEffect)) && <>
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
                    </div>
                    </>}
                    <div className={styles.studioActions}>
                      <button type="button" onClick={randomize} className={styles.editorButton}>Randomize</button>
                      <button type="button" onClick={reset} className={styles.editorButton}>Reset effect</button>
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

                </aside>
              </div>
              {addTooltipPosition && showControls && <span id={addLayerTooltipId} role="tooltip" className={styles.layerAddTooltip} style={addTooltipPosition}>
                {layers.length >= PHOTO_LAYER_LIMIT ? "6 layer limit" : effectPicker === "add" ? "Choose an effect" : <>Add layer <kbd>⇧ N</kbd></>}
              </span>}
            </dialog>
          </div>
          <p className={styles.attribution} role="status" aria-live="polite">
            {isSaving ? "Saving…" : shared.message ? shared.message
              : shared.savedEdit?.location ? `Last edit from ${shared.savedEdit.location.replace(/, /g, " ")}`
              : null}
            {shared.saveFailed && <button type="button" className={styles.retrySave} onClick={() => { void shared.saveChanges(); }}>Retry</button>}
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
