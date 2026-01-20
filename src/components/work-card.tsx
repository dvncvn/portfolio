"use client";

import Link from "next/link";
import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";

type WorkCardProps = {
  slug: string;
  title: string;
  date: string;
  tall?: boolean;
  imageSrc?: string;
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
      className="group relative block w-full overflow-hidden rounded-[8px] bg-[#141414] transition-all duration-200 border border-white/[0.10] hover:border-white/[0.14]"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Subtle surface sheen so empty cards still read as tiles */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent" />

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
        className={`relative flex flex-col ${
          tall ? "h-[260px] sm:h-[380px] md:h-[510px]" : "h-[260px] sm:h-[260px] md:h-[294px]"
        }`}
      >
        {/* Image area - centered in card for tall cards with images */}
        {tall && imageSrc && (
          <div className="flex flex-1 items-center justify-center p-6 pb-0">
            <div className="relative w-[85%] overflow-hidden rounded-[8px] border border-border/30 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt={title}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Title and date - bottom positioned, only visible on hover */}
        <div
          className={`absolute inset-x-0 bottom-0 flex items-end justify-between p-5 transition-opacity duration-300 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <h3 className="text-base font-medium text-foreground">{title}</h3>
          <span className="text-sm text-muted-foreground">{date}</span>
        </div>
      </div>

      {/* Gradient for text readability on hover */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
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
