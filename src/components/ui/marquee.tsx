"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type MarqueeProps = React.HTMLAttributes<HTMLDivElement> & {
  reverse?: boolean;
  pauseOnHover?: boolean;
  speed?: number; // pixels per second
};

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  speed = 30,
  children,
  ...props
}: MarqueeProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(60);

  useEffect(() => {
    if (contentRef.current) {
      const width = contentRef.current.scrollWidth;
      if (width > 0) {
        setDuration(width / speed);
      }
    }
  }, [children, speed]);

  return (
    <div
      className={cn(
        "marquee-container relative flex w-full overflow-hidden",
        pauseOnHover && "marquee-pause-on-hover",
        className
      )}
      {...props}
    >
      <div
        ref={contentRef}
        className={cn(
          "marquee-content flex shrink-0 items-center",
          reverse ? "marquee-reverse" : "marquee-forward"
        )}
        style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}
      >
        <div className="flex shrink-0 items-center gap-4 pr-4">{children}</div>
        <div className="flex shrink-0 items-center gap-4 pr-4" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
