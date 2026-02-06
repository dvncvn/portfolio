"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import type { WorkProject } from "@/content/types";

// Lazy-load PresentationMode – it's ~1000 lines and pulls in many heavy deps
const PresentationMode = dynamic(
  () => import("@/components/presentation-mode").then((m) => ({ default: m.PresentationMode })),
  { ssr: false }
);

type WorkSectionHeaderProps = {
  projects: WorkProject[];
};

export function WorkSectionHeader({ projects }: WorkSectionHeaderProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);

  // Check URL for presentation param on mount
  useEffect(() => {
    if (searchParams.get("presentation") === "true") {
      setIsPresentationOpen(true);
    }
  }, [searchParams]);

  const openPresentation = () => {
    setIsPresentationOpen(true);
    router.push("/?presentation=true", { scroll: false });
  };

  const closePresentation = () => {
    setIsPresentationOpen(false);
    router.push("/", { scroll: false });
  };

  const introText = {
    name: "Simon Duncan",
    bio: "I'm a Staff Product Designer working on AI and developer platforms at IBM. I turn complex systems into clear, usable, and durable products. I'm experienced across OSS, startups, and enterprise.",
    personal: "Outside of product design, I'm a parent, husband, runner, musician, and D&D player. I spend a lot of time thinking about creativity, constraint, and sustainability. I make music that blends ambient, electronic, and guitar-driven textures, and I'm interested in long-term lifestyle design, balancing ambition with family, health, and creative output.",
    imageSrc: "/assets/profile.png",
  };

  return (
    <>
      <div className="mb-8 flex items-baseline justify-between">
        <h2 className="text-[14px] font-medium uppercase tracking-wide text-[#7D7D7D]">
          Work
        </h2>
        <button
          onClick={openPresentation}
          className="group inline-flex cursor-pointer items-center gap-2 rounded-md bg-[#121212] px-3 py-1.5 text-[13px] text-muted-foreground transition-all duration-200 hover:bg-[#1a1a1a] hover:text-[#01F8A5]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-200 group-hover:scale-110 group-hover:stroke-[#01F8A5]"
          >
            <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/>
          </svg>
          <span>Open Presentation</span>
        </button>
      </div>

      <PresentationMode
        isOpen={isPresentationOpen}
        onClose={closePresentation}
        projects={projects}
        introText={introText}
      />
    </>
  );
}
