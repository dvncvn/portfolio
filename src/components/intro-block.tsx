"use client";

import Link from "next/link";
import { useState } from "react";

export function IntroBlock() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group relative space-y-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h1 className="text-[18px] font-medium leading-tight text-foreground">
        Hi, I&apos;m Simon.
      </h1>
      <p className="text-base leading-relaxed text-muted-foreground max-w-[768px]">
        I&apos;m a Staff Product Designer working on AI and developer platforms
        at IBM. I turn complex systems into products that are clear, usable, and
        durable. I&apos;m experienced across OSS, startups, and enterprise.
      </p>

      {/* Hover to info affordance */}
      <div
        className="h-6 overflow-hidden"
        aria-hidden={!isHovered}
      >
        <div
          className={`flex items-center gap-2 text-sm transition-all duration-300 ease-out ${
            isHovered
              ? "translate-y-0 opacity-100"
              : "translate-y-2 opacity-0 pointer-events-none"
          }`}
        >
          <Link
            href="/info"
            className="text-muted-foreground transition-colors hover:text-foreground"
            tabIndex={isHovered ? 0 : -1}
          >
            Learn more about me →
          </Link>
        </div>
      </div>
    </div>
  );
}
