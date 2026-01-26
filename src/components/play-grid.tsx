"use client";

import { useState } from "react";
import { PlayItem } from "@/content/types";
import { BlurFade } from "@/components/ui/blur-fade";
import { PlayLightbox } from "@/components/play-lightbox";

type PlayGridProps = {
  items: PlayItem[];
};

export function PlayGrid({ items }: PlayGridProps) {
  const [selectedItem, setSelectedItem] = useState<PlayItem | null>(null);

  return (
    <>
      <div className="grid gap-0 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item, idx) => (
          <BlurFade
            key={item.slug}
            delay={0.12 + idx * 0.05}
            inView
            className="h-full"
          >
            <button
              onClick={() => setSelectedItem(item)}
              className="play-card group flex h-full w-full cursor-pointer flex-col rounded-[8px] bg-transparent p-4 text-left transition-colors"
            >
              <div className="space-y-3">
                <div className="aspect-[4/3] overflow-hidden rounded-[6px] border border-white/10 bg-black/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-1">
                  <div
                    className={[
                      "text-[14px] font-medium text-foreground leading-[20px]",
                      // Clamp to 1 line to keep grid rows uniform.
                      "[display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:1]",
                      "overflow-hidden",
                    ].join(" ")}
                  >
                    {item.title}
                  </div>
                  <div
                    className={[
                      "text-[13px] text-muted-foreground leading-[18px]",
                      // Reserve 2 lines of height even for short text.
                      "min-h-[36px]",
                      // Clamp to 2 lines to avoid row-height mismatches.
                      "[display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]",
                      "overflow-hidden",
                    ].join(" ")}
                  >
                    {item.description}
                  </div>
                </div>
              </div>
            </button>
          </BlurFade>
        ))}
      </div>

      <PlayLightbox item={selectedItem} onClose={() => setSelectedItem(null)} />
    </>
  );
}
