import { useEffect, useRef } from "react";

export function useStudioTransition() {
  const flight = useRef<HTMLElement | null>(null);
  const active = useRef<Animation | null>(null);
  const generation = useRef(0);
  const guideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    generation.current++;
    if (guideTimer.current) clearTimeout(guideTimer.current);
    active.current?.cancel();
    flight.current?.remove();
  }, []);

  return async (panel: HTMLDialogElement, source: HTMLElement, target: HTMLElement, opening: boolean, onGuideReveal?: () => void) => {
    const token = ++generation.current;
    if (guideTimer.current) clearTimeout(guideTimer.current);
    if (opening) delete panel.dataset.guidesReady;
    // An interrupted transition starts at the portrait's current position.
    const current = flight.current ?? source;
    const from = current.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    const origin = panel.getBoundingClientRect();
    const radius = getComputedStyle(current).borderRadius;
    const targetRadius = getComputedStyle(target).borderRadius;
    const clone = current.cloneNode(true) as HTMLElement;
    const canvases = current.querySelectorAll("canvas");
    clone.querySelectorAll("canvas").forEach((canvas, index) => {
      canvas.width = canvases[index].width;
      canvas.height = canvases[index].height;
      canvas.getContext("2d")?.drawImage(canvases[index], 0, 0);
    });
    if (clone.hasAttribute("data-photo-surface")) {
      Array.from(clone.children).slice(1).forEach((child) => child.remove());
    }
    active.current?.cancel();
    flight.current?.remove();
    clone.removeAttribute("id");
    clone.setAttribute("aria-hidden", "true");
    Object.assign(clone.style, {
      position: "absolute", left: `${to.left - origin.left}px`, top: `${to.top - origin.top}px`,
      width: `${to.width}px`, height: `${to.height}px`, maxWidth: "none", margin: "0",
      transformOrigin: "0 0", transform: "none", overflow: "hidden", pointerEvents: "none",
      opacity: "1", zIndex: "10", border: "0", boxShadow: "none",
    });
    panel.appendChild(clone);
    flight.current = clone;
    panel.dataset.moving = "true";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animation = clone.animate(reduced ? [{ opacity: 0 }, { opacity: 1 }] : [
      { transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`, borderRadius: radius },
      { transform: "none", borderRadius: targetRadius },
    ], { duration: reduced ? 100 : 360, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "both" });
    active.current = animation;
    if (opening) {
      // Overlap the reveal with the last 120ms of the portrait settling.
      guideTimer.current = setTimeout(() => {
        if (generation.current !== token) return;
        panel.dataset.guidesReady = "true";
        onGuideReveal?.();
      }, reduced ? 0 : 240);
    }
    requestAnimationFrame(() => {
      if (generation.current === token) panel.dataset.phase = opening ? "open" : "closing";
    });
    try { await animation.finished; } catch { return false; }
    if (generation.current !== token) return false;
    flight.current?.remove();
    flight.current = null;
    active.current = null;
    delete panel.dataset.moving;
    return true;
  };
}
