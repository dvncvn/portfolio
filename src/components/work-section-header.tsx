"use client";

import { useState, useEffect } from "react";
import { PresentationMode } from "@/components/presentation-mode";
import type { WorkProject } from "@/content/types";

type WorkSectionHeaderProps = {
  projects: WorkProject[];
};

export function WorkSectionHeader({ projects }: WorkSectionHeaderProps) {
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);

  const introText = {
    name: "Simon Duncan",
    bio: "I'm a Staff Product Designer working on AI and developer platforms at IBM. I turn complex systems into clear, usable, and durable products. I'm experienced across OSS, startups, and enterprise.",
  };

  return (
    <>
      <div className="mb-8 flex items-baseline justify-between">
        <h2 className="text-[14px] font-medium uppercase tracking-wide text-[#7D7D7D]">
          Work
        </h2>
        <button
          onClick={() => setIsPresentationOpen(true)}
          className="cursor-pointer text-[13px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
        >
          View as presentation
        </button>
      </div>

      <PresentationMode
        isOpen={isPresentationOpen}
        onClose={() => setIsPresentationOpen(false)}
        projects={projects}
        introText={introText}
      />
    </>
  );
}
