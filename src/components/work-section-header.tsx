"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PresentationMode } from "@/components/presentation-mode";
import type { WorkProject } from "@/content/types";

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
          className="cursor-pointer text-[13px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
        >
          View as presentation
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
