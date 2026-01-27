"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";

export function IntroBlock({ animate = true }: { animate?: boolean }) {
  const [isHovered, setIsHovered] = useState(false);

  const content = (
    <>
      <h1 className="text-[20px] font-medium leading-tight text-foreground">
        Hi, I&apos;m Simon
      </h1>
      <p className="text-base leading-relaxed text-muted-foreground max-w-[768px]">
        I&apos;m a Staff Product Designer working on AI and developer platforms at IBM. I turn complex systems into clear, usable, and durable products. I&apos;m experienced across OSS, startups, and enterprise.
      </p>

      {/* Hover to info affordance */}
      <div
        className="h-9 -ml-3 pl-3 overflow-hidden"
        aria-hidden={!isHovered}
      >
        <div
          className={`flex items-center text-sm transition-all duration-300 ease-out ${
            isHovered
              ? "translate-y-0 opacity-100"
              : "translate-y-3 opacity-0 pointer-events-none"
          }`}
        >
          <Link
            href="/info"
            className="group/btn relative inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/[0.04] text-muted-foreground transition-all duration-200 ease-out hover:text-foreground hover:bg-white/[0.08]"
            tabIndex={isHovered ? 0 : -1}
          >
            <span>More Info</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-200 ease-out group-hover/btn:translate-x-1"
            >
              <path d="M18 8L22 12L18 16" />
              <path d="M2 12H22" />
            </svg>
          </Link>
        </div>
      </div>
    </>
  );

  if (!animate) {
    return (
      <div
        className="group relative space-y-4"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {content}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 1, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        ease: "easeOut",
      }}
      className="group relative space-y-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {content}
    </motion.div>
  );
}
