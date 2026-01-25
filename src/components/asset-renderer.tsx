"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BentoLayoutItem, WorkProjectAsset, WorkProjectSection } from "@/content/types";
import { CompareView } from "@/components/compare-view";
import { BlurFade } from "@/components/ui/blur-fade";
import { GithubStarsChart } from "@/components/github-stars-chart";
import { DotPattern } from "@/components/ui/dot-pattern";
import { Marquee } from "@/components/ui/marquee";

type AssetRendererProps = {
  section: WorkProjectSection;
};

type LightboxState = {
  src: string;
  alt: string;
};

const COL_SPAN_CLASSES: Record<number, string> = {
  1: "md:col-span-1",
  2: "md:col-span-2",
  3: "md:col-span-3",
  4: "md:col-span-4",
  5: "md:col-span-5",
  6: "md:col-span-6",
};

const ROW_SPAN_CLASSES: Record<number, string> = {
  1: "md:row-span-1",
  2: "md:row-span-2",
  3: "md:row-span-3",
};

function useLightbox() {
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  useEffect(() => {
    if (!lightbox) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightbox(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightbox]);

  return {
    lightbox,
    openLightbox: (asset: WorkProjectAsset) =>
      setLightbox({ src: asset.fullSrc ?? asset.src, alt: asset.alt ?? "" }),
    closeLightbox: () => setLightbox(null),
  };
}

function Lightbox({
  lightbox,
  onClose,
}: {
  lightbox: LightboxState;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
      onClick={onClose}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={lightbox.src}
        alt={lightbox.alt}
        className="max-h-[90vh] w-auto max-w-[90vw]"
        onClick={(event) => event.stopPropagation()}
        draggable={false}
      />
    </div>
  );
}

function getAssetLightboxSrc(asset: WorkProjectAsset) {
  return asset.fullSrc ?? asset.src;
}

function useGalleryLightbox(assets: WorkProjectAsset[]) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveIndex(null);
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((prev) => {
          if (prev === null) return prev;
          return (prev + 1) % assets.length;
        });
      }
      if (event.key === "ArrowLeft") {
        setActiveIndex((prev) => {
          if (prev === null) return prev;
          return (prev - 1 + assets.length) % assets.length;
        });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, assets.length]);

  return {
    activeIndex,
    openAt: (index: number) => setActiveIndex(index),
    close: () => setActiveIndex(null),
    next: () =>
      setActiveIndex((prev) => {
        if (prev === null) return prev;
        return (prev + 1) % assets.length;
      }),
    prev: () =>
      setActiveIndex((prev) => {
        if (prev === null) return prev;
        return (prev - 1 + assets.length) % assets.length;
      }),
  };
}

