type RatPosition = { x: number; y: number };
const TARGETS = "main .work-card, main .play-card, main h1, main h2, main p, header nav a";
const PROPERTIES = ["--rat-impact-x", "--rat-impact-y", "--rat-impact-angle", "--rat-impact-scale"];

/** Scoped DOM effects: never replace a component's transform or event handlers. */
export function createRatImpact(onHit: (pan: number) => void) {
  let surfaces: { element: HTMLElement; rect: DOMRect }[] = [];
  const affected = new Set<HTMLElement>();
  let lastSample = -Infinity;
  let lastScan = -Infinity;
  let lastSound = -Infinity;
  let dirty = true;
  const invalidate = () => { dirty = true; };
  window.addEventListener("scroll", invalidate, { passive: true, capture: true });
  window.addEventListener("resize", invalidate, { passive: true });

  const restore = (element: HTMLElement) => {
    element.classList.remove("rat-trampled");
    PROPERTIES.forEach((property) => element.style.removeProperty(property));
  };

  return {
    update(time: number, rats: RatPosition[], reduced: boolean) {
      if (time - lastSample < 80) return;
      lastSample = time;
      if (dirty || time - lastScan > 600) {
        surfaces = Array.from(document.querySelectorAll<HTMLElement>(TARGETS))
          // Card contents react with their card, rather than being transformed twice.
          .filter((element) => !element.parentElement?.closest(".work-card, .play-card"))
          .map((element) => ({ element, rect: element.getBoundingClientRect() }))
          .filter(({ rect }) => rect.bottom > 0 && rect.top < window.innerHeight && rect.width > 0);
        dirty = false;
        lastScan = time;
      }
      const hit = new Set<HTMLElement>();
      for (const { element, rect } of surfaces) {
        if (!element.isConnected) continue;
        const residents = rats.filter(({ x, y }) => x + 60 >= rect.left && x + 16 <= rect.right && y + 54 >= rect.top && y + 14 <= rect.bottom);
        if (!residents.length) continue;
        hit.add(element);
        const pressure = Math.min(1, 0.35 + residents.length * 0.09);
        const center = residents.reduce((sum, rat) => sum + rat.x + 38, 0) / residents.length;
        const side = center < rect.left + rect.width / 2 ? -1 : 1;
        const stomp = Math.sin(time * 0.035);
        element.style.setProperty("--rat-impact-x", `${reduced ? 0 : side * pressure * 8}px`);
        element.style.setProperty("--rat-impact-y", `${reduced ? 0 : stomp * pressure * 6}px`);
        element.style.setProperty("--rat-impact-angle", `${reduced ? 0 : (side * 3.5 + stomp * 1.5) * pressure}deg`);
        element.style.setProperty("--rat-impact-scale", `${reduced ? 1 : 1 + pressure * 0.025}`);
        element.classList.add("rat-trampled");
        if (!affected.has(element) && time - lastSound > 900) {
          onHit(Math.max(-0.7, Math.min(0.7, center / window.innerWidth * 1.4 - 0.7)));
          lastSound = time;
        }
        affected.add(element);
      }
      for (const element of affected) {
        if (!hit.has(element)) { restore(element); affected.delete(element); }
      }
    },
    dispose() {
      window.removeEventListener("scroll", invalidate, true);
      window.removeEventListener("resize", invalidate);
      affected.forEach(restore);
      affected.clear();
    },
  };
}
