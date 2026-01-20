"use client";

import Link from "next/link";
import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { DotPattern } from "@/components/ui/dot-pattern";

type WorkCardProps = {
  slug: string;
  title: string;
  date: string;
  tall?: boolean;
  imageSrc?: string;
  backgroundVariant?: "dots";
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
  backgroundVariant,
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
      className="group relative block w-full overflow-hidden rounded-[8px] bg-[#141414] border border-transparent transition-colors duration-200 hover:border-white/[0.12]"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={
        {
          // Keep this as a fixed value so the interaction is predictable and calm.
          ["--footer-h" as any]: "56px",
        } as React.CSSProperties
      }
    >
      {/* Border glow effect that follows cursor */}
      <div
        className="pointer-events-none absolute -inset-px rounded-[8px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: isHovered
            ? `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.08), transparent 40%)`
            : undefined,
        }}
      />

      {/* Card content - responsive heights */}
      <div
        className={`relative ${
          tall
            ? "h-[260px] md:h-auto md:aspect-[1/1]"
            : "h-[260px] sm:h-[260px] md:h-[294px]"
        }`}
      >
        {/* Inset region (8px all around) */}
        <div className="absolute inset-2 overflow-hidden rounded-[6px] bg-[#0f0f0f]">
          {backgroundVariant === "dots" ? (
            <div className="absolute inset-0">
              <DotPattern
                glow
                className={[
                  // Keep it subtle; this is a background texture.
                  "text-white/[0.10]",
                  // Soft vignette so it doesn't fight the content.
                  "[mask-image:radial-gradient(320px_circle_at_center,white,transparent)]",
                ].join(" ")}
              />
            </div>
          ) : null}

          {imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt={title}
              className="h-full w-full object-cover transition-[filter,transform] duration-[420ms] ease-out group-hover:brightness-[0.98]"
              loading="lazy"
            />
          ) : null}

          {/* Bottom overlay that slides up over the image (image itself stays static) */}
          <div
            className={[
              "absolute inset-x-0 bottom-0",
              "transition-[transform,opacity] duration-[420ms] ease-out",
              isHovered ? "translate-y-0 opacity-100" : "translate-y-[calc(var(--footer-h)+8px)] opacity-0",
            ].join(" ")}
          >
            {/* Soft edge (prevents a hard border between overlay + image) */}
            <div className="pointer-events-none absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-[#141414] to-transparent" />

            {/* Panel */}
            <div
              className="flex items-end justify-between bg-[#141414] px-6 py-3"
              style={{ height: "var(--footer-h)" }}
            >
              <h3 className="text-[14px] font-medium text-foreground">{title}</h3>
              <span className="text-[14px] text-muted-foreground">{date}</span>
            </div>
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