function GalleryLightbox({
  assets,
  activeIndex,
  onClose,
  onNext,
  onPrev,
}: {
  assets: WorkProjectAsset[];
  activeIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const asset = assets[activeIndex];
  const src = getAssetLightboxSrc(asset);
  const alt = asset.alt ?? "";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(8px)",
        overflow: "hidden",
      }}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        aria-label="Close image"
        style={{
          position: "absolute",
          top: "32px",
          right: "32px",
          zIndex: 10000,
          width: "32px",
          height: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "none",
          border: "none",
          padding: 0,
          color: "rgba(255,255,255,0.8)",
          cursor: "pointer",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 6L6 18" />
          <path d="M6 6l12 12" />
        </svg>
      </button>

      <button
        type="button"
        aria-label="Previous image"
        onClick={(event) => {
          event.stopPropagation();
          onPrev();
        }}
        style={{
          position: "absolute",
          left: 32,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 10000,
          background: "none",
          border: "none",
          padding: 0,
          color: "rgba(255,255,255,0.8)",
          cursor: "pointer",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      <button
        type="button"
        aria-label="Next image"
        onClick={(event) => {
          event.stopPropagation();
          onNext();
        }}
        style={{
          position: "absolute",
          right: 32,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 10000,
          background: "none",
          border: "none",
          padding: 0,
          color: "rgba(255,255,255,0.8)",
          cursor: "pointer",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(event) => event.stopPropagation()}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          maxHeight: "90vh",
          maxWidth: "90vw",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          style={{
            maxHeight: "90vh",
            maxWidth: "90vw",
            width: "auto",
            height: "auto",
          }}
          draggable={false}
        />
      </motion.div>
    </motion.div>,
    document.body
  );
}

function ImageAsset({
  asset,
}: {
  asset: WorkProjectAsset;
}) {
  const w = asset.width ?? 1600;
  const h = asset.height ?? 900;
  return (
    <div
      className="overflow-hidden rounded-[8px] border border-white/10 bg-[#121212]"
      style={{ aspectRatio: asset.aspectRatio ?? `${w}/${h}` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset.src}
        alt={asset.alt ?? ""}
        className="h-full w-full object-cover"
        loading="lazy"
        draggable={false}
      />
    </div>
  );
}

function CarouselAsset({
  asset,
  onClick,
}: {
  asset: WorkProjectAsset;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-[16/9] w-[768px] max-w-[90vw] flex-shrink-0 snap-start overflow-hidden rounded-[8px] bg-[#121212] p-6"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset.src}
        alt={asset.alt ?? ""}
        className="h-full w-full object-contain"
        loading="lazy"
        draggable={false}
      />
    </button>
  );
}

function CarouselView({ assets }: { assets: WorkProjectAsset[] }) {
  const { lightbox, openLightbox, closeLightbox } = useLightbox();
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const handleWheel = (event: WheelEvent) => {
      // Check if we can scroll in that direction
      const atStart = el.scrollLeft <= 0;
      const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1;
      
      // Use vertical delta for horizontal scroll, fallback to horizontal delta
      const delta = event.deltaY !== 0 ? event.deltaY : event.deltaX;
      
      // Allow page scroll if at boundary and scrolling in that direction
      if ((delta < 0 && atStart) || (delta > 0 && atEnd)) return;
      
      event.preventDefault();
      el.scrollLeft += delta;
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <>
      <div
        ref={scrollerRef}
        className="carousel-scroller w-full snap-x snap-mandatory overflow-x-auto pb-4"
        style={{
          paddingLeft: "max(24px, calc(50% - 384px))",
          paddingRight: "max(24px, calc(50% - 384px))",
          scrollPaddingLeft: "max(24px, calc(50% - 384px))",
          overflowY: "hidden",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <div className="flex gap-4">
          {assets.map((asset, idx) => (
            <CarouselAsset
              key={`${asset.src}-${idx}`}
              asset={asset}
              onClick={() => openLightbox(asset)}
            />
          ))}
        </div>
      </div>

      {lightbox ? <Lightbox lightbox={lightbox} onClose={closeLightbox} /> : null}
    </>
  );
}

function getBentoLayout(
  assetsCount: number,
  layoutOverrides?: BentoLayoutItem[],
): BentoLayoutItem[] {
  if (layoutOverrides && layoutOverrides.length > 0) {
    return layoutOverrides;
  }

  if (assetsCount === 1) {
    return [{ colSpan: 6, rowSpan: 1 }];
  }

  if (assetsCount === 2) {
    return [
      { colSpan: 3, rowSpan: 1 },
      { colSpan: 3, rowSpan: 1 },
    ];
  }

  if (assetsCount === 3) {
    return [
      { colSpan: 4, rowSpan: 2 },
      { colSpan: 2, rowSpan: 1 },
      { colSpan: 2, rowSpan: 1 },
    ];
  }

  return Array.from({ length: assetsCount }, () => ({
    colSpan: 3,
    rowSpan: 1,
  }));
}

function BentoView({
  assets,
  layout,
}: {
  assets: WorkProjectAsset[];
  layout?: BentoLayoutItem[];
}) {
  const { activeIndex, openAt, close, next, prev } = useGalleryLightbox(assets);
  const layoutItems = getBentoLayout(assets.length, layout);
  const cardBaseClass =
    "bento-card group relative w-full cursor-pointer overflow-hidden rounded-[8px] bg-[#121212] p-4 transition-opacity duration-300 ease-out aspect-[4/3] md:aspect-auto select-none";
  const renderCard = (
    asset: WorkProjectAsset,
    idx: number,
    className = "",
    contentClassName = "",
    backgroundSrc?: string,
    showDotGrid = false,
  ) => (
    <button
      key={`${asset.src}-${idx}`}
      type="button"
      onClick={() => openAt(idx)}
      className={`${cardBaseClass} ${className}`}
    >
      {backgroundSrc ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={backgroundSrc}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover grayscale"
            draggable={false}
          />
          <div className="absolute inset-0 bg-black/25" />
        </>
      ) : null}
      {showDotGrid ? (
        <div className="pointer-events-none absolute inset-2 overflow-hidden rounded-[6px] bg-[#0B0B0B]/60">
          <DotPattern
            width={12}
            height={12}
            cx={1}
            cy={1}
            cr={1}
            className="text-white/6"
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_55%,rgba(0,0,0,0.7)_100%)]" />
        </div>
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset.src}
        alt={asset.alt ?? ""}
        className={`relative z-10 h-full w-full object-contain ${contentClassName}`}
        loading="lazy"
        draggable={false}
      />
    </button>
  );
  const isCustomFiveUp = assets.length === 5 && (!layout || layout.length === 0);
  const bentoTwoBackground = "/assets/work/langflow-platform-redesign/bento-assets/thumbs/bento-2-bg.png";

  return (
    <>
      {isCustomFiveUp ? (
        <div className="bento-section space-y-8">
          <div className="grid gap-8 md:[grid-template-columns:0.349fr_0.651fr]">
            {renderCard(assets[0], 0, "md:h-[540px]", "scale-[0.82]")}
            {renderCard(
              assets[1],
              1,
              "md:h-[540px]",
              "absolute inset-x-8 bottom-0 top-8 h-auto w-[calc(100%-4rem)] object-contain",
              bentoTwoBackground,
            )}
          </div>
          <div className="grid gap-8 md:[grid-template-columns:0.309fr_0.302fr_0.389fr]">
            {renderCard(assets[2], 2, "p-2 md:h-[508px]", "scale-[0.84]", undefined, true)}
            {renderCard(assets[3], 3, "md:h-[508px]", "scale-[0.84]")}
            {renderCard(assets[4], 4, "p-2 md:h-[508px]", "scale-[0.82]", undefined, true)}
          </div>
        </div>
      ) : (
        <div className="bento-section grid gap-8 md:grid-cols-6 md:auto-rows-[minmax(160px,1fr)]">
          {assets.map((asset, idx) => {
            const layoutItem = layoutItems[idx] ?? {};
            const colSpan = layoutItem.colSpan ?? 3;
            const rowSpan = layoutItem.rowSpan ?? 1;
            const colSpanClass = COL_SPAN_CLASSES[colSpan] ?? "md:col-span-3";
            const rowSpanClass = ROW_SPAN_CLASSES[rowSpan] ?? "md:row-span-1";

            return renderCard(asset, idx, `${colSpanClass} ${rowSpanClass}`);
          })}
        </div>
      )}

      <AnimatePresence>
        {activeIndex !== null ? (
          <GalleryLightbox
            assets={assets}
            activeIndex={activeIndex}
            onClose={close}
            onNext={next}
            onPrev={prev}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}

export function AssetRenderer({ section }: AssetRendererProps) {
  if (section.layout === "compare") {
    const [left, right] = section.assets;
    if (!left || !right) return null;
    return (
      <CompareView
        beforeSrc={right.src}
        afterSrc={left.src}
        beforeAlt={right.alt ?? "Before"}
        afterAlt={left.alt ?? "After"}
        width={left.width}
        height={left.height}
        description={section.caption}
      />
    );
  }

  // Handle github-stars layout before checking assets
  if (section.layout === "github-stars") {
    return (
      <BlurFade delay={0.15} inView inViewMargin="-100px">
        <GithubStarsChart {...(section.githubStars ?? {})} />
      </BlurFade>
    );
  }

  // Handle marquee layout before checking assets
  if (section.layout === "marquee") {
    const items = section.marquee?.items ?? [];
    const splitIndex = Math.ceil(items.length / 2);
    const firstRow = items.slice(0, splitIndex);
    const secondRow = items.slice(splitIndex);

    const ReviewCard = ({
      name,
      title,
      body,
    }: {
      name: string;
      title?: string;
      body: string;
    }) => (
      <figure className="h-40 w-80 flex-shrink-0 overflow-hidden rounded-[12px] border border-white/10 bg-[#121212] p-5 transition-colors duration-200 ease-out hover:bg-white/5">
        <figcaption className="flex flex-col gap-0.5">
          <span className="text-[14px] font-medium text-foreground">{name}</span>
          {title ? (
            <span className="text-[12px] text-muted-foreground">{title}</span>
          ) : null}
        </figcaption>
        <blockquote className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">
          {body}
        </blockquote>
      </figure>
    );

    return (
      <BlurFade delay={0.15} inView inViewMargin="-100px">
        <div className="relative flex w-full flex-col gap-4 overflow-hidden">
          <Marquee reverse pauseOnHover speed={35}>
            {firstRow.map((review) => (
              <ReviewCard key={`${review.name}-${review.body}`} {...review} />
            ))}
          </Marquee>
          <Marquee pauseOnHover speed={35}>
            {secondRow.map((review) => (
              <ReviewCard key={`${review.name}-${review.body}`} {...review} />
            ))}
          </Marquee>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background md:w-1/2 md:from-40%" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background md:w-1/2 md:from-40%" />
        </div>
      </BlurFade>
    );
  }

  const assets = section.assets;
  if (assets.length === 0) return null;

  if (section.layout === "carousel") {
    return (
      <BlurFade delay={0.15} inView inViewMargin="-100px">
        <CarouselView assets={assets} />
      </BlurFade>
    );
  }

  if (section.layout === "bento") {
    return (
      <BlurFade delay={0.15} inView inViewMargin="-100px">
        <BentoView assets={assets} layout={section.bento?.items} />
      </BlurFade>
    );
  }

  if (section.layout === "single-caption") {
    const asset = assets[0];
    return (
      <BlurFade delay={0.15} inView inViewMargin="-100px">
        <div className="space-y-4">
          <div className="mx-auto w-full max-w-[768px] overflow-hidden rounded-[8px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {asset ? (
              <img
                src={asset.src}
                alt={asset.alt ?? ""}
                className="block h-auto w-full"
                loading="lazy"
                draggable={false}
              />
            ) : null}
          </div>
          {section.caption ? (
            <div className="text-center">
              <p className="text-[14px] leading-relaxed text-muted-foreground">{section.caption}</p>
            </div>
          ) : null}
        </div>
      </BlurFade>
    );
  }

  if (section.layout === "split") {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {assets.slice(0, 2).map((asset, idx) => (
          <ImageAsset key={`${asset.src}-${idx}`} asset={asset} />
        ))}
      </div>
    );
  }

  if (section.layout === "stacked") {
    return (
      <div className="space-y-6">
        {assets.map((asset, idx) => (
          <ImageAsset key={`${asset.src}-${idx}`} asset={asset} />
        ))}
      </div>
    );
  }

  // single
  return <ImageAsset asset={assets[0]} />;
}

