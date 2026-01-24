"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Chip } from "@/components/chip";
import { WorkProjectAsset } from "@/content/types";

type ProjectHeroProps = {
  title: string;
  role?: string;
  product?: string;
  timeframe?: string;
  heroAsset?: WorkProjectAsset;
  summary: string;
  responsibilities?: string[];
};

export function ProjectHero({
  title,
  role = "Staff Product Designer",
  product,
  timeframe,
  heroAsset,
  summary,
  responsibilities,
}: ProjectHeroProps) {
  const heroAspectRatio =
    heroAsset?.aspectRatio ??
    (heroAsset?.width && heroAsset?.height ? `${heroAsset.width}/${heroAsset.height}` : "1/1");

  return (
    <motion.header
      initial={{ opacity: 1, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className="space-y-6"
    >
      <Link
        href="/"
        className="inline-flex text-[14px] text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Back to Work
      </Link>

      <div className="space-y-3">
        <h1 className="text-[36px] font-medium leading-tight text-foreground md:text-[48px]">
          {title}
        </h1>

        <div className="flex flex-wrap gap-2">
          {role ? <Chip>{role}</Chip> : null}
          {product ? <Chip>{product}</Chip> : null}
          {timeframe ? <Chip>{timeframe}</Chip> : null}
        </div>
      </div>

      {heroAsset ? (
        <div
          className="mx-auto w-full max-w-[460px] overflow-hidden rounded-[24px] border border-white/10 bg-[#0f0f0f]"
          style={{ aspectRatio: heroAspectRatio }}
        >
          <div className="relative h-full w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroAsset.src}
              alt={heroAsset.alt ?? ""}
              className="h-full w-full object-contain p-14 opacity-[0.92]"
              draggable={false}
            />
          </div>
        </div>
      ) : null}

      <div className="space-y-6">
        <p className="text-[14px] leading-relaxed text-muted-foreground">
          {summary}
        </p>

        {responsibilities && responsibilities.length > 0 ? (
          <ul className="space-y-2 text-[14px] text-muted-foreground">
            {responsibilities.slice(0, 4).map((r) => (
              <li key={r} className="flex gap-3 text-left">
                <span className="mt-[7px] h-[3px] w-[3px] rounded-full bg-muted-foreground/60" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </motion.header>
  );
}
