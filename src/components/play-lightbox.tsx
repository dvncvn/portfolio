"use client";

import { useEffect, useCallback, useState } from "react";
import { PlayItem } from "@/content/types";
import { X, ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";

type PlayLightboxProps = {
  item: PlayItem | null;
  onClose: () => void;
};

export function PlayLightbox({ item, onClose }: PlayLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const assets = item?.assets ?? [];
  const hasMultipleAssets = assets.length > 1;

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? assets.length - 1 : prev - 1));
  }, [assets.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === assets.length - 1 ? 0 : prev + 1));
  }, [assets.length]);

  // Reset index when item changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [item?.slug]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!item) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && hasMultipleAssets) {
        handlePrev();
      } else if (e.key === "ArrowRight" && hasMultipleAssets) {
        handleNext();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [item, onClose, handlePrev, handleNext, hasMultipleAssets]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (item) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [item]);

  if (!item) return null;

  const currentAsset = assets[currentIndex];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 flex max-h-[90vh] w-full max-w-[800px] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image section */}
        <div className="relative flex items-center justify-center bg-black/40">
          {/* Image counter */}
          {assets.length > 0 && (
            <div className="absolute left-4 top-4 z-10 rounded-full bg-black/60 px-3 py-1 text-xs text-white/70">
              {currentIndex + 1} / {assets.length}
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white/70 transition-colors hover:bg-black/80 hover:text-white"
            aria-label="Close lightbox"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Navigation arrows */}
          {hasMultipleAssets && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white/70 transition-colors hover:bg-black/80 hover:text-white"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white/70 transition-colors hover:bg-black/80 hover:text-white"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Image/Video display */}
          {currentAsset ? (
            currentAsset.type === "video" ? (
              <video
                src={currentAsset.src}
                className="max-h-[50vh] w-full object-contain"
                controls
                autoPlay
                muted
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentAsset.src}
                alt={currentAsset.alt ?? item.title}
                className="max-h-[50vh] w-full object-contain"
              />
            )
          ) : (
            // Fallback to thumbnail if no assets
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.thumbnail}
              alt={item.title}
              className="max-h-[50vh] w-full object-contain"
            />
          )}
        </div>

        {/* Content section */}
        <div className="grid grid-cols-[minmax(0,1fr)_180px] gap-8 p-6">
          {/* Left column: Title + Summary + CTA */}
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-medium text-foreground">{item.title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {item.summary ?? item.description}
            </p>
            {item.href && (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-white/90"
              >
                {item.ctaLabel ?? "View project"}
                <ArrowUpRight className="h-4 w-4" />
              </a>
            )}
          </div>

          {/* Right column: Metadata */}
          <dl className="grid gap-y-1 text-sm">
            {item.tool && (
              <div className="grid grid-cols-[1fr_1fr] gap-3">
                <dt className="text-muted-foreground">Tool</dt>
                <dd className="text-foreground">{item.tool}</dd>
              </div>
            )}
            {item.year && (
              <div className="grid grid-cols-[1fr_1fr] gap-3">
                <dt className="text-muted-foreground">Year</dt>
                <dd className="text-foreground">{item.year}</dd>
              </div>
            )}
            {item.tags && item.tags.length > 0 && (
              <div className="grid grid-cols-[1fr_1fr] gap-3">
                <dt className="text-muted-foreground">Type</dt>
                <dd className="text-foreground">{item.tags.join(", ")}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
