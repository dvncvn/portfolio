"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type InlineSvgProps = {
  /** Public-path URL, e.g. `/assets/work/foo/art.svg` */
  src: string;
  className?: string;
  /**
   * Optional transform to adjust SVG markup before inlining.
   * Use for small controlled tweaks (e.g. CSS-var hooks).
   */
  transform?: (svgText: string) => string;
  /**
   * Current accent color to apply to elements with data-accent-* attributes.
   * When this changes, elements are updated via JS for reliable transitions.
   */
  accentColor?: string;
  /** Transition duration in ms for accent color changes */
  accentTransitionMs?: number;
};

export function InlineSvg({
  src,
  className,
  transform,
  accentColor,
  accentTransitionMs = 500,
}: InlineSvgProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stableTransform = useMemo(() => transform, [transform]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const res = await fetch(src, { cache: "force-cache" });
        const text = await res.text();
        if (cancelled) return;
        setSvg(stableTransform ? stableTransform(text) : text);
      } catch {
        if (!cancelled) setSvg(null);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [src, stableTransform]);

  // Update accent colors via JS for reliable transitions (especially gradient stops)
  useEffect(() => {
    if (!containerRef.current || !accentColor || !svg) return;

    const transition = `${accentTransitionMs}ms ease-out`;

    // Update stroke elements
    const strokeEls = containerRef.current.querySelectorAll(
      '[data-accent-stroke="true"]'
    );
    strokeEls.forEach((el) => {
      const svgEl = el as SVGElement;
      svgEl.style.transition = `stroke ${transition}`;
      svgEl.style.stroke = accentColor;
    });

    // Update fill elements
    const fillEls = containerRef.current.querySelectorAll(
      '[data-accent-fill="true"]'
    );
    fillEls.forEach((el) => {
      const svgEl = el as SVGElement;
      svgEl.style.transition = `fill ${transition}`;
      svgEl.style.fill = accentColor;
    });

    // Update gradient stop elements
    const stopEls = containerRef.current.querySelectorAll(
      '[data-accent-stop="true"]'
    );
    stopEls.forEach((el) => {
      const stopEl = el as SVGStopElement;
      stopEl.style.transition = `stop-color ${transition}`;
      stopEl.style.stopColor = accentColor;
    });
  }, [svg, accentColor, accentTransitionMs]);

  if (!svg) return null;

  return (
    <div
      ref={containerRef}
      className={className}
      // We only inline our own repo assets (from /public).
      // This enables styling parts of the SVG for hover accents.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

