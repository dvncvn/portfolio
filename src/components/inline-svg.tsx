"use client";

import { useEffect, useMemo, useState } from "react";

type InlineSvgProps = {
  /** Public-path URL, e.g. `/assets/work/foo/art.svg` */
  src: string;
  className?: string;
  /**
   * Optional transform to adjust SVG markup before inlining.
   * Use for small controlled tweaks (e.g. CSS-var hooks).
   */
  transform?: (svgText: string) => string;
};

export function InlineSvg({ src, className, transform }: InlineSvgProps) {
  const [svg, setSvg] = useState<string | null>(null);
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

  if (!svg) return null;

  return (
    <div
      className={className}
      // We only inline our own repo assets (from /public).
      // This enables styling parts of the SVG for hover accents.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

