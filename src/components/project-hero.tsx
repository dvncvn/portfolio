"use client";

import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { WorkProjectAsset } from "@/content/types";
import type { WorkProjectMeta } from "@/content/types";

type ProjectHeroProps = {
  title: string;
  heroAsset?: WorkProjectAsset;
  summary: string;
  meta?: WorkProjectMeta;
  responsibilities?: string[];
};

export function ProjectHero({
  title,
  heroAsset,
  summary,
  meta,
  responsibilities,
}: ProjectHeroProps) {
  const heroAssetRef = useRef<HTMLDivElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: heroAssetRef,
    offset: ["start end", "end start"],
  });
  const heroParallaxY = useTransform(scrollYProgress, [0, 1], [-24, 24]);
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
      className="space-y-0"
    >
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex justify-center">
        <div className="flex items-center gap-2 text-[14px] text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            Work
          </Link>
          <span className="text-muted-foreground/60">/</span>
        </div>
      </nav>

      {/* Title */}
      <div className="relative z-10 mx-auto mt-12 max-w-[768px] -mb-16">
        <h1 className="text-center text-[36px] font-medium leading-tight text-foreground md:text-[48px]">
          {title}
        </h1>
      </div>

      {heroAsset ? (
        <div
          ref={heroAssetRef}
          className="relative z-0 mx-auto w-full max-w-[900px] -mb-14 overflow-visible md:-mb-20"
          style={{ aspectRatio: heroAspectRatio }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            src={heroAsset.src}
            alt={heroAsset.alt ?? ""}
            className="h-full w-full origin-center scale-[0.8] object-contain select-none pointer-events-none md:scale-[0.95]"
            draggable={false}
            style={{ y: shouldReduceMotion ? 0 : heroParallaxY }}
          />
        </div>
      ) : null}

      {/* Summary + metadata */}
      <div className="relative z-10 mx-auto mt-0 w-full max-w-[768px]">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_270px] md:items-start">
          <div className="space-y-6">
            <h2 className="text-[20px] font-medium text-foreground">Summary</h2>
            <div className="space-y-10 text-[16px] leading-relaxed text-muted-foreground">
              {summary
                .split(/\n\s*\n/g)
                .map((p) => p.trim())
                .filter(Boolean)
                .map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
            </div>
          </div>

          {meta ? (
            <dl className="grid gap-y-6 text-[16px]">
              {meta.company ? (
                <div className="grid grid-cols-[1fr_1fr] gap-6">
                  <dt className="text-muted-foreground/60">Company</dt>
                  <dd className="text-foreground">{meta.company}</dd>
                </div>
              ) : null}
              {meta.dates ? (
                <div className="grid grid-cols-[1fr_1fr] gap-6">
                  <dt className="text-muted-foreground/60">Dates</dt>
                  <dd className="text-foreground">{meta.dates}</dd>
                </div>
              ) : null}
              {meta.role ? (
                <div className="grid grid-cols-[1fr_1fr] gap-6">
                  <dt className="text-muted-foreground/60">Role</dt>
                  <dd className="text-foreground">{meta.role}</dd>
                </div>
              ) : null}
              {meta.team && meta.team.length > 0 ? (
                <div className="grid grid-cols-[1fr_1fr] gap-6">
                  <dt className="text-muted-foreground/60">Team</dt>
                  <dd className="space-y-1 text-foreground">
                    {meta.team.map((t) => (
                      <div key={t}>{t}</div>
                    ))}
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : null}
        </div>
      </div>
    </motion.header>
  );
}
