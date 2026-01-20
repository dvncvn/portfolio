"use client";

import { PlayItem } from "@/content/types";
import { BlurFade } from "@/components/ui/blur-fade";

type PlayGridProps = {
  items: PlayItem[];
};

export function PlayGrid({ items }: PlayGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, idx) => (
        <BlurFade key={item.href} delay={0.12 + idx * 0.05} inView>
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-[8px] bg-[#121212] p-4 transition-colors hover:bg-white/[0.02]"
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
                <div className="text-[14px] font-medium text-foreground">
                  {item.title}
                </div>
                <div className="text-[13px] text-muted-foreground">
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
