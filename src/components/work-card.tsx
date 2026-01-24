"use client";

import Link from "next/link";
import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { InlineSvg } from "@/components/inline-svg";

type SvgAccentConfig = {
  /**
   * The exported color in the SVG we want to "hook" (e.g. the green stroke).
   * Case-insensitive match on the hex string.
   */
  matchStrokeHex?: string;
  matchFillHex?: string;
  /**
   * Default (non-hover) color and hover color for the hooked parts.
   * Defaults to white-ish for base if not provided.
   */
  baseColorHex?: string; // default: #E9E9E2
  hoverColorHex: string;
  transitionMs?: number; // default: 320
};

type WorkCardProps = {
  slug: string;
  title: string;
  date: string;
  tall?: boolean;
  imageSrc?: string;
  hoverImageSrc?: string;
  svgAccent?: SvgAccentConfig;
};

type WorkCardAnimatedProps = WorkCardProps & {
  index?: number;
};

export function WorkCard({
  slug,
  title,
  date,
  tall = false,
  imageSrc,
  hoverImageSrc,
  svgAccent,
}: WorkCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    []
  );

  return (
    <Link
      ref={cardRef}
      href={`/work/${slug}`}
      className={[
        "work-card group relative block w-full overflow-hidden rounded-[8px]",
        "bg-[#121212]",
      ].join(" ")}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      style={
        svgAccent
          ? ({
              // Used by inline SVG transform for accent fills/strokes.
              ["--workcard-accent" as any]: isHovered
                ? svgAccent.hoverColorHex
                : (svgAccent.baseColorHex ?? "#E9E9E2"),
            } as React.CSSProperties)
          : undefined
      }
    >
      {/* Border glow effect that follows cursor */}
      <div
        className="pointer-events-none absolute -inset-px rounded-[8px] opacity-0 transition-opacity duration-300 group-hover:opacity-60"
        style={{
          background: isHovered
            ? `radial-gradient(520px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.045), transparent 42%)`
            : undefined,
        }}
      />

      {/* Card content - responsive heights */}
      <div
        className={`relative p-2 ${
          tall
            ? "h-[260px] md:h-auto md:aspect-[1/1]"
            : "h-[260px] sm:h-[260px] md:h-auto md:aspect-[684/401]"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Card-within-card (project art) */}
          <div className="relative flex-1 overflow-hidden rounded-[6px] bg-[#0B0A09]">
            {imageSrc && imageSrc.endsWith(".svg") && svgAccent ? (
              <InlineSvg
                src={imageSrc}
                className={["h-full w-full", "p-12 opacity-[0.92]"].join(" ")}
                transform={(raw) => {
                  const transitionMs = svgAccent.transitionMs ?? 320;
                  const css = [
                    `[data-accent-stroke="true"]{transition:stroke ${transitionMs}ms ease;}`,
                    `[data-accent-fill="true"]{transition:fill ${transitionMs}ms ease;}`,
                  ].join("");

                  // Inject style once, right after the opening <svg ...> tag.
                  const withStyle = raw.replace(
                    /<svg\b([^>]*)>/i,
                    `<svg$1><style>${css}</style>`
                  );

                  let out = withStyle;

                  // Replace matching stroke colors with CSS var + marker attribute.
                  if (svgAccent.matchStrokeHex) {
                    const hex = svgAccent.matchStrokeHex.replace("#", "");
                    const strokeRe = new RegExp(`stroke="#?${hex}"`, "gi");
                    out = out.replace(
                      strokeRe,
                      `stroke="var(--workcard-accent)" data-accent-stroke="true"`
                    );
                  }

                  // Replace matching fill colors with CSS var + marker attribute.
                  if (svgAccent.matchFillHex) {
                    const hex = svgAccent.matchFillHex.replace("#", "");
                    const fillRe = new RegExp(`fill="#?${hex}"`, "gi");
                    out = out.replace(
                      fillRe,
                      `fill="var(--workcard-accent)" data-accent-fill="true"`
                    );
                  }

                  return out;
                }}
              />
            ) : imageSrc ? (
              <div className="absolute inset-0">
                {/* Base art */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc}
                  alt={title}
                  className={[
                    "absolute inset-0 h-full w-full object-contain",
                    "transition-opacity duration-300 ease-out",
                    imageSrc.endsWith(".svg") ? "p-12 opacity-[0.92]" : "p-8",
                  ].join(" ")}
                  loading="lazy"
                  draggable={false}
                />

                {/* Hover art (crossfade) */}
                {hoverImageSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={hoverImageSrc}
                    alt=""
                    aria-hidden="true"
                    className={[
                      "absolute inset-0 h-full w-full object-contain",
                      "transition-opacity duration-300 ease-out",
                      isHovered ? "opacity-[0.92]" : "opacity-0",
                      hoverImageSrc.endsWith(".svg") ? "p-12" : "p-8",
                    ].join(" ")}
                    draggable={false}
                  />
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Footer (always visible) */}
          <div className="flex items-baseline justify-between gap-6 px-6 pb-3 pt-5">
            <h3
              className={[
                "text-[16px] font-medium transition-colors duration-200",
                isHovered ? "text-foreground" : "text-[#A3A3A3]",
              ].join(" ")}
            >
              {title}
            </h3>
            <span
              className={[
                "font-mono text-[16px] transition-colors duration-200",
                isHovered ? "text-[#7D7D7D]" : "text-[#464646]",
              ].join(" ")}
            >
              {date}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function WorkCardAnimated({
  index = 0,
  ...props
}: WorkCardAnimatedProps) {
  return (
    <motion.div
      // Keep cards visible immediately (show surfaces), but add a subtle "settle" motion.
      initial={{ opacity: 1, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: 0.06 + index * 0.04,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      <WorkCard {...props} />
    </motion.div>
  );
}
