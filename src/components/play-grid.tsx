"use client";

import { PlayItem } from "@/content/types";
import { BlurFade } from "@/components/ui/blur-fade";

type PlayGridProps = {
  items: PlayItem[];
};

export function PlayGrid({ items }: PlayGridProps) {
  return (
    <div className="grid gap-0 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item, idx) => (
        <BlurFade
          key={item.href}
          delay={0.12 + idx * 0.05}
          inView
          className="h-full"
        >
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="play-card group flex h-full flex-col rounded-[8px] bg-transparent p-4 transition-colors"
          >
            <div className="space-y-3">
              <div className="overflow-hidden rounded-[6px] border border-white/10 bg-black/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="h-40 w-full object-cover"
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
          </a>
        </BlurFade>
      ))}
    </div>
  );
}
