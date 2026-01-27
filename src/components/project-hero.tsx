"use client";

import { motion, useReducedMotion, useScroll, useTransform, MotionValue } from "framer-motion";
import { useRef } from "react";
import { WorkProjectAsset, ParallaxLayer } from "@/content/types";
import { DotPattern } from "@/components/ui/dot-pattern";
import { BlurFade } from "@/components/ui/blur-fade";
import type { WorkProjectMeta } from "@/content/types";

type ProjectHeroProps = {
  title: string;
  heroAsset?: WorkProjectAsset;
  summary: string;
  meta?: WorkProjectMeta;
};

// Parallax layer component to use hooks properly
function ParallaxLayerImage({
  layer,
  scrollYProgress,
  shouldReduceMotion,
  index,
}: {
  layer: ParallaxLayer;
  scrollYProgress: MotionValue<number>;
  shouldReduceMotion: boolean | null;
  index: number;
}) {
  const depth = layer.depth ?? 1;
  const offsetX = layer.offsetX ?? 0;
  const offsetY = layer.offsetY ?? 0;
  
  // Parallax Y movement
  const layerParallaxY = useTransform(
    scrollYProgress,
    [0, 1],
    [offsetY - 60 * depth, offsetY + 60 * depth]
  );
  
  // Parallax X movement - spreads cards apart on scroll
  // Cards with positive offsetX spread more right, negative spread more left
  const spreadFactor = 25 * depth;
  const layerParallaxX = useTransform(
    scrollYProgress,
    [0, 1],
    [offsetX - spreadFactor * Math.sign(offsetX), offsetX + spreadFactor * Math.sign(offsetX)]
  );

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <motion.img
      src={layer.src}
      alt=""
      className="absolute inset-0 h-full w-full origin-center object-contain select-none pointer-events-none scale-[0.32] md:scale-[0.45]"
      draggable={false}
      loading={index === 0 ? "eager" : "lazy"}
      fetchPriority={index === 0 ? "high" : "auto"}
      style={{
        x: shouldReduceMotion ? offsetX : layerParallaxX,
        y: shouldReduceMotion ? offsetY : layerParallaxY,
      }}
    />
  );
}

export function ProjectHero({
  title,
  heroAsset,
  summary,
  meta,
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
  const hasHeroVignette = heroAsset?.effect === "vignette";

  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.35,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className="space-y-0"
    >
      {/* Title */}
      <div className="relative z-10 mx-auto mt-12 max-w-[768px] -mb-16">
        <h1 className="text-center text-[36px] font-medium leading-tight text-foreground md:text-[48px]">
          {title}
        </h1>
      </div>

      {heroAsset ? (
        <div
          ref={heroAssetRef}
          className={`relative z-0 mx-auto w-full max-w-[900px] -mb-14 overflow-visible md:-mb-20 ${
            hasHeroVignette
              ? "[mask-image:radial-gradient(ellipse_52%_46%_at_center,black_22%,transparent_68%)] [-webkit-mask-image:radial-gradient(ellipse_52%_46%_at_center,black_22%,transparent_68%)]"
              : ""
          }`}
          style={{ aspectRatio: heroAspectRatio }}
        >
          {heroAsset.type === "parallax" && heroAsset.layers ? (
            // Parallax layered hero
            <div className="relative h-full w-full">
              {/* Dot grid background with vignette - hidden on mobile, expanded beyond card area on desktop */}
              <div className="pointer-events-none absolute -inset-y-[250px] inset-x-0 hidden overflow-hidden md:block">
                <DotPattern
                  width={18}
                  height={18}
                  cx={1}
                  cy={1}
                  cr={1.2}
                  className="text-white/[0.12] [mask-image:radial-gradient(ellipse_55%_50%_at_center,black_40%,transparent_85%)]"
                />
              </div>
              {heroAsset.layers.map((layer, idx) => {
                const totalLayers = heroAsset.layers!.length;
                const reverseDelay = (totalLayers - 1 - idx) * 0.1;
                return (
                  <BlurFade
                    key={layer.src}
                    delay={reverseDelay}
                    duration={0.4}
                    className="absolute inset-0"
                  >
                    <ParallaxLayerImage
                      layer={layer}
                      scrollYProgress={scrollYProgress}
                      shouldReduceMotion={shouldReduceMotion}
                      index={idx}
                    />
                  </BlurFade>
                );
              })}
            </div>
          ) : (
            // Standard single image hero
            // eslint-disable-next-line @next/next/no-img-element
            <motion.img
              src={heroAsset.src}
              alt={heroAsset.alt ?? ""}
              className={`h-full w-full origin-center object-contain select-none pointer-events-none ${
                hasHeroVignette ? "scale-[1.15]" : "scale-[0.8] md:scale-[0.95]"
              }`}
              draggable={false}
              loading="eager"
              fetchPriority="high"
              style={{ y: shouldReduceMotion ? 0 : heroParallaxY }}
            />
          )}
        </div>
      ) : null}

      {/* Summary + metadata */}
      <div className="relative z-10 mx-auto mt-0 w-full max-w-[768px]">
        <div className="grid gap-8 md:gap-10 md:grid-cols-[minmax(0,1fr)_270px] md:items-start">
          <div className="space-y-6">
            <h2 className="text-[20px] font-medium text-foreground">Summary</h2>
            <div className="space-y-5 text-[16px] leading-relaxed text-muted-foreground">
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
                <div className="grid grid-cols-[80px_1fr] gap-2">
                  <dt className="text-muted-foreground/60">Company</dt>
                  <dd className="text-foreground">{meta.company}</dd>
                </div>
              ) : null}
              {meta.role ? (
                <div className="grid grid-cols-[80px_1fr] gap-2">
                  <dt className="text-muted-foreground/60">Role</dt>
                  <dd className="text-foreground">{meta.role}</dd>
                </div>
              ) : null}
              {meta.team && meta.team.length > 0 ? (
                <div className="grid grid-cols-[80px_1fr] gap-2">
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
