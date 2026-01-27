"use client";

import Link from "next/link";
import { useRef, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { InlineSvg } from "@/components/inline-svg";
import { DotPattern } from "@/components/ui/dot-pattern";

type SvgAccentConfig = {
  /**
   * The exported color in the SVG we want to "hook" (e.g. the green stroke).
   * Case-insensitive match on the hex string.
   */
  matchStrokeHex?: string | string[];
  matchFillHex?: string | string[];
  matchStopColorHex?: string | string[];
  /**
   * Default (non-hover) color and hover color for the hooked parts.
   * Defaults to white-ish for base if not provided.
   */
  baseColorHex?: string; // default: #E9E9E2
  hoverColorHex: string;
  transitionMs?: number; // default: 520
};

type WorkCardProps = {
  slug: string;
  title: string;
  date: string;
  tall?: boolean;
  imageSrc?: string;
  hoverImageSrc?: string;
  mobileImageSrc?: string;
  mobileHoverImageSrc?: string;
  svgAccent?: SvgAccentConfig;
  svgPadding?: string;
  vignette?: boolean;
  dotGrid?: boolean;
};

export function WorkCard({
  slug,
  title,
  date,
  tall = false,
  imageSrc,
  hoverImageSrc,
  mobileImageSrc,
  mobileHoverImageSrc,
  svgAccent,
  svgPadding,
  vignette,
  dotGrid,
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

  // Memoize transform to prevent SVG reload on hover state changes
  const svgTransform = useMemo(() => {
    if (!svgAccent) return undefined;

    return (raw: string) => {
      let out = raw;

      const asArray = (v?: string | string[]) =>
        v ? (Array.isArray(v) ? v : [v]) : [];

      const replaceHexAttr = (
        input: string,
        attr: "stroke" | "fill" | "stop-color",
        hexes: string[],
        dataAttr: string,
        baseHex: string
      ) => {
        return hexes.reduce((acc, hexRaw) => {
          const hex = hexRaw.replace("#", "");
          const re = new RegExp(`${attr}="#?${hex}"`, "gi");
          return acc.replace(re, () => `${attr}="${baseHex}" ${dataAttr}`);
        }, input);
      };

      const baseHex = svgAccent.baseColorHex ?? "#E9E9E2";

      out = replaceHexAttr(
        out,
        "stroke",
        asArray(svgAccent.matchStrokeHex),
        `data-accent-stroke="true"`,
        baseHex
      );

      out = replaceHexAttr(
        out,
        "fill",
        asArray(svgAccent.matchFillHex),
        `data-accent-fill="true"`,
        baseHex
      );

      out = replaceHexAttr(
        out,
        "stop-color",
        asArray(svgAccent.matchStopColorHex),
        `data-accent-stop="true"`,
        baseHex
      );

      return out;
    };
  }, [svgAccent]);

  return (
    <Link
      ref={cardRef}
      href={`/work/${slug}`}
      className={[
        "work-card group relative block w-full overflow-hidden rounded-[8px]",
        "bg-[#121212]",
        isHovered ? "is-hovered" : "",
      ].join(" ")}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      style={undefined}
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

      {/* Card content - responsive heights (1:1 on mobile single-column, varied on desktop) */}
      <div
        className={`relative p-2 ${
          tall
            ? "aspect-[1/1]"
            : "aspect-[1/1] min-[900px]:aspect-[684/401]"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Card-within-card (project art) */}
          <div className="relative flex-1 overflow-hidden rounded-[6px] bg-[#0B0A09]">
            {/* Dot grid background */}
            {dotGrid ? (
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <DotPattern
                  width={12}
                  height={12}
                  cx={1}
                  cy={1}
                  cr={1}
                  className="text-white/[0.06] [mask-image:radial-gradient(ellipse_at_center,black_55%,transparent_100%)]"
                />
              </div>
            ) : null}
            {imageSrc && imageSrc.endsWith(".svg") && svgAccent ? (
              <InlineSvg
                src={imageSrc}
                className={[
                  `h-full w-full opacity-[0.92] ${svgPadding ?? "p-8 sm:p-10 md:p-12"}`,
                  // Ensure the inlined <svg> fills the box and stays centered.
                  "[&>svg]:block [&>svg]:h-full [&>svg]:w-full",
                ].join(" ")}
                transform={svgTransform}
              />
            ) : imageSrc ? (
              <div className="absolute inset-0">
                {/* Mobile-specific art (if provided) - visible when grid is single column (< 900px) */}
                {mobileImageSrc ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mobileImageSrc}
                      alt={title}
                      className={[
                        "absolute inset-0 h-full w-full object-contain opacity-[0.92] min-[900px]:hidden",
                        mobileImageSrc.endsWith(".svg")
                          ? (svgPadding ?? "p-8 sm:p-10 md:p-12")
                          : "p-6 sm:p-8",
                      ].join(" ")}
                      loading="lazy"
                      draggable={false}
                    />
                    {/* Mobile hover art */}
                    {(mobileHoverImageSrc || hoverImageSrc) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mobileHoverImageSrc || hoverImageSrc}
                        alt=""
                        aria-hidden="true"
                        className={[
                          "absolute inset-0 h-full w-full object-contain min-[900px]:hidden",
                          "transition-opacity duration-500 ease-out",
                          isHovered ? "opacity-100" : "opacity-0",
                          (mobileHoverImageSrc || hoverImageSrc || "").endsWith(".svg")
                            ? (svgPadding ?? "p-8 sm:p-10 md:p-12")
                            : "p-6 sm:p-8",
                        ].join(" ")}
                        draggable={false}
                      />
                    ) : null}
                  </>
                ) : null}

                {/* Desktop art - hidden when grid is single column if mobile version exists */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc}
                  alt={title}
                  className={[
                    "absolute inset-0 h-full w-full object-contain opacity-[0.92]",
                    mobileImageSrc ? "hidden min-[900px]:block" : "",
                    imageSrc.endsWith(".svg")
                      ? (svgPadding ?? "p-8 sm:p-10 md:p-12")
                      : "p-6 sm:p-8",
                  ].join(" ")}
                  loading="lazy"
                  draggable={false}
                />

                {/* Desktop hover art - hidden when grid is single column if mobile version exists */}
                {hoverImageSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={hoverImageSrc}
                    alt=""
                    aria-hidden="true"
                    className={[
                      "absolute inset-0 h-full w-full object-contain",
                      "transition-opacity duration-500 ease-out",
                      isHovered ? "opacity-100" : "opacity-0",
                      mobileImageSrc ? "hidden min-[900px]:block" : "",
                      hoverImageSrc.endsWith(".svg")
                        ? (svgPadding ?? "p-8 sm:p-10 md:p-12")
                        : "p-6 sm:p-8",
                    ].join(" ")}
                    draggable={false}
                  />
                ) : null}

                {/* Vignette overlay - fades edges to background, tighter on mobile */}
                {vignette ? (
                  <div
                    className="work-card-vignette pointer-events-none absolute inset-0 z-10"
                    style={{
                      background:
                        "radial-gradient(ellipse 50% 45% at center, transparent 30%, #0B0A09 85%)",
                    }}
                  />
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Footer (always visible) */}
          <div className="flex items-baseline justify-between gap-6 px-6 pb-3 pt-5">
            <h3
              className={[
                "text-[14px] sm:text-[16px] font-medium transition-colors duration-200",
                isHovered ? "text-foreground" : "text-[#A3A3A3]",
              ].join(" ")}
            >
              {title}
            </h3>
            <span
              className={[
                "font-mono text-[14px] sm:text-[16px] transition-colors duration-200",
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
