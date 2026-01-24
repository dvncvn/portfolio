"use client";

import { useEffect, useRef, useState } from "react";
import { WorkProjectAsset, WorkProjectSection } from "@/content/types";
import { CompareView } from "@/components/compare-view";
import { BlurFade } from "@/components/ui/blur-fade";

type AssetRendererProps = {
  section: WorkProjectSection;
};

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
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxAlt, setLightboxAlt] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lightboxSrc) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightboxSrc(null);
        setLightboxAlt(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxSrc]);

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
              onClick={() => {
                setLightboxSrc(asset.src);
                setLightboxAlt(asset.alt ?? "");
              }}
            />
          ))}
        </div>
      </div>

      {lightboxSrc ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => {
            setLightboxSrc(null);
            setLightboxAlt(null);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxSrc}
            alt={lightboxAlt ?? ""}
            className="max-h-[90vh] w-auto max-w-[90vw]"
            onClick={(event) => event.stopPropagation()}
            draggable={false}
          />
        </div>
      ) : null}
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

  const assets = section.assets;
  if (assets.length === 0) return null;

  if (section.layout === "carousel") {
    return (
      <BlurFade delay={0.15} inView inViewMargin="-100px">
        <CarouselView assets={assets} />
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

